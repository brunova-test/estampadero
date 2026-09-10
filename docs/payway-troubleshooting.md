# Payway: qué salió mal en la certificación y cómo no repetirlo

Este documento resume la cadena de errores que aparecieron al certificar el
Paso 1 de Payway ("Generar token y realizar pago") y la configuración final
que funciona, para no tener que redescubrirlo la próxima vez que se toque
esta integración (nueva certificación, nuevo ambiente, nuevas credenciales).

## Arquitectura correcta (la que quedó funcionando)

**La tokenización de la tarjeta es server-to-server, no browser-to-Payway.**

Esto es la causa raíz de casi todos los problemas: es tentador pensar que en
un modelo "No PCI" el navegador debe hablarle directo a Payway (así nunca
toca la tarjeta el backend). Pero para las credenciales de este comercio
(BASEPATH `api-homo.payway.com.ar`), el propio Payway rechaza por CORS
cualquier llamada de navegador a `/tokens` — el preflight explícitamente no
permite el header `apikey` para ese origen. Esto coincide con lo que dice la
documentación de Payway en "Requisitos técnicos": exige comunicación
server-to-server "independientemente del modelo de integración elegido".

Flujo real:

```text
Navegador
  → POST a nuestro propio backend (api.payments.tokenizeCard, tRPC)
    → nuestro servidor hace POST /tokens a Payway (server-to-server, sin CORS)
  ← el navegador recibe solo { id, bin }
  → POST a nuestro backend (api.payments.payWithCard)
    → nuestro servidor hace POST /payments a Payway con el token
```

Los datos de tarjeta (PAN, CVV) pasan por nuestro backend solo en memoria,
de paso hacia Payway — nunca se loguean ni se persisten. Ver
`src/server/modules/payments/infrastructure/providers/payway-gateway.ts`
(`paywayTokenizeCard` y `payWithCard`) y el router en
`src/server/modules/payments/presentation/router.ts`
(`tokenizeCard`, `payWithCard`).

`src/features/pay-with-payway-card/ui/PaywayCardForm.tsx` solo arma el
formulario y llama a esas dos mutaciones — no le habla a Payway directo, y
no depende de ningún SDK externo (`decidir.js` quedó descartado, ver más
abajo por qué).

## Configuración correcta

```env
PAYWAY_ENVIRONMENT="sandbox"
PAYWAY_PRIVATE_API_KEY="<key real del panel, no un placeholder>"
NEXT_PUBLIC_PAYWAY_ENVIRONMENT="sandbox"
NEXT_PUBLIC_PAYWAY_PUBLIC_API_KEY="<key real del panel, no un placeholder>"
NEXT_PUBLIC_PAYWAY_INSTALLMENTS="1,3,6"
```

- **Host (sandbox):** `https://api-homo.payway.com.ar/api/v2` para `/tokens`
  y `/payments`, ambos server-to-server. Es el BASEPATH que entrega el panel
  de certificación — no el genérico `developers-ventasonline.payway.com.ar`
  que aparece en los ejemplos de la documentación pública (ese host tiene
  CORS distinto y las credenciales de este comercio no son válidas ahí).
- **Header de autenticación:** `apikey` (todo minúscula, sin guión). *No*
  `X-Api-Key` ni `Authorization`. Aplica a todos los endpoints.
- Las variables `NEXT_PUBLIC_*` se hornean en el build de Next.js. Cambiarlas
  en Railway y no re-deployar (solo reiniciar) deja corriendo el build
  viejo con la key vieja — siempre hace falta un rebuild.
- El `.env` local nunca se sincroniza solo con las variables de Railway:
  hay que actualizar ambos lugares.

## Errores que aparecieron y su causa real

| Síntoma en consola | Causa real | Fix |
|---|---|---|
| `Cannot read properties of null (reading 'addEventListener')` en `share-modal.js` | Ruido de una extensión del navegador (no existe ningún archivo `share-modal` en este repo). | Ignorar. Confirmar en ventana de incógnito si genera dudas. |
| CORS bloqueado al hacer `fetch` directo a `/tokens` desde el navegador | Estábamos llamando a Payway directo desde el frontend. Ese host no soporta CORS de navegador para estas credenciales. | Mover la tokenización al backend (arquitectura de arriba). |
| `401` al usar el SDK `decidir.js` contra `developers.decidir.com` | Ese host es un sandbox genérico de demo; nuestra key no es válida ahí. `decidir.js` tampoco es parte de la integración documentada de Payway — es de otro producto. | Sacar `decidir.js`, usar `fetch`/tRPC propio. |
| CORS: `Content-Security-Policy` bloqueó la conexión (`connect-src`) | Nuestro propio middleware (`src/middleware.ts`) no tenía el host de Payway en la whitelist de `connect-src`. | Ya no aplica: al mover la tokenización al backend, el navegador no le habla a Payway, así que no hace falta whitelistear ningún host de Payway en el CSP. |
| `401 Invalid authentication credentials` | El `.env` tenía cargada la **key de ejemplo genérica** de la documentación (`e9cdb99f...`), no la key real del comercio. | Reemplazar por la key real del panel de certificación, en `.env` local **y** en las variables de Railway, y redeployar. |
| Preflight: `Request header field apikey is not allowed by Access-Control-Allow-Headers` contra `api-homo.payway.com.ar` | Ese host es server-to-server puro: no está pensado para que el navegador le hable directo, aunque el header y la key sean correctos. | Confirma la arquitectura de arriba: tokenizar desde el backend. |
| `400` con `validation_errors: [{code: "invalid_param", param: "security_code"}]` | El CVV no coincidía con el que exige la tarjeta de prueba específica del panel de certificación (cada tarjeta de prueba tiene un CVV fijo). | Usar exactamente los datos de prueba que muestra cada paso del panel — no un CVV inventado. |

## Cómo debuggear la próxima vez

1. **Pestaña Network del navegador**, filtrando por el nombre del endpoint
   (`tokens`, `payments`, `tokenizeCard`). Mirar el *Request URL* y la
   pestaña *Response* de la fila en rojo — no alcanza con leer la Console,
   ahí no aparece el cuerpo de la respuesta.
2. **Logs de Railway** (deploy logs del servicio, filtrando por `payway`):
   ahí quedan los `[payway diagnostic] <status> <path> body=...` que loguea
   `payway-gateway.ts` cuando Payway responde con error. Esto fue lo que
   finalmente reveló el problema del CVV — el navegador nunca mostró el
   detalle porque el error viajaba servidor a servidor.
3. Antes de sospechar del código, confirmar que las **credenciales y el
   host** en uso son los que figuran en el panel de certificación
   ("Credenciales y recursos útiles" → BASEPATH / API KEYS), no un ejemplo
   de la documentación pública ni un valor placeholder dejado por una
   integración anterior.

## Cierre de lote: la causa real del 400 "path_params_payment_id" en /refunds

Certificando el Caso 9 ("Devolución total") contra un pago recién aprobado
(mismo día), Payway rechazaba **todos** los intentos de
`POST /payments/{id}/refunds` con:

```json
{"error_type":"invalid_request_error","validation_errors":[{"code":"invalid_param","param":"path_params_payment_id"}]}
```

El mensaje sugiere que el `id` del pago en el path está mal, pero no es así:
`GET /payments/{id}` con el mismo id funciona perfecto, y otro pago que sí
estaba en un lote cerrado devolvía errores de negocio normales
(`invalid_status_error`, `amount` faltante) en vez de este. La causa real:
**Payway certification distingue "Anulación" (mismo día, lote abierto) de
"Devolución" (lote cerrado/liquidado)**, y un pago recién aprobado todavía
está en lote abierto. En producción el lote cierra solo sobre la noche; el
sandbox de certificación no espera un día real, así que hay que cerrarlo a
mano con el recurso que el SDK oficial (`sdk-node-payway`) sí documenta pero
que no estaba implementado acá:

```
POST /closures/batchclosure
{ "username": "...", "site_id": "...", "payment_method_id": 104 }
```

El cierre de lote requiere datos operativos que Payway entrega al comercio.
La aplicación no intenta inferirlos ni los reemplaza con variables locales.

## Pendiente / a vigilar

- El ejemplo oficial de `/tokens` en la documentación de Payway incluye los
  campos `card_holder_birthday` y `card_holder_door_number`, que el
  formulario actual no pide. No fueron necesarios para que el Paso 1
  aprobara, pero si un paso futuro de la certificación da un error de
  validación distinto, revisar si hace falta agregarlos.
- `docs/flujo-pago-tarjeta.md` describía la arquitectura vieja (SDK
  `decidir.js`, tokenización en el navegador). Se actualizó junto con este
  documento — si se vuelve a tocar el flujo de pago, mantener ambos en
  sincro.

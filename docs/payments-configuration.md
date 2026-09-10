# Pagos y distribución con Mobbex

Las compras nuevas se procesan mediante **Mobbex Marketplace con Split de Pagos**. El cliente ve un solo checkout y allí elige tarjeta de crédito, tarjeta de débito, cuotas o QR interoperable. El QR puede pagarse desde Mercado Pago, MODO y otras aplicaciones bancarias compatibles.

Mercado Pago y MODO no requieren botones ni integraciones independientes en la tienda para este flujo: aparecen como aplicaciones desde las cuales se escanea o abre el QR interoperable de Mobbex. La disponibilidad final de tarjetas, cuotas y QR depende de los medios que Mobbex habilite comercialmente para la entidad originante.

## Alta comercial

Antes de pasar a producción se debe solicitar a Mobbex:

1. Alta de **Marketplace con Split de Pagos** para El Estampadero como originante.
2. Alta y autorización de cada club, gimnasio o socio como entidad vendedora.
3. Habilitación de tarjetas de crédito y débito, planes de cuotas y QR interoperable.
4. Confirmación de aranceles, plazos de acreditación, devoluciones y tratamiento del costo financiero de las cuotas.

Cada participante debe tener CUIT y una cuenta activa en Mobbex. Desde el Portal de Desarrolladores, la aplicación del originante solicita acceso a cada entidad y esa entidad autoriza la aplicación desde su consola.

## Variables del servidor

Configurar en el entorno del hosting:

```env
MOBBEX_API_KEY="..."
MOBBEX_ACCESS_TOKEN="..."
MOBBEX_ENTITY_ID="..."
MOBBEX_TEST_MODE="true"
APP_URL="https://dominio-publico.example"
```

- `MOBBEX_API_KEY` identifica la aplicación.
- `MOBBEX_ACCESS_TOKEN` autoriza a operar con la entidad originante.
- `MOBBEX_ENTITY_ID` es el UID de la entidad de El Estampadero.
- `MOBBEX_TEST_MODE` debe permanecer en `true` durante la homologación y cambiar a `false` al usar credenciales productivas.
- `APP_URL` debe ser una URL pública HTTPS. Mobbex la utiliza para volver al pedido y enviar notificaciones.

Las credenciales son privadas. No deben agregarse a variables `NEXT_PUBLIC_`, al repositorio ni al código del navegador. Las credenciales demo publicadas por Mobbex sirven solamente para pruebas generales; el split real requiere que las entidades estén autorizadas para la aplicación.

## Configuración de los socios

En la administración de cada club se debe guardar su **UID de entidad Mobbex**. También debe existir un convenio activo que defina el porcentaje correspondiente al club para cada producto.

### Vinculación desde el portal del club

El portal privado incluye la sección **Cobros**, que guía al representante por el alta sin solicitar credenciales privadas. El circuito registrado en la base es:

1. El club indica si ya tiene cuenta Mobbex.
2. Carga razón social, CUIT, responsable, correo, teléfono y, si lo conoce, el UID de entidad.
3. El administrador revisa los datos, solicita acceso por CUIT desde el Portal de Desarrolladores y marca la solicitud como enviada.
4. El club autoriza a El Estampadero desde `APP/E-Commerce` en su consola Mobbex y confirma el paso en su portal.
5. El administrador verifica el UID y activa los cobros.

El panel administrativo permite copiar un mensaje de invitación para enviarlo al club. API Key, Access Token, contraseña y PIN nunca se solicitan ni almacenan como parte de este proceso.

Al crear el checkout, el servidor agrupa los productos por club y genera el array `split`:

- `total`: importe bruto de los productos de ese club.
- `fee`: parte del importe que conserva El Estampadero según el convenio.
- `entity`: UID Mobbex del club.
- `reference`: referencia única del club dentro del pedido.

Los productos sin club y el costo de envío se asignan a la entidad originante. La suma de todos los campos `total` debe coincidir exactamente con el total del checkout y Mobbex admite hasta 50 entradas de split.

La asignación de una parte del split a la misma entidad originante fue aceptada por la API sandbox de Mobbex. Esta representación permite procesar pedidos mixtos con productos propios y productos de socios mientras el split cubre el total completo.

## Flujo implementado

1. La tienda crea primero el pedido pendiente y un intento de pago local idempotente.
2. El servidor resuelve los convenios vigentes y genera el split en importes enteros de centavos.
3. El servidor crea el checkout con `POST https://api.mobbex.com/p/checkout`.
4. El navegador abre el checkout embebido con `https://api.mobbex.com/p/embed/1.2.0/lib.js`. Si el SDK no puede cargarse, se usa la URL alojada que devuelve Mobbex.
5. El cliente elige tarjeta, cuotas o QR interoperable dentro del checkout.
6. Mobbex notifica a `https://DOMINIO/api/webhooks/mobbex`.
7. La tienda consulta `GET /p/operations/{ID}` con sus credenciales y valida referencia, moneda, importe y estado antes de marcar el pedido como pagado.
8. Una tarea de conciliación vuelve a consultar pagos pendientes si se perdió o demoró un webhook.

El callback del checkout en el navegador solo actualiza la interfaz. Nunca se usa como prueba de que el pago fue aprobado.

## Estados y comisiones

Los estados pagados documentados por Mobbex (`200`, `201`, `300`, `301` y `302`) se convierten en pago aprobado. Los estados intermedios permanecen pendientes o en proceso; los rechazos, vencimientos, cancelaciones y devoluciones se registran con su estado correspondiente.

Mobbex realiza la distribución monetaria. El libro interno de comisiones conserva el detalle contable de cada club, pero las comisiones de una venta Mobbex nacen como liquidadas para evitar generar una segunda transferencia manual.

## Devoluciones

Las devoluciones se solicitan a Mobbex sobre la operación original. Antes de habilitarlas en producción se deben probar devoluciones totales y parciales y confirmar cómo Mobbex revierte cada operación hija y el `fee`.

La documentación indica que QR interoperable, DEBIN y efectivo no admiten devolución mediante esta API. Para esos medios se debe acordar con Mobbex el procedimiento operativo y mostrarlo al administrador antes de intentar una devolución automática.

## Homologación mínima

Probar con la configuración real del marketplace en sandbox:

- pedido compuesto solo por productos propios;
- pedido de un club;
- pedido de varios clubes;
- pedido mixto con productos propios, productos de socios y envío;
- redondeo de porcentajes y total exacto del split;
- crédito en un pago y en cuotas;
- débito;
- QR pagado desde Mercado Pago;
- QR pagado desde MODO;
- pago aprobado, rechazado, pendiente y vencido;
- webhook duplicado y webhook perdido;
- devolución total y parcial para cada medio compatible.

Los adaptadores anteriores de Mercado Pago, Payway y MODO se conservan únicamente para consultar o devolver pagos históricos ya registrados. Las compras nuevas usan el checkout Mobbex.

Documentación oficial utilizada: [Marketplace y Multivendor](https://mobbex.dev/marketplace), [Integración embebida](https://mobbex.dev/integracion-embebida) y [Portal de desarrolladores](https://mobbex.dev/).

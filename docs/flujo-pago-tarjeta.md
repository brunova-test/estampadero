# Flujo completo del pago con tarjeta

Este documento explica qué ocurre desde que el cliente confirma el checkout hasta que el pedido queda aprobado y marcado como pagado.

El flujo de tarjeta utiliza **Payway** y funciona de forma síncrona: el navegador tokeniza la tarjeta, el backend envía el token a Payway y Payway devuelve el resultado de la operación.

## Resumen del flujo

```text
Checkout
  ↓
Se valida carrito, precios y stock
  ↓
Se crea el pedido como PENDING_PAYMENT
  ↓
El cliente abre la pantalla del pedido
  ↓
Selecciona Tarjeta
  ↓
Payway tokeniza la tarjeta en el navegador
  ↓
El frontend envía token + BIN al backend
  ↓
El backend crea Payment en la base de datos
  ↓
El backend envía el token a Payway
  ↓
Payway responde APPROVED, PENDING o REJECTED
  ↓
Si es APPROVED: Payment = APPROVED y Order = PAID
  ↓
Se generan comisiones, producción y comprobante
```

## 1. Creación del pedido

El proceso comienza en:

- `src/views/checkout/ui/CheckoutView.tsx`

La función `handleSubmit` recoge los datos del comprador y las líneas del carrito. Antes de enviarlos, `validateFields` verifica nombre, email, teléfono y dirección.

Luego ejecuta:

```ts
submitCheckout.mutate({...})
```

La mutación corresponde al router:

- `src/server/modules/checkout/presentation/router.ts`

El router llama al caso de uso:

- `src/server/modules/checkout/application/use-cases/submit-checkout.ts`

### Funciones principales de `submitCheckout`

1. Comprueba que el carrito no esté vacío.
2. Consulta nuevamente los productos y sus precios.
3. Verifica que los productos existan.
4. Verifica el stock.
5. Calcula subtotal, envío y total.
6. Construye una fotografía inmutable de los productos comprados.
7. Llama a `createOrder`.

El pedido se guarda mediante:

- `src/server/modules/orders/infrastructure/persistence/prisma-orders-repository.ts`

Dentro de una transacción se realizan estas operaciones:

1. Se descuenta el stock.
2. Se crea el registro `Order`.
3. Se crean los `OrderItem`.
4. Se crea el historial inicial del pedido.

El pedido comienza con:

```text
Order.status = PENDING_PAYMENT
```

Los modelos están definidos en:

- `prisma/schema.prisma`

## 2. Pantalla del pedido

Después de crear el pedido, el navegador navega a:

```text
/pedido/{orderId}
```

La pantalla principal es:

- `src/views/order-confirmation/ui/OrderConfirmationView.tsx`

Como el pedido está pendiente, muestra:

- `src/widgets/payment-method-panel/ui/PaymentMethodPanel.tsx`

Este componente permite elegir entre:

- Mercado Pago.
- Tarjeta.
- MODO.

Cuando se selecciona tarjeta, se renderiza:

- `src/features/pay-with-payway-card/ui/PaywayCardForm.tsx`

## 3. Formulario de tarjeta

`PaywayCardForm` muestra los campos de:

- Número de tarjeta.
- Fecha de vencimiento.
- Código de seguridad.
- Titular.
- Documento.
- Tipo de tarjeta.
- Cuotas.

Los métodos configurados son:

| Identificador | Método |
|---|---|
| `1` | Visa crédito |
| `104` | Mastercard crédito |
| `31` | Visa débito |
| `105` | Mastercard débito |

El componente no carga ningún SDK externo de Payway. Arma el pedido de
tokenización con los valores del formulario y se lo pasa directo a la
mutación tRPC `payments.tokenizeCard` (ver punto 4). Ver
`docs/payway-troubleshooting.md` para el porqué: Payway no permite que el
navegador le hable directo a `/tokens` con las credenciales de este
comercio, así que la tokenización también es server-to-server.

## 4. Tokenización de la tarjeta

Cuando el cliente presiona “Pagar”, se ejecuta:

```ts
submitPayment(event)
```

Esta función:

1. Evita el envío normal del formulario.
2. Lee los valores del formulario (número, vencimiento, CVV, titular, documento).
3. Ejecuta `tokenizeCard.mutateAsync({...})`, una mutación tRPC definida en
   `src/server/modules/payments/presentation/router.ts`.

Esa mutación llama a `paywayTokenizeCard` en
`src/server/modules/payments/infrastructure/providers/payway-gateway.ts`,
que desde el servidor hace `POST /tokens` contra Payway (server-to-server,
con la Public API Key en el header `apikey`) y devuelve al frontend:

- Un token de pago de un solo uso.
- El BIN de la tarjeta.

Los datos sensibles (PAN, CVV) viajan del navegador a nuestro propio
backend y de ahí a Payway, sin loguearse ni persistirse en ningún punto del
camino. La tienda no guarda el número completo de tarjeta ni el CVV.

Después de obtener el token, `clearSensitiveFields` limpia del formulario el número de tarjeta y el código de seguridad.

## 5. Llamada del frontend al backend

Si la tokenización fue correcta, el formulario ejecuta:

```ts
payWithCard.mutateAsync({...})
```

La mutación está definida en:

- `src/server/modules/payments/presentation/router.ts`

Los datos enviados son:

- `orderId`
- `cardToken`
- `bin`
- `paymentMethodId`
- `installments`
- `payerDocType`
- `payerDocNumber`

El endpoint tiene un límite de cinco intentos cada diez minutos por pedido y dirección IP.

## 6. Caso de uso `payWithCard`

El caso de uso está en:

- `src/server/modules/payments/application/use-cases/pay-with-card.ts`

La función principal es:

```ts
payWithCard(deps)
```

Primero obtiene el pedido mediante `getOrderById` y verifica:

1. Que el pedido exista.
2. Que siga en estado `PENDING_PAYMENT`.
3. Que Payway esté correctamente configurado.

Si el pedido ya no está pendiente, el sistema no intenta realizar otro cobro.

## 7. Creación del intento de pago local

Antes de llamar a Payway, el sistema crea un registro `Payment` en la base de datos.

La implementación está en:

- `src/server/modules/payments/infrastructure/persistence/prisma-payments-repository.ts`

Se guardan estos datos:

```text
orderId
channel = CARD
provider = PAYWAY
processor = PAYWAY
amountInCents
currency = ARS
status = CREATED
idempotencyKey
```

El modelo `Payment` está definido en `prisma/schema.prisma`.

Los importes se manejan en centavos. Por ejemplo:

```text
$10.000 = 1.000.000 centavos
```

## 8. Envío del pago a Payway

El caso de uso llama a la abstracción:

```ts
gateway.payWithCard(...)
```

La implementación concreta está en:

- `src/server/modules/payments/infrastructure/providers/payway-gateway.ts`

La función `payWithCard` de Payway:

1. Valida las credenciales privadas.
2. Verifica que el BIN tenga entre 6 y 8 dígitos.
3. Verifica el método de tarjeta.
4. Verifica las cuotas permitidas.
5. Fuerza una cuota para tarjetas de débito.
6. Ejecuta `POST /payments` contra Payway.

El cuerpo enviado contiene principalmente:

```ts
{
  site_transaction_id: payment.id,
  site_id: siteId,
  token: cardToken,
  payment_method_id: paymentMethodId,
  bin,
  amount,
  currency: "ARS",
  installments,
  customer: {
    id: payment.id,
    email: payerEmail
  }
}
```

La función `paywayRequest` agrega la API key privada, headers, timeout y realiza la petición HTTP.

## 9. Normalización de la respuesta

Payway devuelve estados propios. La función `toProviderPaymentResult` los convierte a estados internos:

| Estado Payway | Estado interno |
|---|---|
| `approved` | `APPROVED` |
| `pre_approved` | `PROCESSING` |
| `review` | `PROCESSING` |
| `pending` | `PENDING` |
| `rejected` | `REJECTED` |
| `cancelled` | `CANCELLED` |
| `refunded` | `REFUNDED` |
| `partially_refunded` | `PARTIALLY_REFUNDED` |

También se extraen:

- ID del pago en Payway.
- Importe.
- Moneda.
- Método de tarjeta.
- Cuotas.
- Fecha estimada de liberación.
- Importe reembolsado.

## 10. Sincronización de datos

El caso de uso llama a:

```ts
repository.syncProviderDetails(...)
```

Esto guarda en `Payment`:

- `providerPaymentId`
- `providerStatus`
- `paymentMethodType`
- `paymentMethodId`
- `installments`
- `moneyReleaseDate`
- Comisiones.
- Importe neto recibido.
- Importes reembolsados.

## 11. Aprobación definitiva

Si el estado normalizado es `APPROVED`, se ejecuta:

```ts
repository.markApprovedAndPayOrder(...)
```

La función está en:

- `src/server/modules/payments/infrastructure/persistence/prisma-payments-repository.ts`

Se utiliza una transacción de base de datos:

1. Se cambia `Payment.status` a `APPROVED`.
2. Se guarda el ID del pago de Payway.
3. Se guarda el estado original de Payway.
4. Se establece `approvedAt`.
5. Se cambia el pedido de `PENDING_PAYMENT` a `PAID`.
6. Se agrega un registro en `OrderStatusHistory`.

La actualización solo se realiza si el pago no estaba aprobado previamente. Esto hace que el proceso sea idempotente y evita duplicar efectos.

## 12. Efectos posteriores

Cuando el pago fue aprobado por primera vez, se ejecuta:

- `src/server/modules/payments/infrastructure/order-paid-effects.ts`

La función es:

```ts
runOrderPaidEffects(order)
```

Ejecuta:

1. `generateCommissionEntriesForOrderUseCase(order)`
   - Genera las comisiones para los clubes.
2. `assignOrderToOpenBatchUseCase(order.id)`
   - Asigna el pedido a una tanda de producción.
3. `sendOrderReceiptEmail(order)`
   - Envía el comprobante por email.

Si el email falla, el pedido sigue considerándose pagado.

## 13. Actualización de la pantalla

El backend devuelve al frontend:

```ts
{
  status: "APPROVED",
  providerStatus: "approved"
}
```

`PaywayCardForm` muestra “¡Pago aprobado!” y ejecuta `onApproved`.

`PaymentMethodPanel` configuró `onApproved` como:

```ts
router.refresh()
```

La pantalla vuelve a consultar el pedido y ahora muestra:

- Estado `PAID`.
- Comprobante.
- Medio de pago.
- Tipo de tarjeta.
- Cantidad de cuotas.

## Estados alternativos

### Pago pendiente o en procesamiento

Si Payway devuelve `pending`, `pre_approved` o `review`:

- El `Payment` queda como `PENDING` o `PROCESSING`.
- El pedido sigue como `PENDING_PAYMENT`.
- El usuario ve que el pago está siendo procesado.

### Pago rechazado

Si Payway devuelve `rejected`:

- El `Payment` queda como `REJECTED`.
- Se guarda `rejectedAt`.
- El pedido permanece pendiente.
- El cliente puede volver a intentar.

## Conciliación posterior

El módulo de pagos también configura una conciliación periódica:

- `src/server/modules/payments/application/use-cases/reconcile-payments.ts`
- `src/server/modules/payments/index.ts`
- `src/app/api/cron/reconcile-payments/route.ts`

Para Payway, la conciliación vuelve a consultar pagos que hayan quedado pendientes o en procesamiento.

La conciliación sirve como respaldo ante errores de red o respuestas incompletas.

## Mercado Pago y MODO

El flujo de Mercado Pago es diferente:

1. Se crea una preferencia.
2. El cliente es redirigido a Mercado Pago.
3. Mercado Pago envía un webhook.
4. Se valida la firma del webhook.
5. El backend consulta el estado real a Mercado Pago.
6. Se reutiliza `markApprovedAndPayOrder`.

Archivos principales:

- `src/features/pay-with-mp-wallet/ui/PayWithMercadoPagoButton.tsx`
- `src/server/modules/payments/application/use-cases/create-checkout-session.ts`
- `src/server/modules/payments/infrastructure/providers/mercado-pago-gateway.ts`
- `src/app/api/webhooks/mercado-pago/route.ts`
- `src/server/modules/payments/application/use-cases/process-webhook-event.ts`

MODO tiene una estructura similar, pero actualmente permanece deshabilitado hasta configurar credenciales e integración real.

## Archivos principales del flujo de tarjeta

1. `src/views/checkout/ui/CheckoutView.tsx`
2. `src/server/modules/checkout/presentation/router.ts`
3. `src/server/modules/checkout/application/use-cases/submit-checkout.ts`
4. `src/server/modules/orders/infrastructure/persistence/prisma-orders-repository.ts`
5. `src/views/order-confirmation/ui/OrderConfirmationView.tsx`
6. `src/widgets/payment-method-panel/ui/PaymentMethodPanel.tsx`
7. `src/features/pay-with-payway-card/ui/PaywayCardForm.tsx`
8. `src/server/modules/payments/presentation/router.ts`
9. `src/server/modules/payments/application/use-cases/pay-with-card.ts`
10. `src/server/modules/payments/infrastructure/providers/payway-gateway.ts`
11. `src/server/modules/payments/infrastructure/persistence/prisma-payments-repository.ts`
12. `src/server/modules/payments/infrastructure/order-paid-effects.ts`
13. `prisma/schema.prisma`


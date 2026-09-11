# El Estampadero

Tienda online construida con Next.js, Prisma, PostgreSQL, NextAuth, tRPC y Mercado Pago.

## Desarrollo local

```bash
npm install
copy .env.example .env
npm run db:generate
npm run db:migrate
npm run dev
```

Completá `.env` con los valores locales antes de iniciar la aplicación.

## Arquitectura de producción

El despliegue recomendado usa Railway para ejecutar la aplicación y Supabase
para PostgreSQL:

1. **Web**: la aplicación Next.js.
2. **Supabase PostgreSQL + Supavisor**: base de datos y pool de conexiones.
3. **Cron**: servicio efímero que ejecuta la reconciliación diaria de pagos.

Railway puede detectar el proyecto automáticamente, pero el repositorio incluye
`railway.json` para dejar explícitos el build, las migraciones, el healthcheck y
el comando de inicio.

## Servicio Web

Configurá el servicio conectado al repositorio con:

- Root directory: la raíz del repositorio.
- Build command: `npm run build`.
- Pre-deploy command: `npx prisma migrate deploy`.
- Start command: `npm run start`.
- Healthcheck path: `/`.

El build genera una imagen Next.js standalone y el servicio se inicia con
`.next/standalone/server.js`.

## Base de datos

En Supabase copiá desde **Connect** dos cadenas de conexión: Transaction pooler
(puerto `6543`) para `DATABASE_URL` y Session pooler (puerto `5432`) para
`DIRECT_URL`. La aplicación detecta el puerto transaccional, activa el modo
PgBouncer de Prisma y limita cada réplica a 10 conexiones por defecto.

Las migraciones usan automáticamente `DIRECT_URL`. Si una migración falla, el
despliegue no debe pasar a servir la nueva versión.

Para trasladar los datos existentes desde Railway, seguí la guía de
[migración Railway → Supabase](docs/migracion-railway-supabase.md).

No ejecutes `prisma db push` en producción. Para cambios de esquema:

```bash
npx prisma migrate dev --name nombre-del-cambio
```

Subí la carpeta `prisma/migrations` al repositorio. Railway ejecutará las
migraciones pendientes antes de iniciar la nueva versión.

## Servicio Cron

Creá un segundo servicio desde el mismo repositorio y configurá:

- Start command: `npm run cron:reconcile`.
- Cron schedule: `0 * * * *` (cada hora).
- `APP_URL`: dominio público del servicio Web.
- `CRON_SECRET`: el mismo secreto configurado en el servicio Web.

El horario usa UTC. El comando llama a
`/api/cron/reconcile-payments`, envía el bearer token y termina al finalizar.
Además de conciliar pagos, cancela pedidos que lleven más de
`UNPAID_ORDER_EXPIRATION_HOURS` sin pago confirmado y devuelve su stock. Antes
de liberar una reserva vuelve a comprobar el estado del proveedor y protege los
intentos de pago recientes.
El servicio cron no debe usar `npm run start`, porque ese comando inicia el
servidor web y nunca termina.

## Variables de entorno

Configurá estas variables en el servicio Web y replicá en el servicio Cron las
que estén marcadas como compartidas:

### Obligatorias

- `DATABASE_URL` — Supabase Transaction pooler, puerto `6543`; uso de la app.
- `DIRECT_URL` — Supabase Session pooler, puerto `5432`; uso de Prisma Migrate.
- `PRISMA_CONNECTION_LIMIT=10` — máximo de conexiones por réplica Web.
- `PRISMA_POOL_TIMEOUT_SECONDS=15` — espera máxima por una conexión libre.
- `UNPAID_ORDER_EXPIRATION_HOURS=24` — antigüedad para cancelar pedidos impagos
  y devolver el stock reservado.
- `AUTH_SECRET` — secreto aleatorio largo.
- `AUTH_TRUST_HOST=true` — necesario detrás del proxy público de Railway.
- `AUTH_URL` — URL pública de la aplicación.
- `APP_URL` — URL pública del servicio Web.
- `CRON_SECRET` — secreto aleatorio de al menos 16 caracteres.

### Google login

- `AUTH_GOOGLE_ID`
- `AUTH_GOOGLE_SECRET`

En Google Cloud Console agregá como redirect URI:
`https://TU_DOMINIO.com/api/auth/callback/google`.

### Mercado Pago

- `MERCADOPAGO_ACCESS_TOKEN`
- `MERCADOPAGO_WEBHOOK_SECRET`
- `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY`

Configurá en Mercado Pago el webhook:
`https://TU_DOMINIO.com/api/webhooks/mercado-pago`.

La clave pública se usa solamente en el navegador para tokenizar la tarjeta.
El access token y el secreto del webhook son privados y deben configurarse
únicamente en el servidor. El checkout permite crédito, débito y cuotas sin
obligar al comprador a abrir una cuenta de Mercado Pago.

En el panel de Mercado Pago habilitá las notificaciones de pagos para la URL
anterior. El cron `/api/cron/reconcile-payments` debe ejecutarse diariamente:
además de recuperar webhooks perdidos, consulta cuándo Mercado Pago libera el
dinero. Una participación de club solo queda disponible cuando el pago fue
liberado, el pedido fue entregado y terminó el plazo de devolución configurado.
Los reintegros aprobados desde `/admin/devoluciones` vuelven al mismo medio de
pago y generan el ajuste correspondiente en la liquidación del club.

### MODO / Payway

Opcionales hasta habilitar el medio de pago:

- `MODO_STORE_ID`
- `MODO_API_KEY`
- `MODO_WEBHOOK_SECRET`

## Seed y datos iniciales

`npm run db:seed` crea datos demo, usuarios demo, productos y órdenes de prueba.
No debe ejecutarse automáticamente durante un deploy ni contra producción sin
una revisión explícita.

El seed exige contraseñas de al menos 16 caracteres y bloquea producción salvo
que se configure temporalmente:

```env
SEED_PRODUCTION_CONFIRMATION=I_UNDERSTAND_THIS_SEEDS_PRODUCTION
```

Nunca se deben usar contraseñas de ejemplo en producción. Después de ejecutar el
seed, eliminá la variable de confirmación y las variables `SEED_*` del ambiente.
El seed no imprime contraseñas en los logs.

## Ambientes

Usá ambientes separados para producción y staging. Nunca conectes el staging a
la base de datos productiva: una migración o un seed de prueba podría modificar
datos reales.

## Checklist de cada despliegue

1. Confirmar variables del ambiente correcto.
2. Confirmar que `DATABASE_URL` apunta a la base correspondiente.
3. Revisar las migraciones pendientes.
4. Verificar OAuth, medios de pago, PgBouncer y el servicio cron.
5. Probar login, catálogo, carrito, checkout y panel administrativo.

Las variables secretas no deben subirse al repositorio. `.env.example` es solo
la plantilla que debe mantenerse actualizada.

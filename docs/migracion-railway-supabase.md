# Migrar PostgreSQL de Railway a Supabase

La aplicación sigue desplegada en Railway. Solo cambia el proveedor de
PostgreSQL: Prisma y Auth.js continúan funcionando como hasta ahora.

## Conexiones que se necesitan

- `SOURCE_DATABASE_URL`: URL **pública y directa** de PostgreSQL en Railway.
  No sirve un host privado terminado en `.railway.internal` desde una máquina
  externa.
- `TARGET_DATABASE_URL`: **Session pooler** de Supabase, puerto `5432`. Se usa
  para `pg_restore`, Prisma Migrate y la verificación.
- `DATABASE_URL`: **Transaction pooler** de Supabase, puerto `6543`. Se usa en
  tiempo de ejecución por los servicios Web y Cron.
- `DIRECT_URL`: la misma URL de `TARGET_DATABASE_URL`. Se usa únicamente para
  migraciones de Prisma.

Las URLs se copian desde **Connect** en el proyecto de Supabase. Reemplazar
`[YOUR-PASSWORD]` por la contraseña de la base y mantener `sslmode=require` si
aparece en la cadena. No guardar ninguna URL real en Git.

## Antes de copiar datos

1. Confirmar la versión y el tamaño del origen.
2. Comparar las extensiones instaladas en Railway con las disponibles en
   Supabase.
3. Tomar un backup verificable de Railway.
4. Hacer primero un ensayo sin detener producción.
5. Usar un destino vacío. Si el proyecto de Supabase ya tiene tablas o datos,
   crear otro proyecto vacío o revisar y limpiar el destino manualmente. No
   restaurar encima: puede mezclar datos o fallar por claves duplicadas.

El repositorio no automatiza el borrado del destino ni pone producción en modo
solo lectura. Son operaciones destructivas que deben aprobarse y ejecutarse
manualmente.

## Exportar e importar

Instalar las herramientas cliente de PostgreSQL de la misma versión mayor que
el origen. Para una base pequeña, el formato personalizado simplifica el flujo:

```powershell
$env:SOURCE_DATABASE_URL = "URL_PUBLICA_DIRECTA_DE_RAILWAY"
$env:TARGET_DATABASE_URL = "URL_SESSION_POOLER_SUPABASE_5432"

pg_dump `
  --dbname $env:SOURCE_DATABASE_URL `
  --format custom `
  --no-owner `
  --no-privileges `
  --no-subscriptions `
  --schema public `
  --file elestampadero.dump

pg_restore `
  --dbname $env:TARGET_DATABASE_URL `
  --format custom `
  --no-owner `
  --no-privileges `
  --single-transaction `
  --exit-on-error `
  elestampadero.dump
```

La restauración usa Session pooler porque Transaction pooler no soporta las
operaciones de sesión que necesita `pg_restore`.

## Verificar el ensayo

El verificador es de solo lectura. Compara tablas, columnas, checksums de las
migraciones de Prisma y conteos exactos de filas:

```powershell
$env:SOURCE_DATABASE_URL = "URL_PUBLICA_DIRECTA_DE_RAILWAY"
$env:TARGET_DATABASE_URL = "URL_SESSION_POOLER_SUPABASE_5432"
npm run db:verify-migration
```

También conviene probar con la aplicación apuntando temporalmente a Supabase:

1. Healthcheck.
2. Login con contraseña y Google.
3. Catálogo, carrito y checkout de prueba.
4. Webhooks de pago.
5. Panel administrativo.
6. Servicios Cron.

## Corte de producción

1. Anunciar una ventana de mantenimiento y detener Web y Cron para impedir
   nuevas escrituras en Railway.
2. Crear un dump final del origen y restaurarlo sobre el destino vacío.
3. Ejecutar `npm run db:verify-migration`; no continuar si informa diferencias.
4. En los servicios Web y Cron de Railway configurar:

   ```env
   DATABASE_URL=URL_TRANSACTION_POOLER_SUPABASE_6543
   DIRECT_URL=URL_SESSION_POOLER_SUPABASE_5432
   PRISMA_CONNECTION_LIMIT=10
   PRISMA_POOL_TIMEOUT_SECONDS=15
   ```

5. Eliminar `DATABASE_UNPOOLED_URL` una vez verificado el cambio. Solo se
   conserva temporalmente como compatibilidad con la configuración anterior.
6. Desplegar. El pre-deploy ejecuta `prisma migrate deploy` mediante
   `DIRECT_URL` y luego inicia la aplicación con el pool transaccional.
7. Repetir las pruebas críticas y vigilar errores de conexión, pagos y Cron.
8. Mantener Railway PostgreSQL sin escrituras durante el período de rollback;
   no eliminarlo hasta confirmar que Supabase es estable.

## Rollback

Si la verificación posterior falla, detener Web y Cron, restaurar las variables
de conexión de Railway y volver a desplegar. Cualquier escritura aceptada por
Supabase después del corte debe reconciliarse antes del rollback para no perder
datos.

## Seguridad de Supabase

La aplicación usa una conexión PostgreSQL del servidor, no `supabase-js` ni la
Data API. Mantener la Data API deshabilitada para `public` o sin permisos para
`anon` y `authenticated`. Si en el futuro se expone una tabla por REST o
GraphQL, definir permisos y políticas RLS específicas antes de habilitarla.

El Security Advisor del proyecto debe quedar sin funciones `SECURITY DEFINER`
ejecutables por usuarios públicos. Si la app seguirá usando solo Prisma, aplicar
manualmente desde el SQL Editor:

```sql
revoke all privileges on all tables in schema public from anon, authenticated;
revoke all privileges on all sequences in schema public from anon, authenticated;
revoke execute on all functions in schema public from public, anon, authenticated;
```

Esto no afecta la conexión privada de Prisma con el usuario de base de datos.
Volver a ejecutar los advisors de seguridad después del cambio.

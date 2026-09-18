# El Estampadero

El desarrollo del proyecto comenzó aproximadamente el **17 de agosto**.
Estará disponible un tiempo determinado a publico este respositorio, lo mismo que railway, recomiendo descargarlo y trabajar de manera local o subirlo donde quiera.
Pronto volverá a ser privado. Cuando suceda pedir autorización para acceder.
## Probar el sistema integrado

Acceder a la [versión de prueba de El Estampadero](https://elestampadero-version3.up.railway.app/) para recorrer el sistema integrado.

Para probar la administración, abrir [Ingresar](https://elestampadero-version3.up.railway.app/ingresar) y utilizar las credenciales de demostración:

| Dato       | Valor                      |
| ---------- | -------------------------- |
| Correo     | `admin@elestampadero.com`  |
| Contraseña | `AdminDemo123!estampadero` |

Después de ingresar, acceder al [panel administrativo](https://elestampadero-version3.up.railway.app/admin). Estas credenciales corresponden al ambiente de prueba indicado; una instalación nueva requiere crear su administrador o ejecutar el seed con las variables correspondientes.

## IMPORTANTE: descarga, puesta en marcha y estado del proyecto

**El proyecto puede descargarse como ZIP o clonarse desde GitHub y levantarse en un entorno propio.** Para ponerlo en marcha, copiar `.env.example` a `.env`, completar o reemplazar las variables con los datos del nuevo ambiente, disponer de una base PostgreSQL accesible, instalar las dependencias y aplicar las migraciones. Con estos requisitos configurados, se puede iniciar la aplicación siguiendo la [instalación local paso a paso](#4-instalación-local-paso-a-paso).

No es necesario modificar el código para configurar las conexiones y credenciales previstas en las variables de entorno. Las funciones de pagos, ingreso con Google y correo requieren además las credenciales y configuraciones externas correspondientes.

**El proyecto continúa en desarrollo y puede requerir cambios y adaptaciones a medida que avance su implementación.** Quedan por evaluar mejoras de rendimiento y optimización, incluyendo consultas a la base, carga de imágenes y recursos, tiempos de respuesta y comportamiento bajo mayor volumen de usuarios y pedidos. Estas mejoras deben definirse a partir de mediciones y pruebas; no se presentan como optimizaciones ya realizadas ni como garantía de capacidad en producción.

También debe revisarse la adaptación del flujo de pagos y distribución de dinero con Mobbex, según la advertencia específica de esta guía.

Plataforma de venta y gestión de indumentaria deportiva, institucional y personalizada. Reúne una tienda pública, un panel administrativo y un portal privado para clubes e instituciones.

Un pedido puede combinar productos propios y productos de distintos clubes. Las compras nuevas se cobran mediante **Mobbex**, y el servidor calcula la distribución entre El Estampadero y cada institución según su convenio. Después del pago se registran las participaciones y el pedido se incorpora al circuito de producción.

Repositorio: [brunova-test/estampadero](https://github.com/brunova-test/estampadero).

Esta guía describe el código del repositorio. Las integraciones externas requieren credenciales, altas comerciales y pruebas por ambiente; su presencia en el código no confirma que una cuenta esté habilitada para operar.

## IMPORTANTE: revisar pagos y distribución antes de completar Mobbex

> **Se debe analizar la implementación actual de Mercado Pago, Payway y MODO antes de dar por terminada la integración de Mobbex.** El cambio de distribución del dinero puede requerir modificar toda la sección de pagos: checkout, confirmación, comisiones, liquidaciones y devoluciones. Tener código de Mobbex no significa que la transición esté cerrada ni homologada para producción.

El panel de pago actual abre Mobbex para compras nuevas, pero el repositorio conserva adaptadores, procedimientos y estados de Mercado Pago, Payway y MODO. Es necesario comprobar cuáles se utilizan en el ambiente desplegado, si hay pagos pendientes o históricos y qué reglas de negocio deben mantenerse o reemplazarse.

Esta guía explica el comportamiento observado hoy. Las secciones de Mobbex, split y participaciones deberán actualizarse si cambia el modelo final de distribución. No eliminar integraciones, credenciales o datos históricos únicamente porque el nuevo checkout utilice Mobbex.

### Qué debe analizarse

1. **Cobro y checkout:** cómo se inicia cada pago, qué proveedor lo procesa y qué sucede con intentos pendientes durante la transición.
2. **Distribución:** quién recibe el cobro original, quién conserva la participación del taller y cómo recibe su parte cada club. Revisar pedidos propios, institucionales y mixtos.
3. **Convenios y porcentajes:** vigencia, excepciones por producto, redondeos, envío, aranceles y tratamiento de cuotas. Distinguir el cálculo interno del importe finalmente acreditado.
4. **Confirmación y conciliación:** webhooks, consultas al proveedor, validación de importes y referencias, duplicados y recuperación de notificaciones perdidas.
5. **Comisiones y liquidaciones:** cuándo se consideran pendientes, disponibles o liquidadas. Revisar especialmente la asignación de `SETTLED` a ventas Mobbex y evitar transferir dos veces la misma participación.
6. **Reintegros y reclamos:** devoluciones totales o parciales, reversión del split, ajustes de comisiones y pedidos con participaciones ya distribuidas.
7. **Datos y despliegue:** pagos históricos, enums de Prisma, migraciones, variables de entorno, tareas cron y compatibilidad entre versiones.

### Archivos de referencia para esa revisión

| Área                                  | Ubicación                                                          |
| ------------------------------------- | ------------------------------------------------------------------ |
| Proveedores actuales y anteriores     | `src/server/modules/payments/infrastructure/providers/`            |
| Composición de pagos y conciliadores  | `src/server/modules/payments/index.ts`                             |
| Procedimientos de pago                | `src/server/modules/payments/presentation/router.ts`               |
| Checkout mostrado al comprador        | `src/widgets/payment-method-panel/` y `src/features/pay-with-*`    |
| Cálculo del split Mobbex              | `src/server/modules/payments/infrastructure/mobbex-split.ts`       |
| Efectos de pago confirmado            | `src/server/modules/payments/infrastructure/order-paid-effects.ts` |
| Convenios, comisiones y liquidaciones | `src/server/modules/agreements/`, `commissions/` y `settlements/`  |
| Webhooks y tareas automáticas         | `src/app/api/webhooks/` y `src/app/api/cron/`                      |
| Modelos e historial de esquema        | `prisma/schema.prisma` y `prisma/migrations/`                      |

La revisión debe terminar con una definición del flujo final, el tratamiento de operaciones existentes y pruebas de cobro, distribución, conciliación y devolución. Esta advertencia identifica trabajo pendiente; no afirma que esos cambios ya estén implementados ni realiza modificaciones al código de pagos.

## Índice

- [Probar el sistema integrado](#probar-el-sistema-integrado)
- [IMPORTANTE: descarga, puesta en marcha y estado del proyecto](#importante-descarga-puesta-en-marcha-y-estado-del-proyecto)
- [IMPORTANTE: revisar pagos y distribución antes de completar Mobbex](#importante-revisar-pagos-y-distribución-antes-de-completar-mobbex)
- [1. Qué incluye](#1-qué-incluye)
- [2. Tecnologías y arquitectura](#2-tecnologías-y-arquitectura)
- [3. Cómo funciona una compra](#3-cómo-funciona-una-compra)
- [4. Instalación local paso a paso](#4-instalación-local-paso-a-paso)
- [5. Variables de entorno](#5-variables-de-entorno)
- [6. Primer administrador y datos de prueba](#6-primer-administrador-y-datos-de-prueba)
- [7. Alta de clubes, convenios y productos](#7-alta-de-clubes-convenios-y-productos)
- [8. Producción, comisiones y devoluciones](#8-producción-comisiones-y-devoluciones)
- [9. Páginas y API](#9-páginas-y-api)
- [10. Publicación en Railway y Supabase](#10-publicación-en-railway-y-supabase)
- [11. Comandos y mantenimiento](#11-comandos-y-mantenimiento)
- [12. Verificación de la puesta en marcha](#12-verificación-de-la-puesta-en-marcha)
- [13. Problemas frecuentes](#13-problemas-frecuentes)
- [14. Subir esta documentación a GitHub](#14-subir-esta-documentación-a-github)
- [15. Documentación complementaria](#15-documentación-complementaria)

## 1. Qué incluye

| Área               | Funciones principales                                                                            |
| ------------------ | ------------------------------------------------------------------------------------------------ |
| Tienda             | Portada, catálogo con filtros, detalle de producto, talles, colores, carrito, checkout y pedido. |
| Clientes           | Registro, ingreso, cuenta y pedidos asociados. Google cuando está configurado.                   |
| Clubes             | Perfil público, tienda institucional, usuarios vinculados y portal privado.                      |
| Convenios          | Porcentaje base, excepciones por producto, vigencia, estados e historial.                        |
| Diseños            | Propuestas institucionales o personalizadas, versiones, imágenes, comentarios y aprobación.      |
| Pagos              | Mobbex, split, notificaciones, conciliación e intentos idempotentes. Adaptadores históricos.     |
| Producción         | Tandas, gestión por ítem, plazos, elementos manuales y seguimiento.                              |
| Comisiones         | Participaciones por club y ajustes de devoluciones.                                              |
| Liquidaciones      | Consulta, generación y confirmación con comprobante donde corresponde.                           |
| Atención           | Arrepentimiento, devolución, reclamo y seguimiento de reintegros.                                |
| Contenidos         | Portada, imágenes, enlaces, fechas, visibilidad y carrusel.                                      |
| Pedidos especiales | Solicitudes a medida con contacto, cantidades, talles, colores y fecha.                          |

### Roles

| Rol                   | Uso                                                                                                                                                                |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `SUPER_ADMIN`         | Administración general.                                                                                                                                            |
| `ADMIN`               | Administración de la plataforma.                                                                                                                                   |
| `PRODUCTION_OPERATOR` | Permisos de servidor para pedidos y producción. El layout actual de `/admin` solo admite `ADMIN` y `SUPER_ADMIN`; este rol no tiene una entrada completa al panel. |
| `CLUB_ADMIN`          | Gestión del club vinculado.                                                                                                                                        |
| `CLUB_VIEWER`         | Consulta del club vinculado, con restricciones de escritura.                                                                                                       |
| `CUSTOMER`            | Comprador; rol asignado por el registro público.                                                                                                                   |

El servidor comprueba permisos. El acceso a datos de una institución depende también de `ClubUser`: asignar el rol no vincula por sí solo un club.

## 2. Tecnologías y arquitectura

| Tecnología                 | Uso                                      |
| -------------------------- | ---------------------------------------- |
| Node.js 22 y npm           | Runtime y dependencias.                  |
| Next.js 15 y React 19      | Aplicación, App Router y endpoints HTTP. |
| TypeScript                 | Tipado.                                  |
| tRPC 11 y Zod              | API tipada y validación.                 |
| Prisma 6 y PostgreSQL      | Modelos, consultas y migraciones.        |
| Auth.js / NextAuth v5 beta | Credenciales, Google y sesiones JWT.     |
| Argon2                     | Hash de contraseñas.                     |
| TanStack Query             | Consultas y estado remoto.               |
| Zustand                    | Carrito persistido en el navegador.      |
| Tailwind CSS 4             | Estilos.                                 |
| Motion, GSAP y carruseles  | Animaciones e interacciones.             |
| Mobbex                     | Cobros nuevos y distribución.            |
| Resend                     | Comprobantes por correo.                 |
| Vitest, ESLint y Prettier  | Pruebas, análisis y formato.             |

Las versiones exactas están en `package-lock.json`; `package.json` define los rangos y requiere Node.js `22.x`.

```text
.
├── src/
│   ├── app/                  # Páginas, layouts y rutas HTTP
│   ├── views/                # Vistas de tienda y paneles
│   ├── widgets/              # Bloques de interfaz
│   ├── features/             # Acciones de usuario
│   ├── entities/             # Producto y carrito en la interfaz
│   ├── shared/               # Componentes y utilidades comunes
│   ├── trpc/                 # Integración cliente/servidor
│   ├── server/
│   │   ├── api/              # Contexto, permisos y router
│   │   ├── auth/             # Autenticación y sesiones
│   │   ├── modules/          # Lógica por área de negocio
│   │   ├── security/         # Límites y validación de archivos
│   │   └── db.ts             # Prisma y pool
│   ├── env.js                # Validación del entorno
│   └── middleware.ts         # Middleware y seguridad
├── prisma/
│   ├── schema.prisma         # Modelos y relaciones
│   ├── migrations/           # Historial de esquema
│   └── seed.ts               # Datos demo
├── generated/prisma/         # Cliente generado por plataforma
├── public/                   # Recursos estáticos
├── scripts/                  # Inicio, build y cron
├── docs/                     # Guías técnicas
├── prisma.config.ts          # Migraciones y seed
├── railway.json              # Servicio web
├── .env.example              # Plantilla
└── package.json              # Comandos y dependencias
```

```mermaid
flowchart LR
    UI[Interfaz React] --> API[tRPC: validación y permisos]
    API --> APP[Casos de uso]
    APP --> REPO[Repositorios Prisma]
    REPO --> DB[(PostgreSQL)]
    APP --> PAY[Mobbex]
    PAY --> HOOK[Webhook y conciliación]
    HOOK --> APP
```

Los módulos separan, según el área, presentación (`router` y esquemas), aplicación (casos de uso y contratos) e infraestructura (repositorios y proveedores). El router principal es `src/server/api/root.ts`.

### Módulos del servidor

Todos están en `src/server/modules/` y se componen en el router principal:

| Carpeta             | Responsabilidad                                                       |
| ------------------- | --------------------------------------------------------------------- |
| `identity-access`   | Registro, verificación de credenciales y cambio de contraseña.        |
| `catalog`           | Consulta y administración de productos, variantes y líneas.           |
| `clubs`             | Instituciones, miembros, portal y seguimiento de alta Mobbex.         |
| `agreements`        | Convenios, cambios y resolución de porcentajes.                       |
| `checkout`          | Disponibilidad del carrito y envío de la compra para crear un pedido. |
| `orders`            | Creación, consulta, métricas, estados y vencimiento de impagos.       |
| `payments`          | Sesiones de pago, proveedores, webhook, conciliación y reintegros.    |
| `commissions`       | Generación, saldo, disponibilidad y ajustes de participaciones.       |
| `settlements`       | Generación, consulta y confirmación de liquidaciones.                 |
| `designs`           | Propuestas, versiones, revisión y vínculos a productos.               |
| `production`        | Tandas, seguimiento de ítems, gestión manual e historial.             |
| `content`           | Contenidos y configuración de la portada.                             |
| `customer-requests` | Solicitudes de atención y revisión de devoluciones.                   |
| `special-requests`  | Solicitudes de prendas a medida.                                      |

Los modelos principales son usuarios, clubes, productos y variantes, pedidos y líneas, pagos, convenios, comisiones, liquidaciones, diseños y tandas. Los importes se guardan como enteros en centavos de pesos argentinos.

Las imágenes administrativas y documentos se guardan como bytes en PostgreSQL. `public/` contiene archivos estáticos. Estos flujos no utilizan Supabase Auth ni Supabase Storage.

## 3. Cómo funciona una compra

1. **Elegir producto y variante.** Desde catálogo o tienda institucional, seleccionar talle y color.
2. **Agregar al carrito.** Zustand persiste las líneas bajo `elestampadero-cart`.
3. **Completar checkout.** Indicar contacto y envío o retiro. El procedimiento admite compras con o sin sesión; con sesión, vincula el pedido al usuario.
4. **Validar en servidor.** Consultar precios y disponibilidad actuales; el precio del navegador no determina el cobro.
5. **Crear pedido.** Guardar copias de nombre, variante, precio y club, y reservar stock controlado. `checkoutRequestId` reconoce solicitudes repetidas.
6. **Abrir pago.** Desde `/pedido/[id]`, abrir Mobbex. El servidor crea un intento y calcula split para productos institucionales.
7. **Confirmar proveedor.** Webhook o consulta verifican operación, referencia, moneda e importe contra Mobbex. El callback del navegador no prueba aprobación.
8. **Aplicar efectos.** Marcar pagado, generar comisiones, asignar tanda e intentar enviar comprobante.
9. **Preparar y entregar.** Administración gestiona producción y seguimiento.

```mermaid
flowchart TD
    A[Catálogo y variante] --> B[Carrito]
    B --> C[Datos y entrega]
    C --> D[Pedido pendiente y reserva]
    D --> E[Checkout Mobbex]
    E --> F[Validación del proveedor]
    F -->|Aprobado| G[Pedido pagado]
    G --> H[Comisiones, producción y correo]
    F -->|Pendiente| I[Consulta y cron]
    I --> F
    I -->|Impago vencido y verificado| J[Cancelación y devolución de stock]
```

El envío tiene tarifa fija de `620000` centavos, **ARS 6.200**, definida en el caso de uso de checkout y su vista. Retiro: envío cero. Para cambiarla hay que actualizar ambos lugares; no hay cotización automática por transportista.

## 4. Instalación local paso a paso

### Paso 1. Preparar requisitos

- Node.js **22.x**.
- npm; el proyecto declara `npm@11.13.0`.
- Git para clonar.
- PostgreSQL accesible, local o externo.

```bash
node --version
npm --version
git --version
```

### Paso 2. Obtener código

```bash
git clone https://github.com/brunova-test/estampadero.git
cd estampadero
```

Con ZIP, descomprimir y abrir terminal en la carpeta de `package.json`. Ejecutar los siguientes comandos desde esa raíz.

### Paso 3. Crear `.env`

PowerShell:

```powershell
Copy-Item .env.example .env
```

Linux/macOS:

```bash
cp .env.example .env
```

Configurar **antes de instalar**: `postinstall` genera Prisma y su configuración consulta la URL de base.

```env
DATABASE_URL="postgresql://postgres:TU_PASSWORD@localhost:5432/elestampadero"
DIRECT_URL="postgresql://postgres:TU_PASSWORD@localhost:5432/elestampadero"
AUTH_SECRET="REEMPLAZAR_POR_UN_SECRETO_ALEATORIO"
AUTH_TRUST_HOST="true"
AUTH_URL="http://localhost:3000"
APP_URL="http://localhost:3000"
CRON_SECRET="REEMPLAZAR_POR_OTRO_SECRETO_ALEATORIO"
```

Generar cada secreto por separado:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

La validación permite omitir los secretos de auth y cron en desarrollo, pero configurarlos facilita sesiones y pruebas. En producción exige ambos; cron necesita mínimo 16 caracteres.

Integraciones no utilizadas pueden quedar vacías o sin definir. Para cobrar, completar Mobbex con credenciales de prueba propias. Los valores demo de la plantilla no representan el alta comercial de tienda o clubes.

### Paso 4. Crear PostgreSQL si no existe

Opción de desarrollo con Docker:

```bash
docker run --name estampadero-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=TU_PASSWORD -e POSTGRES_DB=elestampadero -p 5432:5432 -v estampadero_pgdata:/var/lib/postgresql/data -d postgres:16
```

Usar la contraseña de la conexión local. El volumen conserva datos. Si existe PostgreSQL en 5432, usar esa instancia o cambiar puerto y URL. Codificar caracteres especiales en la URL; cambiar `.env` no cambia la contraseña de una base existente.

### Paso 5. Instalar y migrar

```bash
npm ci
npm run db:generate
npm run db:migrate
```

Instalan versiones del lockfile, generan Prisma y aplican migraciones. Las migraciones crean esquema, sin cargar automáticamente usuarios ni catálogo demo.

### Paso 6. Crear acceso

Seguir la sección [Primer administrador y datos de prueba](#6-primer-administrador-y-datos-de-prueba). Para demostración local puede usarse seed; para instalación real, crear solo administrador.

### Paso 7. Iniciar

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000). [http://localhost:3000/api/health](http://localhost:3000/api/health) devuelve `{"status":"ok"}`; comprueba respuesta del servidor, sin consultar base, pagos ni correo.

Para notificaciones locales de pagos, usar un ambiente publicado o túnel HTTPS y ajustar `APP_URL`. El proveedor no puede alcanzar `localhost`.

## 5. Variables de entorno

La validación principal está en `src/env.js`. Prisma o el seed leen `DIRECT_URL`, `DATABASE_UNPOOLED_URL` y `SEED_*` por separado.

### Plantilla completa de variables

Este bloque reúne las variables de la aplicación, las integraciones y las herramientas del repositorio. **No todas son obligatorias al mismo tiempo:** completar las credenciales de los servicios utilizados y dejar vacías las integraciones opcionales que no se habiliten. Los valores son ejemplos o marcadores, no conexiones ni credenciales privadas del ambiente publicado.

En desarrollo, guardarlo en `.env`. En Railway, cargar los valores correspondientes en **Variables** del servicio y utilizar el dominio de esa instalación en `AUTH_URL` y `APP_URL`. Las variables de seed y verificación se usan solo al ejecutar esas herramientas.

```env
# BASE DE DATOS
DATABASE_URL="postgresql://postgres:TU_PASSWORD@localhost:5432/elestampadero"
DIRECT_URL="postgresql://postgres:TU_PASSWORD@localhost:5432/elestampadero"
# Alternativa legacy: usar solo si no se define DIRECT_URL.
# DATABASE_UNPOOLED_URL="postgresql://postgres:TU_PASSWORD@localhost:5432/elestampadero"
PRISMA_CONNECTION_LIMIT="10"
PRISMA_POOL_TIMEOUT_SECONDS="15"

# APLICACION Y AUTENTICACION
AUTH_SECRET="REEMPLAZAR_POR_UN_SECRETO_ALEATORIO_PROPIO"
AUTH_TRUST_HOST="true"
AUTH_URL="http://localhost:3000"
APP_URL="http://localhost:3000"
# Next.js establece el modo segun el comando. Para seed publicado, ver seccion 6.
# NODE_ENV="development"
# Dejar sin definir para mantener la validacion de variables activa.
# SKIP_ENV_VALIDATION=""

# GOOGLE OAUTH: completar ambos valores si se habilita
AUTH_GOOGLE_ID=""
AUTH_GOOGLE_SECRET=""

# COMPROBANTES POR CORREO
RESEND_API_KEY=""
RECEIPT_EMAIL_FROM="El Estampadero <pedidos@tu-dominio.com>"

# MOBBEX: checkout actual, sujeto a revision y homologacion
MOBBEX_API_KEY=""
MOBBEX_ACCESS_TOKEN=""
MOBBEX_ENTITY_ID=""
MOBBEX_TEST_MODE="true"

# MERCADO PAGO: conservar si el flujo o las operaciones existentes lo requieren
MERCADOPAGO_ACCESS_TOKEN=""
MERCADOPAGO_WEBHOOK_SECRET=""
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=""

# PAYWAY: revisar su uso antes de desactivar
PAYWAY_ENVIRONMENT="sandbox"
PAYWAY_SITE_ID=""
PAYWAY_PRIVATE_API_KEY=""
NEXT_PUBLIC_PAYWAY_ENVIRONMENT="sandbox"
NEXT_PUBLIC_PAYWAY_PUBLIC_API_KEY=""
NEXT_PUBLIC_PAYWAY_INSTALLMENTS="1,3,6"
PAYWAY_DEBIT_RELEASE_BUSINESS_DAYS=""
PAYWAY_CREDIT_RELEASE_BUSINESS_DAYS=""

# MODO: revisar su uso antes de desactivar
MODO_ENVIRONMENT="sandbox"
MODO_USERNAME=""
MODO_PASSWORD=""
MODO_PROCESSOR_CODE=""
MODO_CC_CODE=""
MODO_MERCHANT_NAME="El Estampadero"

# TAREAS AUTOMATICAS Y VENCIMIENTO DE PEDIDOS
CRON_SECRET="REEMPLAZAR_POR_OTRO_SECRETO_ALEATORIO_DE_AL_MENOS_16_CARACTERES"
UNPAID_ORDER_EXPIRATION_HOURS="24"

# SEED: solo para cargar demostracion manualmente
SEED_ADMIN_NAME="Administrador Demo"
SEED_ADMIN_EMAIL="admin@elestampadero.com"
SEED_ADMIN_PASSWORD="AdminDemo123!estampadero"
SEED_CLUB_USER_NAME="Representante Demo"
SEED_CLUB_USER_EMAIL="club@elestampadero.com"
SEED_CLUB_USER_PASSWORD=""
SEED_CLUB_SLUG="club-atletico"
SEED_CUSTOMER_NAME="Cliente Demo"
SEED_CUSTOMER_EMAIL="cliente@elestampadero.com"
SEED_CUSTOMER_PASSWORD=""
SEED_PRODUCTION_CONFIRMATION=""

# VERIFICACION DE MIGRACION: solo para scripts/verify-db-migration.mjs
# SOURCE_DATABASE_URL="postgresql://USUARIO:CONTRASENA@HOST_ORIGEN:5432/BASE"
# TARGET_DATABASE_URL="postgresql://USUARIO:CONTRASENA@HOST_DESTINO:5432/BASE"

# RUNTIME: normalmente lo configura el hosting
# PORT="3000"
# HOSTNAME="0.0.0.0"
# RAILWAY_PUBLIC_DOMAIN="tu-servicio.up.railway.app"
```
MODIFICAR ESTO A GUSTO, NO NCESARIAMENTE TIENE QUE UTILIZARSE ESTAS HERRAMIENTAS
Para Railway con Supabase, reemplazar las conexiones locales por Transaction pooler en `DATABASE_URL` y Session pooler en `DIRECT_URL`. Para ejecutar el seed, seguir el cambio temporal de conexión explicado en la sección 6. No dejar `DIRECT_URL` o `DATABASE_UNPOOLED_URL` como cadenas vacías: configurarlas con una conexión válida o no definirlas.

Las contraseñas de club y cliente vacías deben completarse con al menos 16 caracteres antes de ejecutar el seed. La contraseña de administrador del bloque es la demo pública solicitada para pruebas. Para permitir una carga intencional con `NODE_ENV=production`, configurar temporalmente `SEED_PRODUCTION_CONFIRMATION=I_UNDERSTAND_THIS_SEEDS_PRODUCTION`, como se explica en el procedimiento de seed.

### Base, aplicación y cron

| Variable                        | Uso / valor por defecto                                                                                               |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                  | Obligatoria; conexión de aplicación.                                                                                  |
| `DIRECT_URL`                    | Conexión de sesión o directa para migraciones, especialmente con runtime transaccional.                               |
| `DATABASE_UNPOOLED_URL`         | Compatibilidad anterior; se usa si falta `DIRECT_URL`.                                                                |
| `PRISMA_CONNECTION_LIMIT`       | Por instancia: `10`, rango `1–50`.                                                                                    |
| `PRISMA_POOL_TIMEOUT_SECONDS`   | Espera por conexión: `15`, rango `1–60`.                                                                              |
| `AUTH_SECRET`                   | Secreto de sesión; obligatorio en producción.                                                                         |
| `AUTH_TRUST_HOST`               | `true` detrás del proxy de Railway.                                                                                   |
| `AUTH_URL`                      | URL de autenticación del ambiente.                                                                                    |
| `APP_URL`                       | Base para retornos, webhook y correo; por defecto `http://localhost:3000`.                                            |
| `CRON_SECRET`                   | Ambos cron; obligatorio en producción, mínimo 16 caracteres.                                                          |
| `UNPAID_ORDER_EXPIRATION_HOURS` | Vencimiento impagos: `24`, rango `1–168`; se aplica al ejecutar cron.                                                 |
| `NODE_ENV`                      | `development`, `test` o `production`; Next.js establece el modo según el comando.                                     |
| `SKIP_ENV_VALIDATION`           | Omite validación con un valor no vacío. Evitar en instalaciones normales; incluso el texto `false` activa la omisión. |

Prisma Migrate elige `DIRECT_URL`, después `DATABASE_UNPOOLED_URL` y finalmente `DATABASE_URL`. No aplicar migraciones mediante una conexión transaccional.

### Mobbex: compras nuevas

| Variable              | Uso                                                               |
| --------------------- | ----------------------------------------------------------------- |
| `MOBBEX_API_KEY`      | API Key privada.                                                  |
| `MOBBEX_ACCESS_TOKEN` | Token privado del originante.                                     |
| `MOBBEX_ENTITY_ID`    | UID de El Estampadero; necesario para su parte en pedidos mixtos. |
| `MOBBEX_TEST_MODE`    | `true` en pruebas, `false` en producción; por defecto `true`.     |

El UID de cada club se guarda en su registro. Ninguna de estas credenciales lleva `NEXT_PUBLIC_`.

### Google y correo

| Variable             | Uso                                                               |
| -------------------- | ----------------------------------------------------------------- |
| `AUTH_GOOGLE_ID`     | ID OAuth, opcional con su secreto.                                |
| `AUTH_GOOGLE_SECRET` | Secreto OAuth.                                                    |
| `RESEND_API_KEY`     | API Key privada para comprobantes.                                |
| `RECEIPT_EMAIL_FROM` | Remitente, por ejemplo `El Estampadero <pedidos@tu-dominio.com>`. |

Registrar el callback Google por ambiente: `https://TU_DOMINIO/api/auth/callback/google`; local: `http://localhost:3000/api/auth/callback/google`.

Para correo real, verificar el dominio del remitente según la [documentación de Resend](https://resend.com/docs/dashboard/domains/introduction). Sin configuración no se envían comprobantes por este canal.

### Integraciones anteriores

En el checkout visible actual, las compras nuevas se inician con Mobbex. **Antes de desactivar Mercado Pago, Payway o MODO, analizar su implementación y uso real**, siguiendo la advertencia al inicio de esta guía. Si existen operaciones pendientes o históricas, conservar lo necesario para consultarlas, conciliarlas y devolverlas durante la transición.

| Proveedor    | Variables conservadas                                                                                                                                                                                                                                              |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Mercado Pago | `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET`, `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY`.                                                                                                                                                                    |
| Payway       | `PAYWAY_ENVIRONMENT`, `PAYWAY_PRIVATE_API_KEY`, `NEXT_PUBLIC_PAYWAY_ENVIRONMENT`, `NEXT_PUBLIC_PAYWAY_PUBLIC_API_KEY`, `NEXT_PUBLIC_PAYWAY_INSTALLMENTS`, `PAYWAY_DEBIT_RELEASE_BUSINESS_DAYS`, `PAYWAY_CREDIT_RELEASE_BUSINESS_DAYS`; `PAYWAY_SITE_ID` es legacy. |
| MODO         | `MODO_ENVIRONMENT`, `MODO_USERNAME`, `MODO_PASSWORD`, `MODO_PROCESSOR_CODE`, `MODO_CC_CODE`, `MODO_MERCHANT_NAME`.                                                                                                                                                 |

Las variables `NEXT_PUBLIC_*` se incorporan al navegador durante el build. Cambiarlas publicadas requiere reconstruir la aplicación.

### Detalle de Payway y MODO

| Variable                              | Función                                                                          |
| ------------------------------------- | -------------------------------------------------------------------------------- |
| `PAYWAY_ENVIRONMENT`                  | Ambiente del servidor: `sandbox` o `production`.                                 |
| `PAYWAY_SITE_ID`                      | Campo legacy; la integración actual de API v2 no lo requiere.                    |
| `PAYWAY_PRIVATE_API_KEY`              | Credencial privada del servidor.                                                 |
| `NEXT_PUBLIC_PAYWAY_ENVIRONMENT`      | Ambiente de tokenización del navegador; debe corresponder al del servidor.       |
| `NEXT_PUBLIC_PAYWAY_PUBLIC_API_KEY`   | Clave pública para tokenizar tarjetas.                                           |
| `NEXT_PUBLIC_PAYWAY_INSTALLMENTS`     | Lista de cuotas separadas por comas; valor por defecto del código: `1`.          |
| `PAYWAY_DEBIT_RELEASE_BUSINESS_DAYS`  | Estimación de días hábiles para débito según contrato; no confirma un depósito.  |
| `PAYWAY_CREDIT_RELEASE_BUSINESS_DAYS` | Estimación de días hábiles para crédito según contrato; no confirma un depósito. |
| `MODO_ENVIRONMENT`                    | Ambiente MODO: `sandbox` o `production`.                                         |
| `MODO_USERNAME`, `MODO_PASSWORD`      | Credenciales privadas del servidor.                                              |
| `MODO_PROCESSOR_CODE`, `MODO_CC_CODE` | Códigos de configuración comercial utilizados por el adaptador.                  |
| `MODO_MERCHANT_NAME`                  | Nombre del comercio para la integración.                                         |

### Variables del seed

| Variable                                                                 | Función                                                                                              |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| `SEED_ADMIN_NAME`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`             | Datos del administrador demo, creado con rol `SUPER_ADMIN`.                                          |
| `SEED_CLUB_USER_NAME`, `SEED_CLUB_USER_EMAIL`, `SEED_CLUB_USER_PASSWORD` | Datos del representante demo, creado con rol `CLUB_ADMIN`.                                           |
| `SEED_CLUB_SLUG`                                                         | Club generado por el seed al que se vincula el representante.                                        |
| `SEED_CUSTOMER_NAME`, `SEED_CUSTOMER_EMAIL`, `SEED_CUSTOMER_PASSWORD`    | Datos del cliente demo.                                                                              |
| `SEED_PRODUCTION_CONFIRMATION`                                           | Confirmación explícita de ejecución cuando `NODE_ENV=production`. No se utiliza para iniciar la web. |

### Verificación de migraciones y runtime

| Variable                | Función                                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------------------------- |
| `SOURCE_DATABASE_URL`   | Base de origen para `npm run db:verify-migration`.                                                            |
| `TARGET_DATABASE_URL`   | Base de destino para el mismo script.                                                                         |
| `PORT`                  | Puerto del servidor; Railway lo suministra. El fallback de URL local de tRPC usa 3000 si no está definido.    |
| `HOSTNAME`              | Dirección de escucha; `scripts/start-railway.mjs` establece `0.0.0.0`.                                        |
| `RAILWAY_PUBLIC_DOMAIN` | Dominio proporcionado por Railway; tRPC lo utiliza como fallback si falta `APP_URL`. No incluye el protocolo. |

Las tareas cron solo necesitan `APP_URL` y `CRON_SECRET` para ejecutar sus scripts, además de las variables requeridas por el build del servicio elegido. No hay que copiarles las variables de seed o de verificación de migraciones.

## 6. Primer administrador y datos de prueba

### Instalación real: crear solo administrador

No hay un comando específico de alta inicial. Con acceso autorizado a la base:

1. Iniciar y registrar una cuenta propia desde `/ingresar`. El servidor asigna `CUSTOMER` y hashea la contraseña.
2. Abrir Studio con las variables de esa base:

   ```bash
   npm run db:studio
   ```

3. En `User`, localizar la cuenta por su correo exacto.
4. Cambiar únicamente `role` a `SUPER_ADMIN`, comprobar `isActive=true` y guardar.
5. Cerrar Studio, salir, volver a ingresar y abrir `/admin`.

No escribir contraseñas en texto plano en `passwordHash`. En producción, ejecutar Studio desde una máquina autorizada y con conexión de sesión o directa. Si `DATABASE_URL` normalmente usa 6543, usar temporalmente una conexión de sesión para la herramienta y restaurarla después.

Este procedimiento evita introducir pedidos y productos ficticios.

### Demostración local: seed

Completar `.env`:

```env
SEED_ADMIN_NAME="Administrador Demo"
SEED_ADMIN_EMAIL="admin@example.com"
SEED_ADMIN_PASSWORD="REEMPLAZAR_POR_CONTRASENA_DE_16_O_MAS_CARACTERES"
SEED_CLUB_USER_NAME="Representante Demo"
SEED_CLUB_USER_EMAIL="club@example.com"
SEED_CLUB_USER_PASSWORD="REEMPLAZAR_POR_OTRA_CONTRASENA_DE_16_O_MAS_CARACTERES"
SEED_CLUB_SLUG="club-atletico"
SEED_CUSTOMER_NAME="Cliente Demo"
SEED_CUSTOMER_EMAIL="cliente@example.com"
SEED_CUSTOMER_PASSWORD="REEMPLAZAR_POR_OTRA_CONTRASENA_DE_16_O_MAS_CARACTERES"
```

```bash
npm run db:seed
```

Crea categorías, clubes, usuarios, productos, convenios y pedidos, entre otros datos demo. Incluye `SUPER_ADMIN`, `CLUB_ADMIN` vinculado y `CUSTOMER`. Las tres contraseñas requieren 16 caracteres. `club-atletico` es uno de los clubes generados.

El seed usa `upsert` y puede actualizar registros existentes, incluidas credenciales demo. No es importador de datos reales ni debe ejecutarse automáticamente en deploy.

Con `NODE_ENV=production`, bloquea salvo que exista `SEED_PRODUCTION_CONFIRMATION=I_UNDERSTAND_THIS_SEEDS_PRODUCTION`. El bloqueo depende del modo, no de la URL: una terminal local también puede modificar una base real. Para alta real, utilizar el procedimiento anterior.

### Subir el seed y cargar una demostración en el ambiente de Railway

**Subir el código del seed a GitHub y ejecutarlo son dos operaciones distintas.** Un push de `prisma/seed.ts` no inserta datos en la base. El despliegue actual aplica migraciones, pero no ejecuta automáticamente el seed.

#### 1. Subir el archivo cuando tenga cambios

Revisar los cambios del archivo y, si corresponde, ejecutar manualmente:

```bash
git diff -- prisma/seed.ts
git add prisma/seed.ts
git commit -m "chore: actualizar datos de demostracion"
git push
```

Si el archivo no cambió, no hace falta crear un commit para ejecutarlo. No subir `.env` junto con el seed. Cuando Railway esté conectado a esa rama, el despliegue incorporará el código actualizado.

#### 2. Preparar las variables de demostración

Además de las variables normales del servicio, este es el bloque `SEED_*` para recrear el administrador de prueba. Completar también las cuentas de club y cliente: el seed actual exige sus datos aunque solo se quiera usar el administrador.

```env
SEED_ADMIN_NAME="Administrador Demo"
SEED_ADMIN_EMAIL="admin@elestampadero.com"
SEED_ADMIN_PASSWORD="AdminDemo123!estampadero"
SEED_CLUB_USER_NAME="Representante Demo"
SEED_CLUB_USER_EMAIL="club@elestampadero.com"
SEED_CLUB_USER_PASSWORD="REEMPLAZAR_POR_CONTRASENA_PROPIA_DE_16_O_MAS_CARACTERES"
SEED_CLUB_SLUG="club-atletico"
SEED_CUSTOMER_NAME="Cliente Demo"
SEED_CUSTOMER_EMAIL="cliente@elestampadero.com"
SEED_CUSTOMER_PASSWORD="REEMPLAZAR_POR_OTRA_CONTRASENA_PROPIA_DE_16_O_MAS_CARACTERES"
SEED_PRODUCTION_CONFIRMATION="I_UNDERSTAND_THIS_SEEDS_PRODUCTION"
```

Estas variables se pueden cargar temporalmente en **Variables** del servicio Railway si se usará su entorno para ejecutar el seed. No las necesita el funcionamiento habitual del servicio web. Para el procedimiento local de abajo, colocarlas en el `.env` privado de la máquina desde la que se ejecutará.

La confirmación permite al seed ejecutarse con `NODE_ENV=production`, incluso si se trata de un hosting de demostración. No transforma el seed en un alta de datos reales: carga registros ficticios y puede actualizar registros existentes.

#### 3. Ejecutar manualmente contra la base del ambiente

Desde un clon con dependencias instaladas, configurar temporalmente `.env` con las variables anteriores y la **conexión de sesión del ambiente de Railway**:

```env
DATABASE_URL="CONEXION_SESSION_POOLER_DEL_AMBIENTE_DE_PRUEBA"
DIRECT_URL="CONEXION_SESSION_POOLER_DEL_AMBIENTE_DE_PRUEBA"
NODE_ENV="production"
```

Usar la cadena PostgreSQL real de puerto 5432, no el texto del marcador. Si Railway aloja la web y Supabase la base, ambas conexiones apuntan a esa base Supabase del ambiente de prueba.

El seed crea su propio `PrismaClient` y lee `DATABASE_URL`; no utiliza la normalización del pool de `src/server/db.ts`. Por eso, para esta ejecución se configura también `DATABASE_URL` con la conexión de sesión, aunque el servicio web mantenga su conexión transaccional.

Comprobar el destino y que las migraciones ya estén aplicadas; después ejecutar:

```bash
npm run db:generate
npm run db:seed
```

Estos comandos se ejecutan en la máquina local y escriben en la base configurada. No es necesario abrir una consola del servidor standalone ni agregar el seed al comando de inicio de Railway.

#### 4. Comprobar y finalizar

Ingresar a la URL del ambiente con el administrador demo y verificar catálogo, instituciones y pedidos de demostración. Eliminar las variables temporales de seed y la confirmación del servicio Railway si se agregaron. Restaurar el `.env` local y su modo de desarrollo si esa misma copia se seguirá utilizando para programar.

## 7. Alta de clubes, convenios y productos

### Paso 1. Crear institución

1. Abrir `/admin/clubes` con cuenta administrativa.
2. Crear nombre, descripción, disciplina, logo y estado activo.
3. El servidor genera slug único, cuenta `CLUB_ADMIN`, vinculación y contraseña aleatoria.
4. Entregar las credenciales mostradas por un canal privado. La cuenta tiene `mustChangePassword` para el cambio inicial.
5. El representante ingresa por `/ingresar` y accede a `/club`.

Perfil público: `/clubes/[slug]`; tienda: `/tiendas/[slug]`. Los miembros de consulta se vinculan a usuarios existentes, con permisos de gestión del club.

### Paso 2. Crear convenio

Abrir el detalle del club en `/admin/clubes/[slug]` y utilizar la gestión de convenios para cargar código, título, fechas, porcentaje base y excepciones por producto. Confirmar estado activo y vigencia. La participación por producto se gestiona también desde `/admin/clubes/[slug]/participacion`.

El porcentaje representa la participación del club; se aplica la excepción del producto si existe o el porcentaje base. El alta actual usa frecuencia `AUTOMATIC`; los campos heredados no implican otro procesador para nuevas compras.

Los productos de club requieren convenio activo. El split exige además tasa vigente y UID Mobbex de la institución.

### Paso 3. Habilitar cobros

El alta en la plataforma no sustituye el alta comercial. Coordinar con Mobbex originante, instituciones, medios y condiciones de acreditación y devolución.

El portal registra estos pasos:

1. El representante indica si ya tiene cuenta.
2. Carga razón social, CUIT, contacto y UID si lo conoce.
3. Administración revisa y registra la solicitud de acceso realizada en el portal externo.
4. La institución autoriza la aplicación en Mobbex y confirma en su portal.
5. Administración verifica el UID y activa cobros.

Estados: `NOT_STARTED`, `REGISTRATION_PENDING`, `DETAILS_SUBMITTED`, `ACCESS_REQUESTED`, `AUTHORIZATION_CONFIRMED`, `ACTIVE`. Un estado local no realiza la autorización externa.

El portal no solicita API Keys, Access Tokens, contraseñas ni PIN del representante. Ver [Configuración de pagos](docs/payments-configuration.md).

### Paso 4. Crear y aprobar diseños

1. En `/admin/disenos`, crear propuesta institucional o personalizada.
2. Agregar versiones, imágenes y descripción.
3. Enviar versión al club para revisión.
4. El representante comenta, solicita cambios o aprueba desde el portal.
5. Repetir revisión cuando haya cambios.
6. Publicar desde propuesta institucional aprobada o vincular productos según el flujo.

Estados de diseño y versión: `PENDING_SEND`, `SENT_TO_CLUB`, `CHANGES_REQUESTED`, `APPROVED`.

### Paso 5. Publicar productos

En `/admin/productos`:

1. Cargar nombre, código único, descripción y precio.
2. Elegir línea y, si corresponde, club con convenio activo.
3. Cargar imágenes y variantes de talle/color.
4. Definir stock si se controla disponibilidad. Puede ser `null`; se reserva con control habilitado y stock numérico.
5. Usar `PUBLISHED` para publicar, `DRAFT` para borrador y `OUT_OF_STOCK` para falta de disponibilidad.
6. Comprobar catálogo y tienda institucional.

La base distingue categorías, líneas predefinidas y líneas administrables; no todas se cargan desde la misma pantalla.

### Paso 6. Preparar portada

En `/admin/contenidos`, configurar piezas, imágenes de escritorio/móvil, textos, enlaces, orden, fechas y visibilidad. Ajustar carrusel y plazo operativo de devolución donde corresponda.

Las cargas admiten JPG, PNG, WebP y GIF hasta 5 MB. Documentos: PDF, JPG, PNG y WebP hasta 5 MB. Se comprueba contenido, MIME y extensión.

## 8. Producción, comisiones y devoluciones

### Pedidos y producción

```text
PENDING_PAYMENT → PAID → IN_PRODUCTION → READY_FOR_SHIPPING → SHIPPED → DELIVERED
CANCELLED representa un pedido cancelado.
```

Es el recorrido habitual; el servidor controla las transiciones. Los estados del pedido y de sus ítems son separados.

En `/admin/produccion` se pueden consultar pedidos pagos, gestionar tandas y plazos, enviar ítems a producción, marcar preparación y envío, cargar elementos manuales y consultar el historial. Estados de ítem: `WAITING`, `SCHEDULED`, `IN_PRODUCTION`, `READY`, `SHIPPED`, `DELIVERED`.

El pago asigna una tanda abierta. El modelo inicia con períodos de 10 días, modificables. Retirar/restaurar pedidos en la vista de producción no equivale a borrar una venta.

### Split y participaciones

**Esta sección describe la implementación actual y debe revisarse al definir la distribución final con Mobbex.** Los cambios pueden alcanzar también a los flujos anteriores de Mercado Pago, Payway y MODO, no solo al botón de pago.

El servidor agrupa líneas por institución. Cada entrada incluye importe bruto (`total`), parte de El Estampadero (`fee`) y entidad receptora. Productos propios/envío se asignan al originante en pedidos mixtos. La suma debe cubrir el total; máximo 50 entradas.

Ejemplo interno: ARS 10.000 con participación del 20 % genera ARS 2.000 de club y `fee` de ARS 8.000. Aranceles y costos financieros dependen del contrato; no es un cálculo de depósito bancario neto.

Ventas aprobadas de **Mobbex** generan comisiones `SETTLED`, porque la distribución se delega al proveedor. Evita pagar dos veces una participación; no verifica independientemente su depósito bancario.

Flujos históricos pueden pasar por `PENDING_RELEASE`, `PENDING_DELIVERY`, `RETURN_WINDOW`, `AVAILABLE` antes de liquidarse. El plazo operativo inicial de devolución es 10 días, guardado en la configuración del sitio.

### Liquidaciones

`/admin/liquidaciones` permite consultar, generar y confirmar según el flujo. El cron genera registros con comisiones elegibles; ventas Mobbex ya `SETTLED` no deben originar pagos duplicados.

Los campos de seguimiento no significan que generar registros ejecute transferencias bancarias. La confirmación manual registra fecha, responsable y comprobante.

### Atención y reintegros

`/arrepentimiento` y `/reclamos-devoluciones` inician el circuito. Administración revisa desde `/admin/devoluciones`, define reintegro y sigue su resultado. Se registran ajustes de comisión.

Devoluciones automáticas dependen del medio y procesador. Probar reintegros totales/parciales con configuración comercial real, especialmente con split. El plazo de la aplicación es una regla operativa y no sustituye condiciones comerciales o legales.

### Solicitudes especiales

`/pedido-especial` usa un procedimiento autenticado y registra contacto, WhatsApp, prenda, cantidad, talles, colores, fecha y comentarios. No crea automáticamente venta pagada ni producción. Actualmente no guarda adjuntos: `attachmentName` se persiste como `null`.

`/sumar-club` presenta la propuesta; el alta efectiva se hace desde administración y mediante el circuito externo de cobros.

## 9. Páginas y API

### Páginas

| Ruta                                                               | Función                                                      |
| ------------------------------------------------------------------ | ------------------------------------------------------------ |
| `/`, `/nosotros`                                                   | Portada y presentación.                                      |
| `/catalogo`, `/catalogo/[slug]`                                    | Catálogo y detalle.                                          |
| `/clubes/[slug]`, `/tiendas/[slug]`                                | Perfil y tienda institucional.                               |
| `/carrito`, `/checkout`                                            | Carrito y creación del pedido.                               |
| `/pedido/[id]`                                                     | Estado, pago y comprobante, sujeto a controles del servidor. |
| `/ingresar`, `/acceso`                                             | Registro, ingreso y acceso por perfil.                       |
| `/cuenta`, `/club`                                                 | Cuenta cliente y portal privado.                             |
| `/pedido-especial`, `/sumar-club`                                  | Solicitudes y propuesta institucional.                       |
| `/arrepentimiento`, `/reclamos-devoluciones`                       | Atención posterior a compra.                                 |
| `/admin`                                                           | Panel general.                                               |
| `/admin/productos`, `/admin/clubes`, `/admin/clubes/[slug]`        | Productos, instituciones y sus convenios.                    |
| `/admin/clubes/[slug]/participacion`                               | Participaciones por producto.                                |
| `/admin/disenos`, `/admin/pedidos`, `/admin/produccion`            | Diseños, ventas y fabricación.                               |
| `/admin/liquidaciones`, `/admin/devoluciones`, `/admin/contenidos` | Liquidaciones, atención y portada.                           |

### Endpoints HTTP

| Endpoint                                              | Uso                                        |
| ----------------------------------------------------- | ------------------------------------------ |
| `/api/trpc/[trpc]`                                    | API de negocio.                            |
| `/api/auth/[...nextauth]`, `/api/auth/session-status` | Autenticación y estado de sesión.          |
| `GET /api/health`                                     | Respuesta básica del servidor.             |
| `POST /api/webhooks/mobbex`                           | Notificaciones de compras nuevas.          |
| `/api/webhooks/mercado-pago`, `/api/webhooks/modo`    | Integraciones anteriores.                  |
| `GET /api/cron/reconcile-payments`                    | Conciliación y vencimiento de impagos.     |
| `GET /api/cron/generate-settlements`                  | Registros de liquidación.                  |
| `/api/admin/images`, `/api/admin/documents`           | Cargas autenticadas.                       |
| `/api/images/[id]`                                    | Imágenes almacenadas.                      |
| `/api/documents/[id]`                                 | Documentos restringidos a administradores. |

Cron exige `Authorization: Bearer CRON_SECRET`. Enviar el secreto en encabezado, sin incluirlo en URL pública.

## 10. Publicación en Railway y Supabase

El repositorio prepara **Railway** para servir Next.js y **PostgreSQL de Supabase** como base. Admite otro PostgreSQL compatible ajustando conexiones.

### Paso 1. Separar ambientes

Usar bases y credenciales distintas para pruebas/producción. Revisar disponibilidad, copias y límites del plan antes de vender.

Preparar cuentas en [Supabase](https://supabase.com/dashboard) y [Railway](https://railway.com), acceso al repositorio de GitHub y las credenciales del ambiente. Dar de alta primero la base y después el servicio web. La revisión de pagos señalada al inicio debe resolverse antes de habilitar cobros productivos; publicar un ambiente de pruebas no certifica esa transición.

### Paso 2. Obtener conexiones

#### Crear el proyecto en Supabase

1. Ingresar al panel de Supabase y elegir o crear la organización que administrará el proyecto.
2. Crear un proyecto nuevo y asignarle un nombre que identifique el ambiente, por ejemplo `estampadero-staging` o `estampadero-produccion`.
3. Definir y guardar la contraseña de PostgreSQL en un lugar privado.
4. Elegir una región cercana al servicio web para reducir la latencia entre aplicación y base.
5. Esperar a que la base esté disponible. No crear tablas manualmente: el esquema de este proyecto se aplica con migraciones Prisma.

#### Copiar las dos conexiones

En **Connect**, elegir cada modalidad y copiar la cadena completa, reemplazando el marcador de contraseña:

| Variable       | Conexión                                                                |
| -------------- | ----------------------------------------------------------------------- |
| `DATABASE_URL` | Transaction pooler, 6543, para runtime.                                 |
| `DIRECT_URL`   | Session pooler, 5432, para migraciones; o directa si la red la alcanza. |

```env
DATABASE_URL="postgresql://postgres.TU_PROJECT_REF:TU_PASSWORD@TU_HOST_POOLER:6543/postgres"
DIRECT_URL="postgresql://postgres.TU_PROJECT_REF:TU_PASSWORD@TU_HOST_POOLER:5432/postgres"
```

Copiar host y usuario del panel. La directa puede requerir IPv6; el pooler de sesión ofrece alternativa IPv4. Codificar caracteres especiales de contraseña.

Estas variables son cadenas PostgreSQL, no la URL HTTP del proyecto ni una API Key `anon` o `service_role`. Guardarlas en el `.env` local del ambiente o en las variables del servicio web, sin subirlas a GitHub. Ver [Conexiones PostgreSQL de Supabase](https://supabase.com/docs/guides/database/connecting-to-postgres).

El código detecta puerto transaccional y agrega `pgbouncer=true`, límite y timeout si faltan. Prisma Migrate utiliza la prioridad de `prisma.config.ts`.

El proyecto no utiliza Data API de Supabase: mantenerla desactivada si no se necesita. Si se habilita para otro consumidor, configurar privilegios y RLS antes de exponer tablas. Referencia: [Prisma con Supabase](https://supabase.com/docs/guides/database/prisma).

### Paso 3. Crear servicio web

1. Ingresar a Railway y abrir **New Project**.
2. Elegir **Deploy from GitHub repo**. Vincular GitHub y autorizar acceso al repositorio si todavía no aparece.
3. Seleccionar `brunova-test/estampadero` y comprobar la rama que se va a desplegar.
4. Usar **Add Variables** si está disponible para configurar el entorno antes del primer build. Si el despliegue inicial empieza sin variables y falla, completarlas y volver a desplegar.
5. Abrir el servicio web y verificar que el directorio raíz corresponda a la carpeta con `package.json`; en este repositorio es la raíz.
6. Comprobar que se utilice `railway.json` como configuración del servicio web.

Referencia: [Alta de un proyecto desde GitHub en Railway](https://docs.railway.com/quick-start).

`railway.json` define:

| Ajuste      | Valor                          |
| ----------- | ------------------------------ |
| Builder     | `RAILPACK`                     |
| Build       | `npm run build`                |
| Pre-deploy  | `npx prisma migrate deploy`    |
| Inicio      | `npm run start`                |
| Healthcheck | `/api/health`                  |
| Timeout     | 100 segundos                   |
| Reinicio    | Ante fallo, hasta 10 intentos. |

Build genera Prisma, compila Next.js y copia `public/` y `.next/static` al standalone. Inicio ejecuta `.next/standalone/server.js` en `0.0.0.0`.

### Paso 4. Variables y dominio

Abrir **Variables** del servicio web y cargar, como mínimo:

```env
DATABASE_URL="CONEXION_TRANSACTION_POOLER_DEL_AMBIENTE"
DIRECT_URL="CONEXION_SESSION_POOLER_DEL_AMBIENTE"
AUTH_SECRET="SECRETO_ALEATORIO_PROPIO"
AUTH_TRUST_HOST="true"
CRON_SECRET="OTRO_SECRETO_ALEATORIO_DE_AL_MENOS_16_CARACTERES"
PRISMA_CONNECTION_LIMIT="10"
PRISMA_POOL_TIMEOUT_SECONDS="15"
UNPAID_ORDER_EXPIRATION_HOURS="24"
```

Para habilitar el checkout Mobbex de prueba, agregar:

```env
MOBBEX_API_KEY="API_KEY_DEL_AMBIENTE"
MOBBEX_ACCESS_TOKEN="ACCESS_TOKEN_DEL_AMBIENTE"
MOBBEX_ENTITY_ID="UID_DE_LA_ENTIDAD_ORIGINANTE"
MOBBEX_TEST_MODE="true"
```

Para las integraciones opcionales, cargar únicamente las que se vayan a utilizar:

```env
AUTH_GOOGLE_ID="CLIENT_ID_OAUTH"
AUTH_GOOGLE_SECRET="CLIENT_SECRET_OAUTH"
RESEND_API_KEY="API_KEY_RESEND"
RECEIPT_EMAIL_FROM="El Estampadero <pedidos@tu-dominio.com>"
```

Las variables de usuarios de demostración están en [Subir el seed y cargar una demostración](#subir-el-seed-y-cargar-una-demostración-en-el-ambiente-de-railway). Cargarlas no crea las cuentas por sí solo: hay que ejecutar manualmente el seed. Los UID de los clubes se guardan en sus registros de base, no como variables adicionales del servicio.

Agregar Mobbex según el ambiente y Google/Resend si se utilizan. Para operaciones existentes de Mercado Pago, Payway o MODO, conservar las variables que determine la revisión de pagos; no borrarlas de forma automática. Los valores del bloque anterior son marcadores: reemplazarlos por conexiones y secretos reales antes del build.

En el servicio, abrir **Settings → Networking → Public Networking** y usar **Generate Domain**, o asociar un dominio propio siguiendo los registros DNS indicados. Configurar entonces:

```env
AUTH_URL="https://TU_DOMINIO"
APP_URL="https://TU_DOMINIO"
```

Guardar los cambios y desplegar. Si cambia el dominio, actualizar también callbacks y notificaciones. Referencia: [Red pública y dominios en Railway](https://docs.railway.com/networking/public-networking).

Mantener `MOBBEX_TEST_MODE=true` durante homologación. Pasar a `false` junto con credenciales y entidades productivas habilitadas.

### Paso 5. Migrar y crear administrador

Pre-deploy aplica migraciones pendientes. Desde máquina autorizada con variables del ambiente también puede ejecutarse:

```bash
npm run db:migrate
```

Crear administrador según sección 6 y cargar datos reales. No ejecutar seed demo durante despliegue.

En **Deployments**, revisar los logs de build, migración e inicio. Comprobar que la migración haya finalizado sin errores y que páginas como catálogo e ingreso puedan consultar la base. En el panel de Supabase, verificar que las tablas se hayan creado en la base seleccionada. El endpoint `/api/health` por sí solo no valida PostgreSQL.

### Paso 6. Notificaciones

| Servicio               | URL                                           |
| ---------------------- | --------------------------------------------- |
| Mobbex                 | `https://TU_DOMINIO/api/webhooks/mobbex`      |
| Google, si se habilita | `https://TU_DOMINIO/api/auth/callback/google` |

El checkout recibe una URL de notificación derivada de `APP_URL`. Comprobar acceso público y configuración del proveedor cuando corresponda.

Mercado Pago y MODO pueden aparecer como aplicaciones compatibles con el QR de Mobbex; no requieren integraciones independientes para ese flujo. Los medios disponibles dependen del alta comercial.

### Paso 7. Conciliación automática

La tarea consulta pendientes e históricos por proveedor. Revisa impagos vencidos, revalida pagos y devuelve stock reservado cuando corresponde. Protege intentos con actividad reciente durante 30 minutos.

En el proyecto Railway, agregar otro servicio desde el mismo repositorio, asignarle un nombre como `conciliacion-pagos` y seleccionar su archivo de configuración propio. Configurar las variables de build indicadas abajo, `APP_URL` del web y el mismo `CRON_SECRET`. Comprobar el horario del cron en los ajustes y revisar el resultado de su primera ejecución. La configuración web y la del cron deben mantenerse separadas.

Crear un servicio cron separado. **No reutilizar sin cambios `railway.json` web**, que define servidor permanente, migraciones y healthcheck. La configuración de archivo tiene prioridad sobre el panel: utilizar configuración propia de cron.

Ejemplo de `railway.cron-reconcile.json` para agregar y seleccionar como ruta de configuración del servicio:

```json
{
  "$schema": "https://railway.com/railway.schema.json",
  "build": {
    "builder": "RAILPACK",
    "buildCommand": "npm run build"
  },
  "deploy": {
    "startCommand": "npm run cron:reconcile",
    "cronSchedule": "0 * * * *"
  }
}
```

Es un ejemplo: ese archivo no viene creado. Verificar que el servicio no conserve healthcheck web ni pre-deploy heredados.

Este ejemplo compila la aplicación completa: necesita variables obligatorias de build (`DATABASE_URL`, `AUTH_SECRET`, `CRON_SECRET`) y cualquier configuración adicional requerida durante compilación. Para **ejecutar el script** solo se utilizan `APP_URL` y el mismo `CRON_SECRET` del web; el servidor web trabaja con base y pagos. Los scripts no cargan `.env` por sí solos: necesitan variables en el entorno del proceso.

Railway programa en UTC y espera que el proceso termine. Referencias: [Cron Jobs](https://docs.railway.com/cron-jobs) y [Config as Code](https://docs.railway.com/config-as-code/reference).

### Paso 8. Liquidaciones si corresponde

Crear otro servicio con configuración propia, comando `npm run cron:settlements` y, por ejemplo, `0 3 * * *` (diario 03:00 UTC). Aplican los mismos requisitos de build/entorno.

Llama a `/api/cron/generate-settlements`. No sustituye split ni inicia transferencia bancaria. Las funciones administrativas también permiten generar registros.

## 11. Comandos y mantenimiento

| Comando                                        | Función                                                                                                                                               |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm ci`                                       | Instalar lockfile y ejecutar postinstall.                                                                                                             |
| `npm run dev`                                  | Desarrollo con Turbopack.                                                                                                                             |
| `npm run build`                                | Prisma, compilación y standalone.                                                                                                                     |
| `npm run start`                                | Servir standalone construido.                                                                                                                         |
| `npm run preview`                              | Compilar y servir con `next start`.                                                                                                                   |
| `npm run db:generate`                          | Generar cliente.                                                                                                                                      |
| `npm run db:migrate`                           | `migrate deploy`.                                                                                                                                     |
| `npm run db:push`                              | Sincronizar sin historial; solo bases descartables.                                                                                                   |
| `npm run db:seed`                              | Demostración, según sección 6.                                                                                                                        |
| `npm run db:studio`                            | Inspección/edición de base.                                                                                                                           |
| `npm run db:verify-migration`                  | Compara estructura, cantidades de registros e historial de migraciones entre `SOURCE_DATABASE_URL` y `TARGET_DATABASE_URL`, suministradas al proceso. |
| `npm run typecheck`                            | Comprobar TypeScript.                                                                                                                                 |
| `npm run lint`, `npm run lint:fix`             | Analizar/corregir con `next lint`.                                                                                                                    |
| `npm run check`                                | Lint y typecheck; falla lint y no continúa.                                                                                                           |
| `npm run test`, `npm run test:watch`           | Vitest una vez o en observación.                                                                                                                      |
| `npm run format:check`, `npm run format:write` | Formato de extensiones incluidas en script.                                                                                                           |
| `npm run cron:reconcile`                       | Llamar conciliación y terminar.                                                                                                                       |
| `npm run cron:settlements`                     | Llamar generación y terminar.                                                                                                                         |

### Validar cambios de código

```bash
npm run typecheck
npm run test
npm run lint
npm run build
```

Requieren dependencias y entorno. No certifican cobros, correo ni depósitos: requieren pruebas operativas.

Los scripts actuales usan `next lint`. Si la versión instalada rechaza el comando, revisar compatibilidad y migrar a ESLint CLI; el error no es validación exitosa. Hay pruebas de pagos, comisiones, liquidaciones, sesiones, archivos y esquemas, entre otras áreas.

### Cambiar esquema

Tras editar `prisma/schema.prisma`, sobre base de desarrollo:

```bash
npx prisma migrate dev --name descripcion_del_cambio
npm run db:generate
```

Versionar y revisar SQL. Producción utiliza `migrate deploy`, sin reemplazarlo por `db push`. Evaluar impacto y copias antes de modificar bases con datos.

### Operación habitual

Revisar logs de webhook, cron, correo, migraciones y devoluciones pendientes. Imágenes/documentos forman parte de la base y sus copias. El límite de conexiones es por instancia: aumentar réplicas aumenta el total.

El proyecto implementa Argon2, cookies HTTP-only, validación de entradas, permisos, límites en PostgreSQL, validación de archivos y cabeceras de seguridad. Mantener credenciales privadas en entorno del servidor.

## 12. Verificación de la puesta en marcha

Recorrer pruebas antes de habilitar ventas:

- [ ] Se analizó Mercado Pago, Payway y MODO y se definió cómo conviven o se reemplazan con Mobbex.
- [ ] La distribución final, comisiones, liquidaciones y devoluciones están homologadas, sin pagos duplicados a clubes.
- [ ] `/api/health` responde y páginas que consultan base cargan.
- [ ] Registro, ingreso, salida y cuenta funcionan.
- [ ] Un cliente no obtiene permisos administrativos.
- [ ] Representante cambia contraseña y ve solo clubes vinculados.
- [ ] Google funciona si está configurado.
- [ ] Filtros, imágenes, talles y colores se muestran correctamente.
- [ ] Se reserva stock controlado.
- [ ] Checkout repetido no duplica pedidos.
- [ ] Se prueban pedidos propios, de uno/varios clubes y mixtos con envío.
- [ ] Pagos aprobados, rechazados, pendientes y vencidos funcionan.
- [ ] Webhook actualiza y duplicados no repiten efectos.
- [ ] Conciliación recupera notificación perdida o demorada.
- [ ] Impagos liberan stock sin cancelar cobros confirmados o intentos recientes.
- [ ] Pagado aparece en producción y genera participaciones.
- [ ] Comprobante llega con Resend configurado.
- [ ] Revisión y publicación de diseños funcionan.
- [ ] Reintegros totales/parciales ajustan comisiones en medios compatibles.
- [ ] Cron termina y registra resultado.
- [ ] Se reemplazan credenciales/entidades demo antes de producción.

## 13. Problemas frecuentes

| Problema                              | Revisar                                                                        |
| ------------------------------------- | ------------------------------------------------------------------------------ |
| Validación de entorno                 | `.env` en raíz, nombres/valores y secretos productivos. Reiniciar después.     |
| Instalación falla generando Prisma    | `.env` antes de instalar, URL de configuración y Node.js 22.                   |
| Base inaccesible                      | Host, usuario, contraseña codificada, puerto, red y modo de pooler.            |
| Tablas/columnas faltantes             | Migraciones y cliente, contra base correcta.                                   |
| Sin catálogo                          | Migraciones no cargan productos; demo o altas reales.                          |
| `/admin` redirige                     | Rol `ADMIN`/`SUPER_ADMIN`, usuario activo y sesión; layout no admite operador. |
| Club sin datos                        | `ClubUser`, rol y selección de club.                                           |
| Producto institucional no publica     | Club/convenio activos.                                                         |
| «Los pagos aún no están configurados» | Credenciales, UID de club/originante y convenio vigente.                       |
| Cobro con pedido pendiente            | `APP_URL`, webhook, logs y conciliación Mobbex.                                |
| Cron 401                              | Secreto igual al web y variables presentes; no carga `.env` automáticamente.   |
| Cron inicia web                       | Configuración web heredada; seleccionar archivo cron sin healthcheck.          |
| Correo ausente                        | API Key, remitente, dominio verificado y logs.                                 |
| Estáticos fallan                      | Build completo que prepara standalone.                                         |
| `start` no encuentra servidor         | Ejecutar antes `npm run build`.                                                |
| Reintegro fallido                     | Medio, soporte del proveedor, estado/respuesta.                                |
| Archivo rechazado                     | Contenido, MIME, extensión y 5 MB; documentos no admiten GIF.                  |

## 14. Subir esta documentación a GitHub

Desde un clon Git, revisar y subir únicamente README:

```bash
git status --short
git diff -- README.md
git add README.md
git commit -m "docs: documentar funcionamiento y puesta en marcha"
git push
```

Sin upstream, usar `git push -u origin NOMBRE_DE_TU_RAMA` con su nombre real. Requiere permisos.

Con ZIP sin `.git`, obtener clon y copiar README o subirlo desde GitHub al repositorio correcto.

No publicar `.env`, contraseñas, tokens privados o copias de bases. `.env.example` es pública: solo plantillas o demos identificadas. Los ejemplos cron se agregan por separado cuando se decide usarlos.

## 15. Documentación complementaria

| Documento                                                          | Contenido                                                      |
| ------------------------------------------------------------------ | -------------------------------------------------------------- |
| [Configuración de pagos](docs/payments-configuration.md)           | Mobbex, alta comercial, clubes, split y homologación.          |
| [Migración Railway → Supabase](docs/migracion-railway-supabase.md) | Traslado y comprobación de base existente.                     |
| [Flujo de pago con tarjeta](docs/flujo-pago-tarjeta.md)            | Detalle de integración; comprobar referencias al flujo actual. |
| [Diagnóstico de Payway](docs/payway-troubleshooting.md)            | Referencia de integración anterior.                            |

Código/configuración son la referencia de lo implementado. Algunas guías conservan antecedentes; para nuevas compras seguir el flujo Mobbex.

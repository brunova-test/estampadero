INSERT INTO "HomeContentPiece" (
  "id", "code", "section", "title", "eyebrow", "description",
  "desktopImageUrl", "mobileImageUrl", "ctaLabel", "ctaHref",
  "secondaryCtaLabel", "secondaryCtaHref", "tags", "status", "sortOrder",
  "createdAt", "updatedAt"
)
VALUES
  (
    'content-hero-01', 'HERO-01', 'HERO', 'Estampamos tu equipo',
    'Temporada 2027',
    'Camisetas, buzos y conjuntos para clubes, escuelas y egresados. Desde 10 unidades.',
    '/images/equipo-main.png', '/images/equipo-t2.png', 'Ver catálogo',
    '/catalogo', 'Armar mi pedido', '/pedido-especial',
    ARRAY['Estampado textil', 'Clubes', 'Egresados', 'Empresas', 'Escolar']::TEXT[],
    'VISIBLE', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ),
  (
    'content-hero-02', 'HERO-02', 'HERO', 'Bajamos tu idea a la realidad',
    'Diseño a medida',
    '¿La viste en internet o la hiciste con IA? La adaptamos, la producimos y la convertimos en una prenda lista para usar.',
    '/images/hero-idea.png', '/images/hero-idea.png', 'Escribinos',
    'https://wa.me/5492657560737', 'Ver ejemplos', '/catalogo',
    ARRAY['Diseño propio', 'Mockup 3D', 'Muestra', 'Producción', 'Entrega']::TEXT[],
    'VISIBLE', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ),
  (
    'content-hero-03', 'HERO-03', 'HERO',
    'Comprá la indumentaria oficial de tu club', 'Clubes e instituciones',
    'Cada compra deja un porcentaje para la institución.', '/images/hero-2.png',
    '/images/hero-2.png', 'Ver tienda', '/#clubes', 'Sumar mi club',
    '/#clubes', ARRAY['Camisetas', 'Buzos', 'Conjuntos', 'Equipos', 'Clubes']::TEXT[],
    'VISIBLE', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ),
  (
    'content-campaign-01', 'CAMPAIGN-01', 'CAMPAIGN',
    '¿Te tocó organizar la ropa de la promo?', 'Promo egresaditos 2027',
    'Nosotros nos encargamos de todo: diseño, medición y confección. Vos solo coordinás con las otras familias.',
    '/images/promo-1-clean.png', '/images/promo-1-clean.png', 'Reservar ahora',
    'https://wa.me/5492657560737', 'Cómo funciona', '/pedido-especial',
    ARRAY['Conjunto + bandera de regalo', 'Diseño a elección']::TEXT[],
    'VISIBLE', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ),
  (
    'content-campaign-02', 'CAMPAIGN-02', 'CAMPAIGN',
    '¿Te tocó organizar la ropa de la promo?', 'Promo egresaditos 2027',
    'Nosotros nos encargamos de todo: diseño, medición y confección. Vos solo coordinás con las otras familias.',
    '/images/promo-2-clean.png', '/images/promo-2-clean.png', 'Reservar ahora',
    'https://wa.me/5492657560737', 'Cómo funciona', '/pedido-especial',
    ARRAY['Conjunto + bandera de regalo', 'Diseño a elección']::TEXT[],
    'VISIBLE', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ),
  (
    'content-campaign-03', 'CAMPAIGN-03', 'CAMPAIGN',
    '¿Te tocó organizar la ropa de la promo?', 'Promo egresaditos 2027',
    'Nosotros nos encargamos de todo: diseño, medición y confección. Vos solo coordinás con las otras familias.',
    '/images/promo-3-clean.png', '/images/promo-3-clean.png', 'Reservar ahora',
    'https://wa.me/5492657560737', 'Cómo funciona', '/pedido-especial',
    ARRAY['Conjunto + bandera de regalo', 'Diseño a elección']::TEXT[],
    'VISIBLE', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ),
  (
    'content-access-01', 'ACCESS-01', 'ACCESS', 'Comprá online', '01',
    'Prendas estándar, sin necesidad de crear cuenta.', '/images/on-1.png',
    '/images/on-1.png', 'Ver catálogo', '/catalogo', NULL, NULL,
    ARRAY[]::TEXT[], 'VISIBLE', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ),
  (
    'content-access-02', 'ACCESS-02', 'ACCESS', 'Estampá tu diseño', '02',
    'Pedido especial con aprobación de arte antes de producir.',
    '/images/on-2.png', '/images/on-2.png', 'Iniciar pedido',
    '/pedido-especial', NULL, NULL, ARRAY[]::TEXT[], 'VISIBLE', 1,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ),
  (
    'content-access-03', 'ACCESS-03', 'ACCESS', 'Convenios con clubes', '03',
    'Tu institución cobra un porcentaje de cada venta.', '/images/on-4.png',
    '/images/on-4.png', 'Conocer clubes', '/#clubes', NULL, NULL,
    ARRAY[]::TEXT[], 'VISIBLE', 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  ),
  (
    'content-promotion-01', 'PROMOTION-01', 'PROMOTION',
    '20% off en buzos de línea', 'Promo vigente · hasta 31/08',
    'Promoción destacada de la tienda.', '/images/promo-buzos.png',
    '/images/promo-buzos.png', 'Ver promoción',
    '/catalogo/buzo-canguro-friza-premium', NULL, NULL, ARRAY[]::TEXT[],
    'VISIBLE', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  )
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "SiteContentSetting" (
  "id", "carouselEnabled", "carouselIntervalMs", "updatedAt"
)
VALUES ('home', true, 4000, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

import argon2 from "argon2";
import { z } from "zod";

import { PrismaClient } from "../generated/prisma/index.js";

const db = new PrismaClient();

if (
  process.env.NODE_ENV === "production" &&
  process.env.SEED_PRODUCTION_CONFIRMATION !==
    "I_UNDERSTAND_THIS_SEEDS_PRODUCTION"
) {
  throw new Error(
    "Production seed blocked. Set SEED_PRODUCTION_CONFIRMATION=I_UNDERSTAND_THIS_SEEDS_PRODUCTION explicitly before running the seed.",
  );
}

const passwordHashOptions = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const;

const seedEnv = z
  .object({
    SEED_ADMIN_NAME: z.string().min(1),
    SEED_ADMIN_EMAIL: z.string().email(),
    SEED_ADMIN_PASSWORD: z.string().min(16),
    SEED_CLUB_USER_NAME: z
      .string()
      .min(1)
      .default("Representante Club Atlético"),
    SEED_CLUB_USER_EMAIL: z.string().email(),
    SEED_CLUB_USER_PASSWORD: z.string().min(16),
    SEED_CLUB_SLUG: z.string().min(1),
    SEED_CUSTOMER_NAME: z.string().min(1),
    SEED_CUSTOMER_EMAIL: z.string().email(),
    SEED_CUSTOMER_PASSWORD: z.string().min(16),
  })
  .parse(process.env);

interface SeedUserInput {
  name: string;
  email: string;
  password: string;
  role: "SUPER_ADMIN" | "CLUB_ADMIN" | "CUSTOMER";
}

async function seedUser({ name, email, password, role }: SeedUserInput) {
  const passwordHash = await argon2.hash(password, passwordHashOptions);

  return db.user.upsert({
    where: { email },
    update: { name, role, passwordHash, isActive: true },
    create: {
      email,
      name,
      role,
      passwordHash,
    },
  });
}

async function main() {
  const categories = await Promise.all(
    [
      { name: "Remeras", slug: "remeras" },
      { name: "Buzos", slug: "buzos" },
      { name: "Camisetas", slug: "camisetas" },
      { name: "Gorras", slug: "gorras" },
      { name: "Shorts", slug: "shorts" },
    ].map((category) =>
      db.category.upsert({
        where: { slug: category.slug },
        update: category,
        create: category,
      }),
    ),
  );
  const categoryBySlug = Object.fromEntries(
    categories.map((category) => [category.slug, category]),
  );

  const clubs = await Promise.all(
    [
      {
        slug: "club-atletico",
        name: "Club Atlético",
        sport: "Fútbol · Masculino y femenino",
        description:
          "Indumentaria oficial, pedidos de socios y participación por ventas del convenio.",
        logoUrl: "/images/club-futbol.png",
      },
      {
        slug: "escuela-n14",
        name: "Escuela N°14",
        sport: "Escolar · Nivel primario",
        logoUrl: "/images/club-escuela.png",
      },
      {
        slug: "voley-norte",
        name: "Vóley Norte",
        sport: "Vóley · Todas las categorías",
        logoUrl: "/images/club-voley.png",
      },
      {
        slug: "rugby-sur",
        name: "Rugby Sur",
        sport: "Rugby · Juveniles y plantel",
        logoUrl: "/images/club-rugby.png",
      },
    ].map((club) =>
      db.club.upsert({
        where: { slug: club.slug },
        update: club,
        create: club,
      }),
    ),
  );
  const clubBySlug = Object.fromEntries(clubs.map((club) => [club.slug, club]));

  const [adminUser, clubAdminUser] = await Promise.all([
    seedUser({
      name: seedEnv.SEED_ADMIN_NAME,
      email: seedEnv.SEED_ADMIN_EMAIL,
      password: seedEnv.SEED_ADMIN_PASSWORD,
      role: "SUPER_ADMIN",
    }),
    seedUser({
      name: seedEnv.SEED_CLUB_USER_NAME,
      email: seedEnv.SEED_CLUB_USER_EMAIL,
      password: seedEnv.SEED_CLUB_USER_PASSWORD,
      role: "CLUB_ADMIN",
    }),
    seedUser({
      name: seedEnv.SEED_CUSTOMER_NAME,
      email: seedEnv.SEED_CUSTOMER_EMAIL,
      password: seedEnv.SEED_CUSTOMER_PASSWORD,
      role: "CUSTOMER",
    }),
  ]);

  const seededClub = clubBySlug[seedEnv.SEED_CLUB_SLUG];
  if (!seededClub) {
    throw new Error(
      `SEED_CLUB_SLUG apunta a un club inexistente: ${seedEnv.SEED_CLUB_SLUG}`,
    );
  }

  await db.clubUser.upsert({
    where: {
      clubId_userId: { clubId: seededClub.id, userId: clubAdminUser.id },
    },
    update: {},
    create: { clubId: seededClub.id, userId: clubAdminUser.id },
  });

  const products = [
    {
      code: "BZ-1042",
      slug: "buzo-canguro-friza-premium",
      name: "Buzo canguro friza premium",
      description:
        "Buzo canguro de friza 80/20, corte unisex, ideal para uso urbano o como prenda de entrenamiento.",
      priceInCents: 3_890_000,
      compareAtCents: 4_860_000,
      line: "URBANA" as const,
      status: "PUBLISHED" as const,
      allowsCustomPrint: true,
      isFeatured: true,
      categorySlug: "buzos",
      clubSlug: "club-atletico",
      images: [
        { url: "/images/buzo-front.png", color: "Negro" },
        { url: "/images/buzo-back.png", color: "Negro" },
        { url: "/images/buzo-side.png", color: "Negro" },
      ],
      variants: [
        { size: "S", color: "Negro", stock: 8 },
        { size: "M", color: "Negro", stock: 14 },
        { size: "L", color: "Negro", stock: 10 },
        { size: "M", color: "Violeta", stock: 6 },
        { size: "M", color: "Gris", stock: 5 },
      ],
    },
    {
      code: "CM-208",
      slug: "camiseta-entrenamiento-dry",
      name: "Camiseta entrenamiento dry",
      description:
        "Camiseta técnica de secado rápido para entrenamiento y partido. Admite estampado de número y sponsor.",
      priceInCents: 2_450_000,
      line: "CLUB" as const,
      status: "PUBLISHED" as const,
      allowsCustomPrint: true,
      isFeatured: true,
      categorySlug: "camisetas",
      clubSlug: "club-atletico",
      images: [
        { url: "/images/remera2.png", color: "Azul" },
        { url: "/images/remera3.png", color: "Azul" },
      ],
      variants: [
        { size: "S", color: "Azul", stock: 12 },
        { size: "M", color: "Azul", stock: 20 },
        { size: "L", color: "Azul", stock: 15 },
        { size: "L", color: "Blanco", stock: 0 },
      ],
    },
    {
      code: "RT-311",
      slug: "remera-trabajo-reforzada",
      name: "Remera de trabajo reforzada",
      description:
        "Remera de trabajo con refuerzo en costuras, tela resistente. Personalizable con logo de empresa.",
      priceInCents: 1_990_000,
      line: "TRABAJO" as const,
      status: "PUBLISHED" as const,
      allowsCustomPrint: true,
      isFeatured: true,
      categorySlug: "remeras",
      images: [{ url: "/images/remera1.png", color: "Gris" }],
      variants: [
        { size: "M", color: "Gris", stock: 0 },
        { size: "L", color: "Gris", stock: 0 },
      ],
    },
    {
      code: "CH-115",
      slug: "chomba-escolar-pique",
      name: "Chomba escolar piqué",
      description: "Chomba piqué institucional, talles de niño a adulto.",
      priceInCents: 1_640_000,
      line: "ESCOLAR" as const,
      status: "PUBLISHED" as const,
      categorySlug: "camisetas",
      clubSlug: "escuela-n14",
      images: [{ url: "/images/remera3.png", color: "Azul marino" }],
      variants: [
        { size: "4", color: "Azul marino", stock: 6 },
        { size: "8", color: "Azul marino", stock: 5 },
        { size: "12", color: "Azul marino", stock: 4 },
        { size: "16", color: "Azul marino", stock: 3 },
      ],
    },
    {
      code: "SH-201",
      slug: "short-deportivo",
      name: "Short deportivo",
      description: "Short liviano de entrenamiento con bolsillos laterales.",
      priceInCents: 1_820_000,
      line: "TRAINING" as const,
      status: "PUBLISHED" as const,
      isFeatured: true,
      categorySlug: "shorts",
      clubSlug: "club-atletico",
      images: [{ url: "/images/short.png", color: "Negro" }],
      variants: [
        { size: "S", color: "Negro", stock: 10 },
        { size: "M", color: "Negro", stock: 12 },
        { size: "L", color: "Negro", stock: 9 },
      ],
    },
    {
      code: "GO-020",
      slug: "gorra-bordada-trucker",
      name: "Gorra bordada trucker",
      description: "Gorra trucker con bordado 3D, talle único ajustable.",
      priceInCents: 1_270_000,
      line: "URBANA" as const,
      status: "DRAFT" as const,
      categorySlug: "gorras",
      images: [{ url: "/images/gorras.png", color: "Negro" }],
      variants: [{ size: "Único", color: "Negro", stock: 62 }],
    },
  ];

  for (const product of products) {
    const { categorySlug, clubSlug, images, variants, ...data } = product;

    const created = await db.product.upsert({
      where: { slug: product.slug },
      update: {
        ...data,
        categoryId: categoryBySlug[categorySlug]?.id,
        clubId: clubSlug ? clubBySlug[clubSlug]?.id : undefined,
      },
      create: {
        ...data,
        categoryId: categoryBySlug[categorySlug]?.id,
        clubId: clubSlug ? clubBySlug[clubSlug]?.id : undefined,
      },
    });

    await db.productImage.deleteMany({ where: { productId: created.id } });
    await db.productImage.createMany({
      data: images.map((image, position) => ({
        productId: created.id,
        url: image.url,
        alt: created.name,
        color: image.color,
        position,
      })),
    });

    for (const variant of variants) {
      await db.productVariant.upsert({
        where: {
          productId_size_color: {
            productId: created.id,
            size: variant.size,
            color: variant.color,
          },
        },
        update: { stock: variant.stock },
        create: {
          productId: created.id,
          size: variant.size,
          color: variant.color,
          stock: variant.stock,
          sku: `${created.code}-${variant.size}-${variant.color}`
            .toUpperCase()
            .replace(/\s+/g, ""),
        },
      });
    }
  }

  await db.club.update({
    where: { id: seededClub.id },
    data: { payoutCbu: "0000003100010000000001" },
  });

  const agreement = await db.agreement.upsert({
    where: { code: "CV-2026-01" },
    update: {
      clubId: seededClub.id,
      contractUrl: "/documentos/convenio-club-atletico.html",
    },
    create: {
      clubId: seededClub.id,
      code: "CV-2026-01",
      title: "Indumentaria oficial",
      startDate: new Date("2026-03-01"),
      endDate: new Date("2027-02-28"),
      basePercentage: 12,
      settlementMethod: "TRANSFER",
      settlementFrequency: "AUTOMATIC",
      contractUrl: "/documentos/convenio-club-atletico.html",
    },
  });

  const clubProducts = await db.product.findMany({
    where: {
      slug: {
        in: [
          "camiseta-entrenamiento-dry",
          "buzo-canguro-friza-premium",
          "short-deportivo",
        ],
      },
    },
    include: {
      images: { orderBy: { position: "asc" }, take: 1 },
      variants: { orderBy: { id: "asc" }, take: 1 },
    },
  });
  const clubProductBySlug = Object.fromEntries(
    clubProducts.map((product) => [product.slug, product]),
  );

  const design = await db.design.upsert({
    where: { id: "seed-club-design-oficial" },
    update: {
      clubId: seededClub.id,
      title: "Camiseta oficial 2027",
      status: "SENT_TO_CLUB",
    },
    create: {
      id: "seed-club-design-oficial",
      clubId: seededClub.id,
      title: "Camiseta oficial 2027",
      status: "SENT_TO_CLUB",
    },
  });
  const designVersions = [
    { versionNumber: 1, imageUrl: "/images/remera2.png" },
    { versionNumber: 2, imageUrl: "/images/remera3.png" },
    { versionNumber: 3, imageUrl: "/images/diseno-camiseta.png" },
  ];
  for (const version of designVersions) {
    await db.designVersion.upsert({
      where: {
        designId_versionNumber: {
          designId: design.id,
          versionNumber: version.versionNumber,
        },
      },
      update: { imageUrl: version.imageUrl },
      create: { designId: design.id, ...version },
    });
  }
  await db.designComment.upsert({
    where: { id: "seed-design-comment-admin" },
    update: {
      message: "Incorporamos el escudo actualizado y ajustamos el sponsor.",
    },
    create: {
      id: "seed-design-comment-admin",
      designId: design.id,
      authorUserId: adminUser.id,
      authorName: adminUser.name ?? "El Estampadero",
      message: "Incorporamos el escudo actualizado y ajustamos el sponsor.",
    },
  });
  const designedProduct = clubProductBySlug["camiseta-entrenamiento-dry"];
  if (designedProduct) {
    await db.productDesign.upsert({
      where: {
        designId_productId: {
          designId: design.id,
          productId: designedProduct.id,
        },
      },
      update: {},
      create: { designId: design.id, productId: designedProduct.id },
    });
  }

  const closedBatch = await db.productionBatch.upsert({
    where: { id: "seed-club-batch-july" },
    update: {
      status: "CLOSED",
      createdAt: new Date("2026-07-15T12:00:00.000Z"),
      closedAt: new Date("2026-07-28T12:00:00.000Z"),
    },
    create: {
      id: "seed-club-batch-july",
      status: "CLOSED",
      createdAt: new Date("2026-07-15T12:00:00.000Z"),
      closedAt: new Date("2026-07-28T12:00:00.000Z"),
    },
  });
  const openBatch = await db.productionBatch.upsert({
    where: { id: "seed-club-batch-august" },
    update: {
      status: "OPEN",
      createdAt: new Date("2026-08-01T12:00:00.000Z"),
      closedAt: null,
    },
    create: {
      id: "seed-club-batch-august",
      status: "OPEN",
      createdAt: new Date("2026-08-01T12:00:00.000Z"),
    },
  });

  const demoOrders = [
    {
      id: "seed-club-order-july-1",
      itemId: "seed-club-order-item-july-1",
      productSlug: "camiseta-entrenamiento-dry",
      quantity: 1,
      status: "DELIVERED" as const,
      createdAt: new Date("2026-07-18T15:30:00.000Z"),
      contactName: "Lucía Fernández",
      batchId: closedBatch.id,
      settled: true,
    },
    {
      id: "seed-club-order-july-2",
      itemId: "seed-club-order-item-july-2",
      productSlug: "buzo-canguro-friza-premium",
      quantity: 2,
      status: "DELIVERED" as const,
      createdAt: new Date("2026-07-24T17:10:00.000Z"),
      contactName: "Matías Gómez",
      batchId: closedBatch.id,
      settled: true,
    },
    {
      id: "seed-club-order-august-1",
      itemId: "seed-club-order-item-august-1",
      productSlug: "short-deportivo",
      quantity: 3,
      status: "IN_PRODUCTION" as const,
      createdAt: new Date("2026-08-05T13:45:00.000Z"),
      contactName: "Carolina Ruiz",
      batchId: openBatch.id,
      settled: false,
    },
  ];

  const paidSettlement = await db.settlement.upsert({
    where: { id: "seed-club-settlement-july" },
    update: {
      clubId: seededClub.id,
      periodLabel: "07/2026",
      periodStart: new Date("2026-07-01T03:00:00.000Z"),
      periodEnd: new Date("2026-08-01T02:59:59.999Z"),
      status: "PAID",
      paidAt: new Date("2026-07-31T18:00:00.000Z"),
      confirmedByUserId: adminUser.id,
      receiptUrl: "/documentos/comprobante-club-atletico-julio.html",
    },
    create: {
      id: "seed-club-settlement-july",
      clubId: seededClub.id,
      periodLabel: "07/2026",
      periodStart: new Date("2026-07-01T03:00:00.000Z"),
      periodEnd: new Date("2026-08-01T02:59:59.999Z"),
      status: "PAID",
      totalInCents: 0,
      paidAt: new Date("2026-07-31T18:00:00.000Z"),
      confirmedByUserId: adminUser.id,
      receiptUrl: "/documentos/comprobante-club-atletico-julio.html",
    },
  });

  let paidSettlementTotal = 0;
  for (const demoOrder of demoOrders) {
    const product = clubProductBySlug[demoOrder.productSlug];
    const variant = product?.variants[0];
    if (!product || !variant) continue;
    const lineTotalInCents = product.priceInCents * demoOrder.quantity;

    const order = await db.order.upsert({
      where: { id: demoOrder.id },
      update: {
        status: demoOrder.status,
        contactName: demoOrder.contactName,
        productionBatchId: demoOrder.batchId,
        createdAt: demoOrder.createdAt,
      },
      create: {
        id: demoOrder.id,
        status: demoOrder.status,
        contactName: demoOrder.contactName,
        contactEmail: "compras.demo@clubatletico.com",
        contactPhone: "+54 9 11 5555-0101",
        deliveryMethod: "PICKUP",
        subtotalInCents: lineTotalInCents,
        totalInCents: lineTotalInCents,
        productionBatchId: demoOrder.batchId,
        createdAt: demoOrder.createdAt,
        items: {
          create: {
            id: demoOrder.itemId,
            productId: product.id,
            productName: product.name,
            productSlug: product.slug,
            variantId: variant.id,
            size: variant.size,
            color: variant.color,
            imageUrl: product.images[0]?.url ?? null,
            priceInCentsSnapshot: product.priceInCents,
            quantity: demoOrder.quantity,
            lineTotalInCents,
            clubId: seededClub.id,
            clubNameSnapshot: seededClub.name,
          },
        },
      },
      select: { orderNumber: true },
    });

    const amountInCents = Math.round(
      (lineTotalInCents * agreement.basePercentage) / 100,
    );
    if (demoOrder.settled) paidSettlementTotal += amountInCents;
    await db.commissionEntry.upsert({
      where: { sourceKey: `sale:${demoOrder.itemId}` },
      update: {
        clubId: seededClub.id,
        agreementId: agreement.id,
        orderId: demoOrder.id,
        orderNumber: order.orderNumber,
        productName: product.name,
        baseAmountInCents: lineTotalInCents,
        percentageApplied: agreement.basePercentage,
        amountInCents,
        status: demoOrder.settled ? "SETTLED" : "ACCRUED",
        settlementId: demoOrder.settled ? paidSettlement.id : null,
        createdAt: demoOrder.createdAt,
      },
      create: {
        sourceKey: `sale:${demoOrder.itemId}`,
        clubId: seededClub.id,
        agreementId: agreement.id,
        orderId: demoOrder.id,
        orderItemId: demoOrder.itemId,
        orderNumber: order.orderNumber,
        productName: product.name,
        baseAmountInCents: lineTotalInCents,
        percentageApplied: agreement.basePercentage,
        amountInCents,
        status: demoOrder.settled ? "SETTLED" : "ACCRUED",
        settlementId: demoOrder.settled ? paidSettlement.id : null,
        createdAt: demoOrder.createdAt,
      },
    });
  }
  await db.settlement.update({
    where: { id: paidSettlement.id },
    data: { totalInCents: paidSettlementTotal },
  });

  const homePieces = [
    {
      code: "HERO-01",
      title: "Estampamos tu equipo",
      eyebrow: "Temporada 2027",
      description:
        "Camisetas, buzos y conjuntos para clubes, escuelas y egresados. Desde 10 unidades.",
      desktopImageUrl: "/images/equipo-main.png",
      mobileImageUrl: "/images/equipo-main.png",
      ctaLabel: "Ver catálogo",
      ctaHref: "/catalogo",
      secondaryCtaLabel: "Armar mi pedido",
      secondaryCtaHref: "/pedido-especial",
      tags: ["Estampado textil", "Clubes", "Egresados", "Empresas", "Escolar"],
      section: "HERO",
      sortOrder: 0,
    },
    {
      code: "HERO-02",
      title: "Bajamos tu idea a la realidad",
      eyebrow: "Diseño a medida",
      description:
        "¿La viste en internet o la hiciste con IA? La adaptamos, la producimos y la convertimos en una prenda lista para usar.",
      desktopImageUrl: "/images/hero-idea.png",
      mobileImageUrl: "/images/hero-idea.png",
      ctaLabel: "Escribinos",
      ctaHref: "https://wa.me/5492657560737",
      secondaryCtaLabel: "Ver ejemplos",
      secondaryCtaHref: "/catalogo",
      tags: ["Diseño propio", "Mockup 3D", "Muestra", "Producción", "Entrega"],
      section: "HERO",
      sortOrder: 1,
    },
    {
      code: "HERO-03",
      title: "Comprá la indumentaria oficial de tu club",
      eyebrow: "Clubes e instituciones",
      description: "Cada compra deja un porcentaje para la institución.",
      desktopImageUrl: "/images/hero-2.png",
      mobileImageUrl: "/images/hero-2.png",
      ctaLabel: "Ver tienda",
      ctaHref: "/#clubes",
      secondaryCtaLabel: "Sumar mi club",
      secondaryCtaHref: "/#clubes",
      tags: ["Camisetas", "Buzos", "Conjuntos", "Equipos", "Clubes"],
      section: "HERO",
      sortOrder: 2,
    },
    ...["promo-1-clean.png", "promo-2-clean.png", "promo-3-clean.png"].map(
      (image, index) => ({
        code: `CAMPAIGN-${String(index + 1).padStart(2, "0")}`,
        title: "¿Te tocó organizar la ropa de la promo?",
        eyebrow: "Promo egresaditos 2027",
        description:
          "Nosotros nos encargamos de todo: diseño, medición y confección. Vos solo coordinás con las otras familias.",
        desktopImageUrl: `/images/${image}`,
        mobileImageUrl: `/images/${image}`,
        ctaLabel: "Reservar ahora",
        ctaHref: "https://wa.me/5492657560737",
        secondaryCtaLabel: "Cómo funciona",
        secondaryCtaHref: "/pedido-especial",
        tags: ["Conjunto + bandera de regalo", "Diseño a elección"],
        section: "CAMPAIGN",
        sortOrder: index,
      }),
    ),
    {
      code: "ACCESS-01",
      title: "Comprá online",
      eyebrow: "01",
      description: "Prendas estándar, sin necesidad de crear cuenta.",
      desktopImageUrl: "/images/on-1.png",
      mobileImageUrl: "/images/on-1.png",
      ctaLabel: "Ver catálogo",
      ctaHref: "/catalogo",
      secondaryCtaLabel: null,
      secondaryCtaHref: null,
      tags: [],
      section: "ACCESS",
      sortOrder: 0,
    },
    {
      code: "ACCESS-02",
      title: "Estampá tu diseño",
      eyebrow: "02",
      description: "Pedido especial con aprobación de arte antes de producir.",
      desktopImageUrl: "/images/on-2.png",
      mobileImageUrl: "/images/on-2.png",
      ctaLabel: "Iniciar pedido",
      ctaHref: "/pedido-especial",
      secondaryCtaLabel: null,
      secondaryCtaHref: null,
      tags: [],
      section: "ACCESS",
      sortOrder: 1,
    },
    {
      code: "ACCESS-03",
      title: "Convenios con clubes",
      eyebrow: "03",
      description: "Tu institución cobra un porcentaje de cada venta.",
      desktopImageUrl: "/images/on-4.png",
      mobileImageUrl: "/images/on-4.png",
      ctaLabel: "Conocer clubes",
      ctaHref: "/#clubes",
      secondaryCtaLabel: null,
      secondaryCtaHref: null,
      tags: [],
      section: "ACCESS",
      sortOrder: 2,
    },
    {
      code: "PROMOTION-01",
      title: "20% off en buzos de línea",
      eyebrow: "Promo vigente · hasta 31/08",
      description: "Promoción destacada de la tienda.",
      desktopImageUrl: "/images/promo-buzos.png",
      mobileImageUrl: "/images/promo-buzos.png",
      ctaLabel: "Ver promoción",
      ctaHref: "/catalogo/buzo-canguro-friza-premium",
      secondaryCtaLabel: null,
      secondaryCtaHref: null,
      tags: [],
      section: "PROMOTION",
      sortOrder: 0,
    },
  ];
  for (const piece of homePieces) {
    await db.homeContentPiece.upsert({
      where: { code: piece.code },
      update: {},
      create: { ...piece, status: "VISIBLE" },
    });
  }
  await db.siteContentSetting.upsert({
    where: { id: "home" },
    update: {},
    create: { id: "home", carouselEnabled: true, carouselIntervalMs: 4000 },
  });
  console.log(
    `Seed complete: ${categories.length} categories, ${clubs.length} clubs, ${products.length} products.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    void db.$disconnect();
  });

import Image from "next/image";

import { routes } from "elestampadero/shared/config/routes";
import { UnderlineLink } from "elestampadero/shared/ui";
import { WorkshopLocationModal } from "elestampadero/widgets/workshop-location";

const FOOTER_COLUMNS = [
  {
    title: "Tienda",
    links: [
      { label: "Catálogo", href: routes.catalog },
      { label: "Promociones", href: routes.promotions },
      { label: "Pedido personalizado", href: routes.specialRequest },
      { label: "Clubes", href: routes.clubs },
    ],
  },
  {
    title: "Ayuda",
    links: [
      { label: "Cómo comprar", href: "/ayuda/como-comprar" },
      { label: "Envíos y retiro", href: "/ayuda/envios" },
      { label: "Seguir mi pedido", href: "/ayuda/seguimiento" },
    ],
  },
  {
    title: "Contacto",
    links: [
      { label: "WhatsApp 2657 560737", href: "https://wa.me/5492657560737" },
      {
        label: "hola@elestampadero.com",
        href: "mailto:hola@elestampadero.com",
      },
      { label: "Paraguay 95", href: "#" },
      { label: "Lun a Vie 10:30 a 19:30", href: "#" },
    ],
  },
];

export function StoreFooter({ showAbout = false }: { showAbout?: boolean }) {
  return (
    <footer>
      {showAbout ? (
        <div className="store-footer-about relative min-h-[390px] overflow-hidden bg-white px-5 py-8 sm:px-8 md:flex md:h-[clamp(300px,19.6vw,392px)] md:min-h-0 md:flex-row md:gap-[clamp(28px,2.6vw,52px)] md:px-[clamp(40px,4vw,80px)] md:py-[clamp(28px,2.4vw,48px)]">
          <div className="brand-footer-cut absolute inset-y-0 right-0 w-[40%] overflow-hidden md:relative md:inset-auto md:h-full md:w-[45%] md:shrink-0">
            <Image
              src="/images/taller-footer-sm.png"
              alt="Taller El Estampadero"
              fill
              className="object-cover object-[58%_center] md:object-center"
              sizes="(min-width: 768px) 45vw, 100vw"
            />
          </div>
          <div className="relative z-10 flex w-[72%] flex-col justify-center gap-4 md:w-auto md:flex-1 md:gap-[clamp(10px,.9vw,18px)]">
            <p className="text-mid text-xs font-black tracking-[.16em] uppercase md:hidden">
              Sobre nosotros
            </p>
            <h2 className="font-display text-ink text-[32px] leading-[1.04] font-black tracking-[-.025em] md:text-[clamp(34px,2.6vw,52px)] md:leading-none">
              <span className="md:hidden">
                Taller de estampado e indumentaria
              </span>
              <span className="hidden md:inline">Sobre nosotros</span>
            </h2>
            <p className="text-muted max-w-[255px] text-[15px] leading-[1.5] md:max-w-[920px] md:text-[clamp(19px,1.5vw,30px)] md:leading-[1.4]">
              <span className="max-md:hidden">
                Taller de estampado e indumentaria.{" "}
              </span>
              Producimos para clubes, escuelas y empresas, con diseño propio y
              entregas en todo el país.
            </p>
            <WorkshopLocationModal />
          </div>
        </div>
      ) : null}

      <div className="store-footer-main bg-deep grid grid-cols-2 gap-x-5 gap-y-7 px-5 py-8 text-white sm:gap-10 sm:px-8 lg:grid-cols-[1fr_.8fr_.8fr_1.2fr_1.1fr] lg:px-[clamp(40px,4vw,80px)] lg:py-[clamp(40px,2.8vw,56px)]">
        <div className="store-footer-brand col-span-2 grid grid-cols-[92px_1fr] items-center gap-4 border-b border-white/10 pb-6 sm:col-span-1 sm:flex sm:flex-col sm:items-start sm:border-0 sm:pb-0">
          <Image
            src="/images/icono.jpg"
            alt="El Estampadero"
            width={96}
            height={96}
            className="h-[92px] w-[92px] object-contain invert sm:h-[60px] sm:w-[60px] md:h-[clamp(70px,4.8vw,96px)] md:w-[clamp(70px,4.8vw,96px)]"
          />
          <div className="flex flex-col gap-1.5">
            <strong className="font-display text-lg text-white sm:hidden">
              EL ESTAMPADERO
            </strong>
            <span className="hidden text-sm leading-[1.4] text-[#c9c0e0] sm:block md:text-[clamp(16px,1.3vw,26px)]">
              @el_estampadero
            </span>
            <span className="text-sm leading-relaxed text-white/70 sm:hidden">
              Taller de estampado e indumentaria. Calidad, diseño y compromiso.
            </span>
            <span className="text-mint text-sm sm:hidden">@el_estampadero</span>
          </div>
        </div>

        {FOOTER_COLUMNS.map((column) => (
          <div
            key={column.title}
            className={`store-footer-column store-footer-column--${column.title.toLowerCase()} flex flex-col gap-2 md:gap-[clamp(10px,.9vw,18px)] ${column.title === "Ayuda" ? "max-sm:hidden" : ""}`}
          >
            <h3 className="text-mint text-[13px] font-bold tracking-[.1em] uppercase md:text-[clamp(16px,1.3vw,26px)]">
              {column.title}
            </h3>
            {column.links.map((link) => (
              <UnderlineLink
                key={link.label}
                href={link.href}
                className="text-[15px] text-white md:text-[clamp(16px,1.3vw,26px)]"
              >
                {link.label}
              </UnderlineLink>
            ))}
          </div>
        ))}

        <div className="store-footer-payments col-span-2 flex flex-col gap-[clamp(8px,.6vw,12px)] sm:col-span-1">
          <h3 className="text-mint text-[clamp(13px,.9vw,18px)] font-bold tracking-[.1em] uppercase">
            Pagos
          </h3>
          <div className="flex flex-col items-start gap-1.5">
            <span className="payment-method-item text-ink flex min-h-11 w-full max-w-[210px] items-center gap-2.5 bg-white px-3 py-1.5 text-[clamp(12px,.85vw,16px)] font-semibold">
              <Image
                src="/images/payments/mercado-pago.svg"
                alt=""
                width={28}
                height={28}
                className="h-7 w-7 shrink-0"
              />
              Mercado Pago
            </span>
            <span className="payment-method-item flex min-h-11 w-full max-w-[210px] items-center bg-white px-3 py-1.5">
              <Image
                src="/images/payments/modo.png"
                alt="MODO"
                width={82}
                height={18}
                className="h-[18px] w-auto object-contain"
              />
            </span>
            <span className="payment-method-item text-ink flex min-h-11 w-full max-w-[210px] items-center gap-2.5 bg-white px-3 py-1.5 text-[clamp(12px,.85vw,16px)] font-semibold">
              <svg
                aria-hidden="true"
                viewBox="0 0 32 32"
                className="text-deep h-7 w-7 shrink-0"
                fill="none"
              >
                <rect
                  x="2.5"
                  y="6.5"
                  width="27"
                  height="19"
                  rx="3"
                  stroke="currentColor"
                  strokeWidth="2.5"
                />
                <path d="M3.5 12h25" stroke="currentColor" strokeWidth="3" />
                <path
                  d="M7 20h7"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
              Débito / Crédito
            </span>
          </div>
          <p className="max-w-[210px] text-[clamp(12px,.85vw,16px)] leading-[1.4] text-[#c9c0e0]">
            Tarjetas de débito y crédito · cuotas disponibles según tarjeta
          </p>
        </div>

        <div className="store-footer-care-actions col-span-2 lg:col-span-5">
          <strong>¿Necesitás ayuda con una compra?</strong>
          <div>
            <a href="/arrepentimiento">Arrepentimiento</a>
            <a href="/reclamos-devoluciones">Reclamos y devoluciones</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

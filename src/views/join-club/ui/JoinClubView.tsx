"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, type MouseEvent } from "react";

import { routes } from "elestampadero/shared/config/routes";
import { ButtonLink, Container } from "elestampadero/shared/ui";
import { RevealGroup, RevealOnScroll } from "elestampadero/shared/ui/motion";
import { StoreFooter } from "elestampadero/widgets/store-footer";
import { StoreHeader } from "elestampadero/widgets/store-header";

type IconName =
  "club" | "gym" | "school" | "group" | "person" | "pencil" | "eye" | "bag";

const AUDIENCES: Array<{
  title: string;
  description: string;
  highlight: string;
  icon: IconName;
}> = [
  {
    title: "Clubes",
    description:
      "Indumentaria oficial para todas las categorías y disciplinas.",
    highlight: "oficial",
    icon: "club",
  },
  {
    title: "Gimnasios",
    description: "Ropa de entrenamiento para tu comunidad y tus profesores.",
    highlight: "entrenamiento",
    icon: "gym",
  },
  {
    title: "Escuelas",
    description:
      "Equipos, promociones y prendas para representar a la institución.",
    highlight: "representar",
    icon: "school",
  },
  {
    title: "Equipos e instituciones",
    description: "Una propuesta personalizada para cada grupo.",
    highlight: "personalizada",
    icon: "group",
  },
];

const STEPS: Array<{
  title: string;
  description: string;
  icon: IconName;
}> = [
  {
    title: "Nos contás quiénes son",
    description: "Nombre, localidad, disciplinas y una persona de contacto.",
    icon: "person",
  },
  {
    title: "Armamos la propuesta",
    description:
      "Definimos productos, identidad visual y modalidad de trabajo.",
    icon: "pencil",
  },
  {
    title: "Aprobás los diseños",
    description: "Revisás las propuestas y pedís cambios antes de publicar.",
    icon: "eye",
  },
  {
    title: "Abrimos tu tienda",
    description:
      "Tu comunidad compra online y nosotros gestionamos cada pedido.",
    icon: "bag",
  },
];

const PROCESS_HASH = "#como-funciona";

function centerProcessContent(behavior: ScrollBehavior) {
  const section = document.getElementById("como-funciona");
  const processContent = section?.querySelector<HTMLElement>(
    ".join-club-container",
  );

  if (!processContent) return false;

  processContent.scrollIntoView({ behavior, block: "center" });
  return true;
}

function getProcessContentTop() {
  const section = document.getElementById("como-funciona");
  const processContent = section?.querySelector<HTMLElement>(
    ".join-club-container",
  );

  if (!processContent) return null;

  const bounds = processContent.getBoundingClientRect();
  const centeredTop =
    window.scrollY + bounds.top - (window.innerHeight - bounds.height) / 2;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

  return Math.min(Math.max(centeredTop, 0), maxScroll);
}

function LineIcon({ name }: { name: IconName }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.65,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className="join-club-line-icon">
      {name === "club" ? (
        <>
          <path
            {...common}
            d="M16 3.5 27 8v7.5c0 6.8-4.5 11-11 13-6.5-2-11-6.2-11-13V8l11-4.5Z"
          />
          <path
            {...common}
            d="m16 10 1.7 3.4 3.8.5-2.8 2.7.7 3.8-3.4-1.8-3.4 1.8.7-3.8-2.8-2.7 3.8-.5L16 10Z"
          />
        </>
      ) : null}
      {name === "gym" ? (
        <path
          {...common}
          d="M10 12v8M22 12v8M6 14v4M26 14v4M10 16h12M4 13v6M28 13v6"
        />
      ) : null}
      {name === "school" ? (
        <>
          <path {...common} d="m3 11 13-6 13 6-13 6-13-6Z" />
          <path {...common} d="M8 14v7c4.8 3.5 11.2 3.5 16 0v-7M29 11v9" />
        </>
      ) : null}
      {name === "group" ? (
        <>
          <circle {...common} cx="16" cy="10" r="4" />
          <circle {...common} cx="7" cy="13" r="3" />
          <circle {...common} cx="25" cy="13" r="3" />
          <path
            {...common}
            d="M9 27v-2c0-4 2.8-7 7-7s7 3 7 7v2M2.5 26v-1.5c0-3.1 2-5.5 5-5.5M29.5 26v-1.5c0-3.1-2-5.5-5-5.5"
          />
        </>
      ) : null}
      {name === "person" ? (
        <>
          <circle {...common} cx="16" cy="10" r="5" />
          <path {...common} d="M7 28v-3c0-5.2 3.6-8.5 9-8.5s9 3.3 9 8.5v3" />
        </>
      ) : null}
      {name === "pencil" ? (
        <>
          <path {...common} d="m6 23-1 5 5-1 16-16-4-4L6 23Z" />
          <path {...common} d="m19 10 4 4M5 28l4-4" />
        </>
      ) : null}
      {name === "eye" ? (
        <>
          <path
            {...common}
            d="M3 16s4.5-8 13-8 13 8 13 8-4.5 8-13 8S3 16 3 16Z"
          />
          <circle {...common} cx="16" cy="16" r="4" />
        </>
      ) : null}
      {name === "bag" ? (
        <>
          <path {...common} d="M6 11h20l2 17H4l2-17Z" />
          <path {...common} d="M11 13V9a5 5 0 0 1 10 0v4" />
        </>
      ) : null}
    </svg>
  );
}

function SectionHeading({
  eyebrow,
  children,
}: {
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <RevealOnScroll className="join-club-section-heading">
      <span>{eyebrow}</span>
      <i aria-hidden="true" />
      <h2>{children}</h2>
    </RevealOnScroll>
  );
}

function HighlightedDescription({
  text,
  highlight,
}: {
  text: string;
  highlight: string;
}) {
  const [before, after = ""] = text.split(highlight);

  return (
    <>
      {before}
      <strong>{highlight}</strong>
      {after}
    </>
  );
}

export function JoinClubView() {
  const smoothScrollFrame = useRef(0);

  useEffect(() => {
    let animationFrame = 0;
    let cancelled = false;
    const shouldRecenterAfterFonts = window.location.hash === PROCESS_HASH;

    const centerCurrentHash = () => {
      if (window.location.hash !== PROCESS_HASH) return;

      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(() => {
        centerProcessContent("auto");
      });
    };

    centerCurrentHash();
    window.addEventListener("hashchange", centerCurrentHash);
    if (shouldRecenterAfterFonts) {
      void document.fonts.ready.then(() => {
        if (!cancelled) centerCurrentHash();
      });
    }

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(animationFrame);
      window.cancelAnimationFrame(smoothScrollFrame.current);
      window.removeEventListener("hashchange", centerCurrentHash);
    };
  }, []);

  const scrollToProcess = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    window.history.replaceState(null, "", PROCESS_HASH);

    const targetTop = getProcessContentTop();
    if (targetTop === null) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      window.scrollTo({ top: targetTop });
      return;
    }

    window.cancelAnimationFrame(smoothScrollFrame.current);
    const startTop = window.scrollY;
    const distance = targetTop - startTop;
    const duration = 900;
    const startedAt = performance.now();

    const animateScroll = (currentTime: number) => {
      const progress = Math.min((currentTime - startedAt) / duration, 1);
      const easedProgress =
        progress < 0.5
          ? 4 * progress * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      window.scrollTo({ top: startTop + distance * easedProgress });

      if (progress < 1) {
        smoothScrollFrame.current = window.requestAnimationFrame(animateScroll);
      }
    };

    smoothScrollFrame.current = window.requestAnimationFrame(animateScroll);
  };

  const scrollToContact = (event: MouseEvent<HTMLAnchorElement>) => {
    const contactSection = document.getElementById("contacto-clubes");
    if (!contactSection) return;

    event.preventDefault();
    contactSection.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "center",
    });
    window.history.replaceState(null, "", "#contacto-clubes");
  };

  return (
    <div className="join-club-page flex min-h-screen flex-col">
      <StoreHeader />
      <main className="flex-1">
        <section
          data-motion-ignore
          className="join-club-editorial"
          aria-labelledby="join-title"
        >
          <aside className="join-club-editorial__rail" aria-hidden="true">
            <span>Clubes e instituciones</span>
            <i />
          </aside>

          <div className="join-club-editorial__content">
            <Link
              href={routes.home}
              className="join-club-editorial__back"
              aria-label="Volver a la página principal"
            >
              <span aria-hidden="true">←</span>
              Volver
            </Link>

            <div className="join-club-editorial__intro">
              <span className="join-club-editorial__eyebrow">
                Clubes e instituciones
              </span>
              <i
                className="join-club-editorial__mint-line"
                aria-hidden="true"
              />
              <h1 id="join-title">
                Sumá tu
                <br />
                club, gimnasio
                <br />o institución
              </h1>
              <p>
                Creamos una <strong>tienda oficial</strong> para que tu
                comunidad compre <strong>indumentaria personalizada</strong>{" "}
                cuando quiera.
              </p>
              <a
                href="#como-funciona"
                className="join-club-editorial__cta"
                onClick={scrollToProcess}
              >
                Ver cómo funciona
              </a>
            </div>
          </div>

          <div className="join-club-editorial__visual">
            <Image
              src="/images/sumar-club-hero-v2.png"
              alt="Dos camisetas deportivas, una violeta y otra negra, sobre una composición violeta"
              fill
              priority
              sizes="(max-width: 899px) 100vw, 52vw"
              className="object-cover"
            />
          </div>
        </section>

        <section data-motion-ignore className="join-club-audiences">
          <Container className="join-club-container">
            <SectionHeading eyebrow="¿Para quién es?">
              Una solución para
              <br /> cada comunidad.
            </SectionHeading>

            <RevealGroup
              className="join-club-audiences__grid"
              stagger={0.09}
              distance={28}
            >
              {AUDIENCES.map(
                ({ title, description, highlight, icon }, index) => (
                  <article key={title} className="join-club-audience-card">
                    <span className="join-club-audience-card__number">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="join-club-audience-card__icon">
                      <LineIcon name={icon} />
                    </div>
                    <h3>{title}</h3>
                    <p>
                      <HighlightedDescription
                        text={description}
                        highlight={highlight}
                      />
                    </p>
                  </article>
                ),
              )}
            </RevealGroup>
          </Container>
        </section>

        <section
          data-motion-ignore
          id="como-funciona"
          className="join-club-process"
        >
          <Container className="join-club-container">
            <SectionHeading eyebrow="Cómo nos manejamos">
              Del primer contacto
              <br /> a la tienda publicada.
            </SectionHeading>

            <RevealGroup
              className="join-club-process__grid"
              stagger={0.12}
              distance={32}
            >
              {STEPS.map(({ title, description, icon }, index) => (
                <article
                  key={title}
                  className={`join-club-process-card join-club-process-card--${index + 1}`}
                >
                  <span className="join-club-process-card__number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="join-club-process-card__icon">
                    <LineIcon name={icon} />
                  </div>
                  <div className="join-club-process-card__copy">
                    <h3>{title}</h3>
                    <p>{description}</p>
                  </div>
                </article>
              ))}
            </RevealGroup>
          </Container>

          <a
            href="#contacto-clubes"
            className="join-club-contact-cue"
            aria-label="Ir a la sección de contacto"
            onClick={scrollToContact}
          >
            <span>Contactanos</span>
            <span className="join-club-contact-cue__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path d="M12 4v15M6.5 13.5 12 19l5.5-5.5" />
              </svg>
            </span>
          </a>
        </section>

        <section
          data-motion-ignore
          id="contacto-clubes"
          className="join-club-final-cta"
        >
          <Container className="join-club-container">
            <RevealOnScroll>
              <div className="join-club-final-cta__inner">
                <div>
                  <span>¿Querés empezar?</span>
                  <h2>Contanos sobre tu institución.</h2>
                </div>
                <ButtonLink href={routes.specialRequest} variant="mint">
                  Hablar con el equipo
                </ButtonLink>
              </div>
            </RevealOnScroll>
          </Container>
        </section>
      </main>
      <StoreFooter />
    </div>
  );
}

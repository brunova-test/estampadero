"use client";

import { signIn } from "next-auth/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { routes } from "elestampadero/shared/config/routes";
import { SESSION_PERSISTENCE_COOKIE } from "elestampadero/shared/config/auth";
import { api } from "elestampadero/trpc/react";

type Tab = "login" | "register";

export function SignInView() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const registerMutation = api.identity.register.useMutation();

  function saveSessionPreference() {
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    const maxAge = rememberMe ? `; Max-Age=${30 * 24 * 60 * 60}` : "";
    document.cookie = `${SESSION_PERSISTENCE_COOKIE}=${rememberMe}; Path=/; SameSite=Lax${maxAge}${secure}`;
  }

  async function handleLogin() {
    saveSessionPreference();
    const result = await signIn("credentials", {
      email,
      password,
      rememberMe: rememberMe ? "true" : "false",
      redirect: false,
    });

    if (!result || result.error) {
      setError("Correo o contraseña incorrectos.");
      return false;
    }
    return true;
  }

  async function handleRegister() {
    try {
      await registerMutation.mutateAsync({ name, email, password });
    } catch (mutationError) {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : "No pudimos crear la cuenta.",
      );
      return false;
    }
    return handleLogin();
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const ok = tab === "login" ? await handleLogin() : await handleRegister();

    setIsSubmitting(false);
    if (ok) {
      const callbackUrl = new URLSearchParams(window.location.search).get(
        "callbackUrl",
      );
      const destination =
        callbackUrl?.startsWith("/") && !callbackUrl.startsWith("//")
          ? callbackUrl
          : routes.access;
      window.location.assign(destination);
    }
  }

  return (
    <main className="relative flex h-[100svh] min-h-0 flex-col overflow-hidden bg-[#0b0817] lg:flex-row lg:bg-white">
      <div
        className="absolute inset-0 overflow-hidden lg:hidden"
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-[radial-gradient(85%_65%_at_28%_26%,rgba(70,20,160,.72)_0%,rgba(11,8,23,.2)_72%)]" />
        <div className="bg-deep/65 absolute -bottom-[20%] -left-[28%] h-[62%] w-[85%] rounded-full" />
        <div className="border-mint/45 absolute top-[8%] right-[8%] h-[24%] w-[34%] rotate-[18deg] border-[3px]" />
        <div
          className="bg-mint/80 absolute right-[12%] bottom-[10%] h-[9%] w-[16%]"
          style={{ clipPath: "polygon(50% 0,100% 100%,0 100%)" }}
        />
        <div className="bg-mint absolute right-0 bottom-0 left-0 h-2" />
      </div>
      <section
        suppressHydrationWarning
        className="relative hidden shrink-0 overflow-hidden bg-[#0b0817] text-white lg:block lg:h-full lg:min-h-0 lg:w-[51%] lg:[clip-path:polygon(0_0,100%_0,90%_100%,0_100%)]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(85%_65%_at_28%_26%,rgba(70,20,160,.55)_0%,rgba(11,8,23,0)_72%)]" />
        <div className="bg-deep/55 absolute -bottom-[44%] -left-[14%] h-[75%] w-[61%] rounded-full lg:-bottom-[18%] lg:h-[63%] lg:w-[61%]" />
        <div className="border-mint/50 absolute top-[19%] right-[15%] h-[28%] w-[23%] rotate-[18deg] border-[3px] lg:top-[12%] lg:right-[15%] lg:h-[23%] lg:w-[23%] lg:border-4" />
        <div
          className="bg-mint absolute right-[12%] bottom-[25%] hidden h-[11%] w-[11%] opacity-90 lg:block"
          style={{ clipPath: "polygon(50% 0,100% 100%,0 100%)" }}
        />
        <div className="bg-mint absolute right-0 bottom-0 left-0 h-[10px] lg:h-3" />
        <a
          href={routes.home}
          className="absolute top-8 left-7 z-10 flex items-center gap-4 lg:top-[8.9%] lg:left-[7.1%] lg:flex-col lg:items-start lg:gap-[clamp(14px,1.2vw,24px)]"
        >
          <Image
            src="/images/icono.jpg"
            alt="El Estampadero"
            width={190}
            height={190}
            priority
            className="h-16 w-16 object-contain invert sm:h-20 sm:w-20 lg:h-[clamp(118px,9.5vw,190px)] lg:w-[clamp(118px,9.5vw,190px)]"
          />
          <span className="font-display text-[clamp(21px,2.3vw,46px)] font-black tracking-[.06em]">
            EL ESTAMPADERO
          </span>
        </a>

        <div className="absolute right-7 bottom-10 left-7 z-10 flex flex-col gap-4 lg:right-[18%] lg:bottom-[11%] lg:left-[7.1%] lg:gap-[clamp(12px,1.1vw,22px)]">
          <h1 className="font-display max-w-[760px] text-[clamp(38px,3.7vw,74px)] leading-none font-black uppercase">
            Tu cuenta, tu equipo
          </h1>
          <p className="hidden max-w-[760px] text-[clamp(20px,1.5vw,30px)] leading-[1.4] text-[#ded6f2] lg:block">
            Seguí tus pedidos, guardá tus talles y accedé a los diseños de tu
            club.
          </p>
          <div className="hidden flex-wrap gap-3.5 lg:flex">
            <span className="bg-mint/15 text-mint px-[clamp(14px,1.1vw,22px)] py-[clamp(7px,.6vw,12px)] text-[clamp(16px,1.25vw,25px)] font-semibold">
              Seguimiento de pedidos
            </span>
            <span className="bg-white/10 px-[clamp(14px,1.1vw,22px)] py-[clamp(7px,.6vw,12px)] text-[clamp(16px,1.25vw,25px)] font-semibold text-white">
              Talles guardados
            </span>
          </div>
        </div>
      </section>

      <section
        suppressHydrationWarning
        className="relative z-10 flex h-full min-h-0 flex-1 items-center justify-center overflow-y-auto px-4 py-4 sm:px-10 lg:px-[clamp(40px,4.5vw,72px)] lg:py-[clamp(16px,2.8vh,28px)]"
      >
        <div className="flex w-full max-w-[460px] flex-col gap-[clamp(12px,1.8vh,20px)] rounded-2xl bg-white/95 p-4 shadow-[0_24px_70px_-24px_rgba(0,0,0,.72)] backdrop-blur-sm sm:p-6 lg:rounded-none lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-none">
          <button
            type="button"
            onClick={() => router.push("/")}
            data-variant="outlineDark"
            className="brand-action brand-cut border-deep text-deep group inline-flex min-h-11 w-fit items-center gap-2 border-2 bg-white px-5 py-2 text-sm font-extrabold tracking-[.06em] uppercase shadow-[0_8px_22px_-14px_rgba(46,4,112,.45)]"
            aria-label="Volver al inicio"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5 transition-transform duration-300 group-hover:-translate-x-1 group-focus-visible:-translate-x-1"
            >
              <path
                d="m15 18-6-6 6-6M9 12h11"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Volver
          </button>

          <form
            onSubmit={handleSubmit}
            className="flex w-full flex-col gap-[clamp(16px,2.2vh,24px)] rounded-2xl bg-white/80 p-1 sm:p-2"
          >
            <div className="bg-paper grid grid-cols-2 gap-2 rounded-xl p-1.5">
              {[
                { key: "login" as const, label: "Ingresar" },
                { key: "register" as const, label: "Crear cuenta" },
              ].map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => {
                    setTab(option.key);
                    setError(null);
                  }}
                  className={`font-display min-h-12 rounded-lg border px-3 py-2.5 text-[clamp(15px,2.1vh,18px)] font-extrabold whitespace-nowrap uppercase transition-all ${
                    tab === option.key
                      ? "border-deep bg-deep text-white shadow-[0_8px_18px_-14px_rgba(46,4,112,.8)]"
                      : "border-deep/10 hover:border-blue/35 hover:text-deep bg-white text-[#8f86a8]"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-[clamp(10px,1.5vh,16px)]">
              {tab === "register" ? (
                <label className="flex flex-col gap-1.5">
                  <span className="text-mid text-[clamp(14px,2vh,18px)] font-bold tracking-[.04em]">
                    Nombre y apellido
                  </span>
                  <input
                    required
                    autoComplete="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="border-deep/15 bg-paper/65 focus:border-blue h-[clamp(50px,7vh,54px)] rounded-lg border px-4 text-[clamp(15px,2.1vh,17px)] transition-shadow outline-none focus:shadow-[0_0_0_3px_rgba(38,83,255,.08)]"
                  />
                </label>
              ) : null}

              <label className="flex flex-col gap-1.5">
                <span className="text-mid text-[clamp(14px,2vh,18px)] font-bold tracking-[.04em]">
                  Correo electrónico
                </span>
                <input
                  required
                  type="email"
                  autoComplete="email"
                  placeholder="tunombre@mail.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="border-deep/15 bg-paper/65 focus:border-blue h-[clamp(50px,7vh,54px)] rounded-lg border px-4 text-[clamp(15px,2.1vh,17px)] transition-shadow outline-none placeholder:text-[#a49dba] focus:shadow-[0_0_0_3px_rgba(38,83,255,.08)]"
                />
              </label>

              <label className="flex flex-col gap-1.5">
                <span className="text-mid text-[clamp(14px,2vh,18px)] font-bold tracking-[.04em]">
                  Contraseña
                </span>
                <div className="relative">
                  <input
                    required
                    minLength={tab === "register" ? 8 : undefined}
                    type={showPassword ? "text" : "password"}
                    autoComplete={
                      tab === "login" ? "current-password" : "new-password"
                    }
                    placeholder="••••••••"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="border-deep/15 bg-paper/65 focus:border-blue h-[clamp(50px,7vh,54px)] w-full rounded-lg border px-4 pr-12 text-[clamp(15px,2.1vh,17px)] transition-shadow outline-none placeholder:text-[#a49dba] focus:shadow-[0_0_0_3px_rgba(38,83,255,.08)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={
                      showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                    }
                    className="text-muted hover:text-deep absolute inset-y-0 right-0 flex w-12 items-center justify-center transition-colors"
                  >
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-5 w-5"
                    >
                      {showPassword ? (
                        <>
                          <path
                            d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
                            stroke="currentColor"
                            strokeWidth="1.8"
                          />
                          <circle
                            cx="12"
                            cy="12"
                            r="2.5"
                            stroke="currentColor"
                            strokeWidth="1.8"
                          />
                        </>
                      ) : (
                        <path
                          d="m3 3 18 18M10.6 6.3A10.8 10.8 0 0 1 12 6c6 0 9.5 6 9.5 6a17.4 17.4 0 0 1-3.1 3.7M6.2 6.6C3.9 8.3 2.5 12 2.5 12s3.5 6 9.5 6c1.3 0 2.5-.3 3.5-.8"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      )}
                    </svg>
                  </button>
                </div>
              </label>

              {tab === "login" ? (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <label className="text-muted flex items-center gap-2.5 text-[clamp(14px,2vh,18px)]">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(event) => setRememberMe(event.target.checked)}
                      className="peer sr-only"
                    />
                    <span
                      aria-hidden="true"
                      className="peer-focus-visible:ring-blue peer-checked:border-deep flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 border-[#c9c4d6] bg-white transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2"
                    >
                      <svg
                        viewBox="0 0 16 16"
                        fill="none"
                        className={`text-deep h-4 w-4 transition-opacity ${rememberMe ? "opacity-100" : "opacity-0"}`}
                      >
                        <path
                          d="m3.25 8.25 3 3 6.5-6.5"
                          stroke="currentColor"
                          strokeWidth="2.25"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    Recordarme
                  </label>
                  <a
                    href="mailto:hola@elestampadero.com?subject=Olvidé%20mi%20contraseña"
                    className="text-blue hover:text-mid text-[clamp(14px,2vh,18px)] font-semibold"
                  >
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>
              ) : null}
            </div>

            {error ? (
              <p className="text-base font-semibold text-[#c0392b]">{error}</p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting || undefined}
              className="brand-cut bg-deep hover:bg-mid relative min-h-12 px-6 py-[clamp(11px,1.8vh,15px)] text-center text-[clamp(16px,2.3vh,20px)] font-extrabold text-white uppercase transition-colors disabled:cursor-wait disabled:opacity-80"
            >
              <span className="inline-flex items-center justify-center gap-2">
                {isSubmitting
                  ? tab === "login"
                    ? "Iniciando sesión"
                    : "Creando cuenta"
                  : tab === "login"
                    ? "Ingresar"
                    : "Crear cuenta"}
                {isSubmitting ? (
                  <span
                    aria-hidden="true"
                    className="h-5 w-5 animate-spin rounded-full border-2 border-white/25 border-t-white"
                  />
                ) : null}
              </span>
            </button>

            <div className="flex items-center gap-5">
              <span className="h-0.5 flex-1 bg-[#eceaf1]" />
              <span className="font-mono text-[clamp(12px,1.8vh,15px)] font-medium text-[#a49dba]">
                O
              </span>
              <span className="h-0.5 flex-1 bg-[#eceaf1]" />
            </div>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                setError(null);
                setIsSubmitting(true);
                saveSessionPreference();
                const callbackUrl = new URLSearchParams(
                  window.location.search,
                ).get("callbackUrl");
                const destination =
                  callbackUrl?.startsWith("/") && !callbackUrl.startsWith("//")
                    ? callbackUrl
                    : routes.access;
                void signIn("google", { callbackUrl: destination });
              }}
              className="text-ink hover:border-blue hover:bg-paper inline-flex min-h-11 items-center justify-center gap-3 border-2 border-[#d9d5e2] px-6 py-[clamp(10px,1.7vh,14px)] text-center text-[clamp(15px,2.1vh,18px)] font-semibold transition-colors disabled:cursor-wait disabled:opacity-60"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-5 w-5 shrink-0"
              >
                <path
                  fill="#4285F4"
                  d="M21.6 12.23c0-.71-.06-1.23-.2-1.77H12v3.41h5.52a4.73 4.73 0 0 1-2.05 3.02l-.02.11 2.98 2.31.21.02c1.94-1.8 2.96-4.43 2.96-7.1Z"
                />
                <path
                  fill="#34A853"
                  d="M12 22c2.7 0 4.96-.89 6.64-2.67l-3.17-2.44c-.85.57-1.98.97-3.47.97a6.02 6.02 0 0 1-5.7-4.16l-.11.01-3.1 2.4-.04.1A10.02 10.02 0 0 0 12 22Z"
                />
                <path
                  fill="#FBBC05"
                  d="M6.3 13.7A6.17 6.17 0 0 1 6 11.86c0-.64.11-1.26.29-1.84l-.01-.12-3.14-2.44-.1.05A10.13 10.13 0 0 0 2 11.86c0 1.57.37 3.06 1.04 4.35L6.3 13.7Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.86c1.87 0 3.13.81 3.85 1.48l2.86-2.79C16.95 2.92 14.7 2 12 2a10.02 10.02 0 0 0-8.96 5.51l3.25 2.51A6.04 6.04 0 0 1 12 5.86Z"
                />
              </svg>
              {isSubmitting
                ? "Conectando con Google..."
                : "Continuar con Google"}
            </button>

            <p className="text-muted text-center text-[clamp(14px,1.9vh,17px)]">
              También podés{" "}
              <a
                href={routes.catalog}
                className="text-blue hover:text-mid font-semibold"
              >
                comprar sin cuenta
              </a>
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}

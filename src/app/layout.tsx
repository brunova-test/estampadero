import "elestampadero/styles/globals.css";

import { type Metadata, type Viewport } from "next";
import { Inter, Space_Mono } from "next/font/google";
import localFont from "next/font/local";
import { connection } from "next/server";

import { TRPCReactProvider } from "elestampadero/trpc/react";
import { GlobalLoadingProvider } from "elestampadero/shared/ui/global-loading/GlobalLoadingProvider";
import { MotionExperience } from "elestampadero/shared/ui/motion";
import { AuthSessionGuard } from "elestampadero/shared/ui/auth-session-guard/AuthSessionGuard";

export const metadata: Metadata = {
  title: "El Estampadero",
  description:
    "Indumentaria y productos estampados para clubes, escuelas, empresas y particulares.",
  icons: {
    icon: [{ url: "/images/icono.jpg", type: "image/jpeg" }],
    shortcut: "/images/icono.jpg",
    apple: "/images/icono.jpg",
  },
  appleWebApp: {
    capable: true,
    title: "El Estampadero",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#0e0a1a",
  colorScheme: "light",
};

const archivo = localFont({
  src: "../../public/fonts/Archivo-Variable.ttf",
  weight: "100 900",
  variable: "--font-archivo",
});

const barlow = localFont({
  src: [
    { path: "../../public/fonts/Barlow-Regular.ttf", weight: "400" },
    { path: "../../public/fonts/Barlow-Medium.ttf", weight: "500" },
    { path: "../../public/fonts/Barlow-SemiBold.ttf", weight: "600" },
    { path: "../../public/fonts/Barlow-Bold.ttf", weight: "700" },
  ],
  variable: "--font-barlow",
});

const ibmPlexMono = localFont({
  src: "../../public/fonts/IBMPlexMono-Medium.ttf",
  weight: "500",
  variable: "--font-ibm-plex-mono",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const vcrOsdMono = localFont({
  src: "../../public/fonts/VCR_OSD_MONO.ttf",
  weight: "400",
  variable: "--font-vcr-osd-mono",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
});

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {


  await connection();

  return (
    <html
      lang="es"
      className={`${archivo.variable} ${barlow.variable} ${ibmPlexMono.variable} ${inter.variable} ${vcrOsdMono.variable} ${spaceMono.variable}`}
    >
      <body>
        <TRPCReactProvider>
          <AuthSessionGuard />
          <GlobalLoadingProvider>
            <MotionExperience>{children}</MotionExperience>
          </GlobalLoadingProvider>
        </TRPCReactProvider>
      </body>
    </html>
  );
}

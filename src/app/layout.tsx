// app/layout.tsx
import React from "react";
import "./globals.css";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import { Providers } from "@/components/providers";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";
import A11yLiveAnnouncer from "@/components/accessibility/A11yLiveAnnouncer";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" href="/favicon.png" sizes="any" />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <A11yLiveAnnouncer />
        <ServiceWorkerRegister />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Demand Radar",
  description: "Detecta señales de intención de compra desde fuentes públicas",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="flex h-screen overflow-hidden bg-slate-50">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

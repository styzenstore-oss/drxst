import type { Metadata } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import SiteChrome from "@/components/SiteChrome";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
});

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_SITE_NAME || "TokoDigital",
  description: "Marketplace produk digital: akun, jasa, dan voucher.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={`${manrope.variable} ${spaceGrotesk.variable} font-body`}>
        <CartProvider>
          <SiteChrome>{children}</SiteChrome>
        </CartProvider>
      </body>
    </html>
  );
}

export default function Footer() {
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "TokoDigital";
  return (
    <footer className="mt-16 border-t border-line py-10 text-sm text-mist/60">
      <div className="container-page flex flex-col items-center justify-between gap-3 sm:flex-row">
        <p>© {new Date().getFullYear()} {siteName}. Semua hak dilindungi.</p>
        <p>Pembayaran manual transfer — dikonfirmasi maksimal 1x24 jam.</p>
      </div>
    </footer>
  );
}

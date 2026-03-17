import "./globals.css";

export const metadata = {
  title: "Dew — AI Assistant",
  description: "Dew is an AI front-desk assistant for your business.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

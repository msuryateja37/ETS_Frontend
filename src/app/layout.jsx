import "./globals.css";
import Providers from "./providers";

export const metadata = {
  title: "EMPERORS PALACE",
  description: "Event Ticketing System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased bg-background text-foreground">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
import "./globals.css";
import ClientLayout from "@/components/clientLayout";

export const metadata = {
  title: "pes-bca",
  description: "A read-only dashboard for accessing PESU Academy content.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}

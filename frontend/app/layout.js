import "./globals.css";
import { Inter } from "next/font/google";
import Providers from "./providers";
import { Toaster } from "react-hot-toast";
import NextTopLoader from "nextjs-toploader";
import GlobalErrorBoundary from "@/components/shared/ErrorBoundary";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = {
  title: "MediTrack",
  description: "Multi-hospital Patient Health Record Management System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <NextTopLoader color="#2563EB" showSpinner={false} />
        <GlobalErrorBoundary>
          <Providers>{children}</Providers>
        </GlobalErrorBoundary>
        <Toaster
          position="top-right"
          toastOptions={{
            success: {
              duration: 3000,
              style: {
                background: "#16A34A",
                color: "#FFFFFF",
              },
            },
            error: {
              duration: 4000,
            },
          }}
        />
      </body>
    </html>
  );
}

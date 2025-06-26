// import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Inter } from "next/font/google";
import Header from "../components/header"
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";

const inter=Inter({subsets:["latin"]})

export const metadata = {
  title: "AI Finance Platform",
  description: "One tsop finance platform",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
    <html lang="en">
      <body
        className={`${inter.className}`}
      >
        <Header/>
        <main className="min-h-screen">
           {children}
        </main>
        {/* toaster is used such that when we get any errors it sends like an alert message */}
        {/* rich colours is used so that depending on error we change  */}
       <Toaster richColors/>
        <footer className="bg-blue-50 py-12">
          <div className="container mx-auto px-4 text-center text-gray-600">
            <p>2025@ All rights reserved</p>
          </div>
        </footer>
      </body>
    </html>
    </ClerkProvider>
  );
}

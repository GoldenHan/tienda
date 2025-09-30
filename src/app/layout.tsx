import type { Metadata } from 'next';
import { Inter, Roboto_Mono } from 'next/font/google';
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/context/auth-context";
import { ThemeProvider } from '@/components/theme-provider';
import './globals.css';
import { PwaInstaller } from '@/components/pwa-installer';

const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-inter',
  display: 'swap',
});

const robotoMono = Roboto_Mono({ 
  subsets: ['latin'], 
  variable: '--font-roboto-mono',
  display: 'swap',
});


export const metadata: Metadata = {
  title: 'Punto de Venta e Inventario',
  description: 'Un sistema completo de Punto de Venta (POS) y gestión de inventario.',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#FFFFFF" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#020817" media="(prefers-color-scheme: dark)" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.variable, robotoMono.variable)}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
            <Toaster />
            <PwaInstaller />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

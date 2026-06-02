import type { Metadata, Viewport } from "next"
import "./globals.css"
import { ThemeProvider } from "@/components/ThemeProvider"

export const metadata: Metadata = {
  title: { default: "Scholr", template: "%s · Scholr" },
  description: "Premium school communication — one platform for parents, teachers, and admins.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Scholr" },
}

export const viewport: Viewport = {
  themeColor: "#4F46E5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevent flash of wrong theme — runs before any paint */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){try{
            var t=localStorage.getItem('scholr-theme');
            if(!t){t=window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light';}
            document.documentElement.setAttribute('data-theme',t);
          }catch(e){}}())
        `}} />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}

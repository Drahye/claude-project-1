import type { Metadata, Viewport } from "next"
import "./globals.css"
import { ThemeProvider } from "@/components/ThemeProvider"

const SITE_URL = "https://getscholr.vercel.app"
const SITE_NAME = "Scholr"
const SITE_DESCRIPTION =
  "Scholr is the all-in-one school platform for parents, teachers, and admins — attendance, homework, messaging, and AI-powered weekly reports in one place."

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Scholr — School communication for parents, teachers & admins",
    template: "%s · Scholr",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "school management software",
    "parent teacher communication",
    "school communication app",
    "student attendance tracking",
    "homework management",
    "school messaging",
    "AI student reports",
    "classroom management",
    "education platform",
    "Scholr",
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "education",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: SITE_NAME },
  alternates: { canonical: "/" },
  formatDetection: { telephone: false, address: false, email: false },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-touch-icon", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: "Scholr — School communication for parents, teachers & admins",
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    locale: "en_US",
    images: [{ url: "/og", width: 1200, height: 630, alt: "Scholr" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Scholr — School communication for parents, teachers & admins",
    description: SITE_DESCRIPTION,
    images: ["/og"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
}

export const viewport: Viewport = {
  themeColor: "#EE9A36",
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

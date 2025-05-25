import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'

export const metadata: Metadata = {
  title: 'Notion Exporter',
  description: 'Export your Notion documents into PDF',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <div className="flex-1 flex flex-col justify-center items-center">
            {children}
          </div>
          <footer className="py-4 text-center text-sm text-gray-600 w-full">
            <p>Created by <a href="https://alexionut.ro" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Alex Ionuț</a> © {new Date().getFullYear()}</p>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  )
}

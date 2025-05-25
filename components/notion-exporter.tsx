"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Download, AlertCircle, Loader2, Info, UploadCloud, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ExportSettings } from "@/components/export-settings"
import { PDFPreview } from "@/components/pdf-preview"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import type { NotionPageData, ExportSettings as ExportSettingsType } from "@/types/notion"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useTheme } from "next-themes"

export function NotionExporter() {
  const [htmlContent, setHtmlContent] = useState<string | null>(null)
  const [pageData, setPageData] = useState<NotionPageData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [exportSettings, setExportSettings] = useState<ExportSettingsType>({
    pageSize: "a4",
    margins: 20,
    preserveImages: true,
    preserveFormatting: true,
    smartPageBreaks: true,
    includeIcon: true,
    includeCover: true,
    includeBackground: true,
    fontScale: 1,
  })
  const [exporting, setExporting] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const { theme, setTheme, resolvedTheme } = useTheme();

  // Drag and drop/file input handler
  const handleFile = async (file: File) => {
    setError(null)
    setIsLoading(true)
    setPageData(null)
    setHtmlContent(null)
    try {
      const text = await file.text()
      setHtmlContent(text)
      // Optionally parse for title, etc. for info
      const parser = new DOMParser()
      const doc = parser.parseFromString(text, "text/html")
      const title = doc.querySelector("title")?.textContent?.replace(" | Notion", "") || "Untitled"
      setPageData({
        title,
        icon: null,
        coverImage: null,
        content: "",
        backgroundColor: null,
        originalHtml: text,
      })
    } catch (err) {
      setError("Failed to parse Notion HTML file. Please make sure you exported from Notion as HTML.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      if (file.name.endsWith(".html")) {
        handleFile(file)
      } else {
        setError("Please upload a .html file exported from Notion.")
      }
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.name.endsWith(".html")) {
      handleFile(file)
    } else {
      setError("Please upload a .html file exported from Notion.")
    }
  }

  const handleExportSettings = (newSettings: Partial<ExportSettingsType>) => {
    setExportSettings({ ...exportSettings, ...newSettings })
  }

  const handleExportPDF = async () => {
    if (!htmlContent) return
    setExporting(true)
    setError(null)
    try {
      const response = await fetch("/api/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html: htmlContent }),
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to export PDF")
      }
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "notion-export.pdf"
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError("Failed to export PDF")
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="grid gap-6 place-items-center">
      <div className="flex items-center justify-center gap-2 mb-2">
        <h1 className="text-3xl font-bold tracking-tight text-center">Notion PDF Exporter</h1>
        <Dialog open={aboutOpen} onOpenChange={setAboutOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon" aria-label="About">
              <Info className="h-5 w-5" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>About Notion PDF Exporter</DialogTitle>
              <DialogDescription>
                This tool allows you to export Notion documents into PDF. In Notion, use the Export option and choose HTML, then upload the resulting .html file here.
                <h3 className="mt-2 text-lg font-medium">How to use</h3>
                <ol className="mt-2 list-inside list-decimal space-y-2">
                  <li>In Notion, click the three dots (•••) at the top right and choose Export → HTML</li>
                  <li>Upload the exported .html file here</li>
                  <li>Click Export to download your perfectly formatted PDF</li>
                </ol>
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
        <Button
          variant="outline"
          size="icon"
          aria-label="Toggle Theme"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        >
          {resolvedTheme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>
      </div>
      <p className="text-center text-muted-foreground mb-4">Export your Notion documents into PDF with full formatting, images, and custom settings</p>
      <div className="w-full flex justify-center">
        <Card className="w-full max-w-2xl mx-auto">
          <CardContent className="pt-6">
            <div
              className="flex flex-col gap-4 items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gray-50 hover:bg-gray-100 transition cursor-pointer dark:bg-gray-900 dark:border-gray-700 dark:hover:bg-gray-800"
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              tabIndex={0}
              onClick={() => document.getElementById('notion-html-input')?.click()}
              style={{ minHeight: 180 }}
            >
              <UploadCloud className="h-10 w-10 text-gray-400 mb-2" />
              <span className="font-medium text-gray-900 dark:text-gray-100">Drag & drop your Notion HTML file here, or click to select</span>
              <input
                id="notion-html-input"
                type="file"
                accept=".html,text/html"
                className="hidden"
                onChange={handleFileInput}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Alert variant="destructive" className="mx-auto max-w-2xl">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <Card className="w-full max-w-2xl mx-auto">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mr-3" />
              <span>Processing your Notion HTML file...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {htmlContent && (
        <div className="flex flex-col items-center w-full max-w-3xl mx-auto mt-4">
          {/* Preview */}
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg w-full text-center">
            <h3 className="font-semibold text-green-800">File Successfully Loaded!</h3>
            <p className="text-green-700 text-sm">
              Title: {pageData?.title}
            </p>
          </div>
          <div className="border rounded-lg overflow-hidden bg-white shadow w-full flex justify-center px-8 md:px-16">
            <iframe
              ref={iframeRef}
              srcDoc={htmlContent}
              title="Notion HTML Preview"
              className="w-[700px] min-h-[900px] max-w-full"
              style={{ border: 0 }}
            />
          </div>
          {/* Export */}
          <Button
            onClick={handleExportPDF}
            className="mt-8 w-full max-w-xs self-center"
            disabled={exporting}
          >
            {exporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export to PDF
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}

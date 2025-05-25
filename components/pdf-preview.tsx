"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { NotionPageData, ExportSettings } from "@/types/notion"

interface PDFPreviewProps {
  pageData: NotionPageData
  settings: ExportSettings
}

export function PDFPreview({ pageData, settings }: PDFPreviewProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [zoomLevel, setZoomLevel] = useState(0.7)
  const [pages, setPages] = useState<string[]>([])

  useEffect(() => {
    if (!pageData) return

    // Split content into pages based on estimated content length
    const content = pageData.content
    const contentLength = content.length
    const estimatedCharsPerPage = 4000 // Increased for better content display
    const estimatedPages = Math.max(1, Math.ceil(contentLength / estimatedCharsPerPage))

    const pagesArray = []
    for (let i = 0; i < estimatedPages; i++) {
      const start = i * estimatedCharsPerPage
      const end = Math.min(start + estimatedCharsPerPage, contentLength)
      pagesArray.push(content.substring(start, end))
    }

    setPages(pagesArray)
    setTotalPages(pagesArray.length)
    setCurrentPage(1)
  }, [pageData, settings])

  const pageContent = () => {
    if (!pageData || !pages.length) return null

    const pageWidth = settings.pageSize === "a4" ? "210mm" : "8.5in"
    const pageHeight = settings.pageSize === "a4" ? "297mm" : "11in"

    return (
      <div
        className="relative bg-white shadow-xl transition-all mx-auto border"
        style={{
          width: pageWidth,
          height: pageHeight,
          transform: `scale(${zoomLevel})`,
          transformOrigin: "top center",
        }}
      >
        {/* Cover image - only on first page */}
        {settings.includeCover && pageData.coverImage && currentPage === 1 && (
          <div className="w-full h-48 overflow-hidden">
            <img
              src={pageData.coverImage}
              alt="Cover"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none"
              }}
            />
          </div>
        )}

        <div
          className="p-8 h-full overflow-hidden"
          style={{
            fontSize: `${settings.fontScale}rem`,
            backgroundColor:
              settings.includeBackground && pageData.backgroundColor ? pageData.backgroundColor : "white",
            paddingTop: settings.includeCover && pageData.coverImage && currentPage === 1 ? "2rem" : "2rem",
          }}
        >
          {/* Title and icon - only on first page */}
          {currentPage === 1 && (
            <div className="mb-8">
              <div className="flex items-start gap-3 mb-4">
                {settings.includeIcon && pageData.icon && (
                  <span className="text-3xl flex-shrink-0 mt-1">
                    {pageData.icon.type === "emoji" ? (
                      pageData.icon.content
                    ) : (
                      <img
                        src={pageData.icon.content}
                        alt="Page icon"
                        className="h-10 w-10 object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = "none"
                        }}
                      />
                    )}
                  </span>
                )}
                <h1 className="text-4xl font-bold leading-tight">{pageData.title}</h1>
              </div>
            </div>
          )}

          {/* Content with proper styling */}
          <div
            className="notion-content prose prose-lg max-w-none"
            style={{
              color: settings.includeBackground && pageData.backgroundColor === "#191919" ? "white" : "black",
            }}
            dangerouslySetInnerHTML={{ __html: pages[currentPage - 1] || "" }}
          />
        </div>

        {/* Page number */}
        <div className="absolute bottom-4 right-4 text-sm text-gray-500 bg-white px-2 py-1 rounded shadow">
          Page {currentPage} of {totalPages}
        </div>
      </div>
    )
  }

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const zoomIn = () => {
    if (zoomLevel < 1.2) {
      setZoomLevel(Math.round((zoomLevel + 0.1) * 10) / 10)
    }
  }

  const zoomOut = () => {
    if (zoomLevel > 0.3) {
      setZoomLevel(Math.round((zoomLevel - 0.1) * 10) / 10)
    }
  }

  return (
    <Card className="border rounded-lg">
      <CardContent className="p-0">
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={zoomOut} disabled={zoomLevel <= 0.3}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[50px] text-center">{Math.round(zoomLevel * 100)}%</span>
            <Button variant="outline" size="icon" onClick={zoomIn} disabled={zoomLevel >= 1.2}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={prevPage} disabled={currentPage <= 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <Button variant="outline" size="icon" onClick={nextPage} disabled={currentPage >= totalPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="overflow-auto p-8 bg-gray-100 flex justify-center min-h-[600px]">{pageContent()}</div>

        <div className="p-4 border-t bg-gray-50 text-center text-sm text-muted-foreground">
          This preview shows how your Notion page will appear in the exported PDF
        </div>
      </CardContent>
    </Card>
  )
}

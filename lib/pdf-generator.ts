import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"
import type { NotionPageData, ExportSettings } from "@/types/notion"

export async function generatePDF(pageData: NotionPageData, settings: ExportSettings): Promise<Blob> {
  // Create a temporary container to render the content
  const container = document.createElement("div")
  container.style.position = "absolute"
  container.style.left = "-9999px"
  container.style.top = "-9999px"
  document.body.appendChild(container)

  try {
    // Set up page dimensions
    const pageWidth = settings.pageSize === "a4" ? 210 : settings.pageSize === "letter" ? 215.9 : 215.9
    const pageHeight = settings.pageSize === "a4" ? 297 : settings.pageSize === "letter" ? 279.4 : 355.6
    const margins = settings.margins

    // Create a new PDF
    const pdf = new jsPDF({
      unit: "mm",
      format: settings.pageSize,
      orientation: "portrait",
    })

    // Prepare content for rendering
    let containerHTML = `
      <div style="
        width: ${pageWidth - margins * 2}mm;
        padding: ${margins}mm;
        font-size: ${settings.fontScale}rem;
        background-color: ${settings.includeBackground && pageData.backgroundColor ? pageData.backgroundColor : "white"};
      ">
    `

    // Add cover image if enabled
    if (settings.includeCover && pageData.coverImage) {
      containerHTML += `
        <div style="margin: -${margins}mm -${margins}mm 20px -${margins}mm; height: 100px; overflow: hidden;">
          <img src="${pageData.coverImage}" style="width: 100%; height: 100%; object-fit: cover;" />
        </div>
      `
    }

    // Add title and icon
    containerHTML += `<div style="display: flex; align-items: center; margin-bottom: 20px;">`

    if (settings.includeIcon && pageData.icon) {
      if (pageData.icon.type === "emoji") {
        containerHTML += `<span style="font-size: 2rem; margin-right: 10px;">${pageData.icon.content}</span>`
      } else {
        containerHTML += `<span style="font-size: 2rem; margin-right: 10px;"><img src="${pageData.icon.content}" style="height: 2rem; width: 2rem; object-fit: contain;" /></span>`
      }
    }

    containerHTML += `<h1 style="font-size: 2rem; font-weight: bold;">${pageData.title}</h1></div>`

    // Add content
    containerHTML += `<div class="notion-content">${pageData.content}</div></div>`

    container.innerHTML = containerHTML

    // Apply smart page breaks if enabled
    if (settings.smartPageBreaks) {
      const blocks = container.querySelectorAll("p, h1, h2, h3, h4, h5, h6, ul, ol, table")
      blocks.forEach((block) => {
        if (block instanceof HTMLElement) {
          block.style.pageBreakInside = "avoid"
        }
      })
    }

    // Remove images if not preserving them
    if (!settings.preserveImages) {
      const images = container.querySelectorAll("img")
      images.forEach((img) => img.remove())
    }

    // Render the content to canvas
    const canvas = await html2canvas(container, {
      scale: 2, // Higher scale for better quality
      useCORS: true, // Allow loading cross-origin images
      logging: false,
    })

    // Calculate how many pages we need
    const contentHeight = canvas.height
    const pageHeightPx = ((pageHeight - margins * 2) * canvas.width) / (pageWidth - margins * 2)
    const totalPages = Math.ceil(contentHeight / pageHeightPx)

    // Add each page to the PDF
    for (let i = 0; i < totalPages; i++) {
      if (i > 0) pdf.addPage()

      const srcY = i * pageHeightPx
      const srcHeight = Math.min(pageHeightPx, contentHeight - srcY)

      // Create a new canvas for this page
      const pageCanvas = document.createElement("canvas")
      pageCanvas.width = canvas.width
      pageCanvas.height = srcHeight
      const ctx = pageCanvas.getContext("2d")

      if (ctx) {
        ctx.drawImage(canvas, 0, srcY, canvas.width, srcHeight, 0, 0, canvas.width, srcHeight)

        // Add the page to the PDF
        const imgData = pageCanvas.toDataURL("image/jpeg", 0.95)
        pdf.addImage(
          imgData,
          "JPEG",
          margins,
          margins,
          pageWidth - margins * 2,
          ((pageWidth - margins * 2) * srcHeight) / canvas.width,
        )

        // Add page number
        pdf.setFontSize(8)
        pdf.text(`Page ${i + 1} of ${totalPages}`, pageWidth - margins - 20, pageHeight - margins - 5)
      }
    }

    // Generate the PDF blob
    return pdf.output("blob")
  } finally {
    // Clean up
    document.body.removeChild(container)
  }
}

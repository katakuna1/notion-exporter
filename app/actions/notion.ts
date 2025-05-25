"use server"

import { JSDOM } from "jsdom"
import type { NotionPageData } from "@/types/notion"

export async function fetchNotionPage(url: string): Promise<NotionPageData> {
  try {
    // Validate the URL
    const notionUrl = new URL(url)
    if (!notionUrl.hostname.includes("notion.site")) {
      throw new Error("Invalid Notion URL. Please provide a published Notion page URL.")
    }

    // Fetch the page content
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; NotionPDFExporter/1.0)",
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch Notion page: ${response.statusText}`)
    }

    const html = await response.text()

    // Parse the HTML using jsdom
    const dom = new JSDOM(html)
    const document = dom.window.document

    // Extract page data
    const title = document.querySelector("title")?.textContent?.replace(" | Notion", "") || "Untitled"

    // Try to find the page icon (could be an emoji or an image)
    let icon = null
    const iconElement = document.querySelector('[data-icon-role="page_icon"]')
    if (iconElement) {
      // Check if it's an emoji
      const emoji = iconElement.textContent
      if (emoji) {
        icon = { type: "emoji", content: emoji }
      } else {
        // Check if it's an image
        const iconImg = iconElement.querySelector("img")
        if (iconImg && iconImg.src) {
          icon = { type: "image", content: iconImg.src }
        }
      }
    }

    // Try to find the cover image
    let coverImage = null
    const coverElement = document.querySelector(".notion-header-block img")
    if (coverElement && coverElement.getAttribute("src")) {
      coverImage = coverElement.getAttribute("src")
    }

    // Extract the main content
    const contentElement = document.querySelector(".notion-page-content")
    const content = contentElement ? contentElement.innerHTML : ""

    // Extract background color if available
    let backgroundColor = null
    const bodyStyle = document.body.getAttribute("style")
    if (bodyStyle && bodyStyle.includes("background")) {
      const bgMatch = bodyStyle.match(/background(-color)?:\s*([^;]+)/)
      if (bgMatch && bgMatch[2]) {
        backgroundColor = bgMatch[2].trim()
      }
    }

    return {
      title,
      icon,
      coverImage,
      content,
      backgroundColor,
      originalHtml: html,
    }
  } catch (error) {
    // Use a simpler error logging approach
    console.error("Error fetching Notion page")
    throw new Error(error instanceof Error ? error.message : "Failed to fetch Notion page")
  }
}

import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    // Validate that it's a Notion URL
    try {
      const notionUrl = new URL(url)
      if (!notionUrl.hostname.includes("notion.site")) {
        return NextResponse.json({ error: "Please provide a valid Notion page URL" }, { status: 400 })
      }
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 })
    }

    // Fetch the Notion page
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate, br",
        DNT: "1",
        Connection: "keep-alive",
        "Upgrade-Insecure-Requests": "1",
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch page: ${response.status} ${response.statusText}` },
        { status: response.status },
      )
    }

    const html = await response.text()

    // Parse the HTML to extract page data
    const pageData = parseNotionPage(html)

    return NextResponse.json(pageData)
  } catch (error) {
    console.error("Error fetching Notion page:", error)
    return NextResponse.json(
      { error: "Failed to fetch Notion page. Please check the URL and try again." },
      { status: 500 },
    )
  }
}

function parseNotionPage(html: string) {
  // Extract title from the HTML
  const titleMatch = html.match(/<title>(.*?)<\/title>/i)
  const title = titleMatch ? titleMatch[1].replace(" | Notion", "").trim() : "Untitled"

  // Extract page icon (emoji or image)
  let icon = null
  const emojiMatch = html.match(/class="notion-emoji"[^>]*>([^<]+)</i)
  if (emojiMatch) {
    icon = { type: "emoji", content: emojiMatch[1].trim() }
  } else {
    const iconImgMatch = html.match(/class="notion-page-icon-image"[^>]*src="([^"]+)"/i)
    if (iconImgMatch) {
      icon = { type: "image", content: iconImgMatch[1] }
    }
  }

  // Extract cover image
  let coverImage = null
  const coverMatch =
    html.match(/class="notion-page-cover-image"[^>]*src="([^"]+)"/i) ||
    html.match(/class="notion-header-block"[^>]*>[\s\S]*?<img[^>]*src="([^"]+)"/i)
  if (coverMatch) {
    coverImage = coverMatch[1]
  }

  // Extract main content
  let content = ""
  const contentMatch = html.match(/<div class="notion-page-content"[^>]*>([\s\S]*?)<\/div>/i)
  if (contentMatch) {
    content = contentMatch[1]
  } else {
    // Fallback: try to extract content from the body
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
    if (bodyMatch) {
      // Remove scripts, styles, and other non-content elements
      content = bodyMatch[1]
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<nav[\s\S]*?<\/nav>/gi, "")
        .replace(/<header[\s\S]*?<\/header>/gi, "")
        .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    }
  }

  // Clean up the content
  content = cleanNotionContent(content)

  // Extract background color
  let backgroundColor = null
  const bgColorMatch = html.match(/background-color:\s*([^;]+)/i)
  if (bgColorMatch) {
    backgroundColor = bgColorMatch[1].trim()
  }

  return {
    title,
    icon,
    coverImage,
    content,
    backgroundColor,
    originalHtml: html,
  }
}

function cleanNotionContent(content: string): string {
  return (
    content
      // Remove Notion-specific classes and replace with semantic HTML
      .replace(/class="notion-h1[^"]*"/g, 'class="text-3xl font-bold mb-4"')
      .replace(/class="notion-h2[^"]*"/g, 'class="text-2xl font-semibold mb-3"')
      .replace(/class="notion-h3[^"]*"/g, 'class="text-xl font-medium mb-2"')
      .replace(/class="notion-text[^"]*"/g, 'class="mb-4"')
      .replace(/class="notion-list[^"]*"/g, 'class="list-disc pl-6 mb-4"')
      .replace(/class="notion-numbered-list[^"]*"/g, 'class="list-decimal pl-6 mb-4"')
      .replace(/class="notion-quote[^"]*"/g, 'class="border-l-4 border-gray-300 pl-4 italic mb-4"')
      .replace(/class="notion-code[^"]*"/g, 'class="bg-gray-100 px-2 py-1 rounded font-mono text-sm"')
      .replace(/class="notion-callout[^"]*"/g, 'class="bg-blue-50 border border-blue-200 rounded p-4 mb-4"')
      // Handle images
      .replace(/<img[^>]*class="notion-image[^"]*"[^>]*src="([^"]+)"[^>]*>/g, '<img src="$1" class="max-w-full h-auto mb-4 rounded" alt="Notion image" />')
      // Handle links
      .replace(/<a[^>]*href="([^"]+)"[^>]*>/g, '<a href="$1" class="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">')
      // Handle code blocks
      .replace(/<pre[^>]*class="notion-code-block[^"]*"[^>]*>([\s\S]*?)<\/pre>/g, '<pre class="bg-gray-100 p-4 rounded mb-4 overflow-x-auto"><code>$1</code></pre>')
      // Handle tables
      .replace(/<table[^>]*class="notion-table[^"]*"[^>]*>/g, '<table class="w-full border-collapse mb-4">')
      .replace(/<th[^>]*>/g, '<th class="border border-gray-300 px-4 py-2 bg-gray-100">')
      .replace(/<td[^>]*>/g, '<td class="border border-gray-300 px-4 py-2">')
      // Remove empty divs and spans
      .replace(/<div[^>]*>\s*<\/div>/g, "")
      .replace(/<span[^>]*>\s*<\/span>/g, "")
      // Clean up extra whitespace
      .replace(/\s+/g, " ")
      .trim()
  )
}

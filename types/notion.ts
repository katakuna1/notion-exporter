export interface NotionPageData {
  title: string
  icon: { type: "emoji" | "image"; content: string } | null
  coverImage: string | null
  content: string
  backgroundColor: string | null
  originalHtml: string
  author?: string
}

export interface ExportSettings {
  pageSize: string
  margins: number
  preserveImages: boolean
  preserveFormatting: boolean
  smartPageBreaks: boolean
  includeIcon: boolean
  includeCover: boolean
  includeBackground: boolean
  fontScale: number
}

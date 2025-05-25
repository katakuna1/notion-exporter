import { NotionExporter } from "@/components/notion-exporter"

export default function Home() {
  return (
        <main className="min-h-screen flex items-center justify-center p-4 md:p-8">
      <div className="mx-auto max-w-6xl w-full">
        <NotionExporter />
    </div>
    </main>
  )
}

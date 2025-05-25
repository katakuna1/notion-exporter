"use client"

import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

interface ExportSettingsProps {
  settings: {
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
  onSettingsChange: (settings: Partial<ExportSettingsProps["settings"]>) => void
}

export function ExportSettings({ settings, onSettingsChange }: ExportSettingsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Export Settings</CardTitle>
        <CardDescription>Customize how your Notion page will be exported to PDF</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6">
          <div className="grid gap-4">
            <h3 className="text-lg font-medium">Page Settings</h3>

            <div className="grid gap-2">
              <Label htmlFor="page-size">Page Size</Label>
              <Select value={settings.pageSize} onValueChange={(value) => onSettingsChange({ pageSize: value })}>
                <SelectTrigger id="page-size">
                  <SelectValue placeholder="Select page size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="a4">A4</SelectItem>
                  <SelectItem value="letter">Letter</SelectItem>
                  <SelectItem value="legal">Legal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="margins">Margins ({settings.margins}mm)</Label>
              </div>
              <Slider
                id="margins"
                min={10}
                max={50}
                step={1}
                value={[settings.margins]}
                onValueChange={(value) => onSettingsChange({ margins: value[0] })}
              />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="font-scale">Font Scale ({settings.fontScale.toFixed(1)}x)</Label>
              </div>
              <Slider
                id="font-scale"
                min={0.8}
                max={1.5}
                step={0.1}
                value={[settings.fontScale]}
                onValueChange={(value) => onSettingsChange({ fontScale: value[0] })}
              />
            </div>
          </div>

          <Separator />

          <div className="grid gap-4">
            <h3 className="text-lg font-medium">Content Settings</h3>

            <div className="flex items-center justify-between">
              <Label htmlFor="preserve-images">Preserve Images</Label>
              <Switch
                id="preserve-images"
                checked={settings.preserveImages}
                onCheckedChange={(checked) => onSettingsChange({ preserveImages: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="preserve-formatting">Preserve Formatting</Label>
              <Switch
                id="preserve-formatting"
                checked={settings.preserveFormatting}
                onCheckedChange={(checked) => onSettingsChange({ preserveFormatting: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="smart-page-breaks">Smart Page Breaks</Label>
              <Switch
                id="smart-page-breaks"
                checked={settings.smartPageBreaks}
                onCheckedChange={(checked) => onSettingsChange({ smartPageBreaks: checked })}
              />
            </div>
          </div>

          <Separator />

          <div className="grid gap-4">
            <h3 className="text-lg font-medium">Notion Elements</h3>

            <div className="flex items-center justify-between">
              <Label htmlFor="include-icon">Include Page Icon</Label>
              <Switch
                id="include-icon"
                checked={settings.includeIcon}
                onCheckedChange={(checked) => onSettingsChange({ includeIcon: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="include-cover">Include Cover Image</Label>
              <Switch
                id="include-cover"
                checked={settings.includeCover}
                onCheckedChange={(checked) => onSettingsChange({ includeCover: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="include-background">Include Background</Label>
              <Switch
                id="include-background"
                checked={settings.includeBackground}
                onCheckedChange={(checked) => onSettingsChange({ includeBackground: checked })}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

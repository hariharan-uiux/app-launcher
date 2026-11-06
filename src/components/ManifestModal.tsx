import React, { useState } from "react"
import { FolderOpen, Globe, RefreshCw, Check, AlertCircle, FileText } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

interface ManifestModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentSource: string
  sourceType: "default" | "local" | "remote"
  onLoadManifest: (source: string, type: "default" | "local" | "remote") => Promise<boolean>
  manifestInfo?: {
    name?: string
    version?: string
    updatedAt?: string
    appCount?: number
  }
}

export function ManifestModal({
  open,
  onOpenChange,
  currentSource,
  sourceType,
  onLoadManifest,
  manifestInfo,
}: ManifestModalProps) {
  const [selectedType, setSelectedType] = useState<"default" | "local" | "remote">(sourceType)
  const [urlInput, setUrlInput] = useState(sourceType === "remote" ? currentSource : "https://raw.githubusercontent.com/community/catalog/main/apps.json")
  const [pathInput, setPathInput] = useState(sourceType === "local" ? currentSource : "")
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const handleApply = async () => {
    setErrorMsg(null)
    setSuccessMsg(null)
    setLoading(true)

    try {
      let targetSource = "/apps.json"
      if (selectedType === "remote") {
        if (!urlInput.startsWith("http://") && !urlInput.startsWith("https://")) {
          throw new Error("Please enter a valid HTTP/HTTPS URL")
        }
        targetSource = urlInput
      } else if (selectedType === "local") {
        if (!pathInput.trim()) {
          throw new Error("Please enter a valid file path")
        }
        targetSource = pathInput.trim()
      }

      const success = await onLoadManifest(targetSource, selectedType)
      if (success) {
        setSuccessMsg("Manifest loaded successfully")
        setTimeout(() => {
          onOpenChange(false)
        }, 800)
      } else {
        setErrorMsg("Failed to parse manifest JSON. Verify schema compliance.")
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Error loading manifest")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-zinc-950 border-zinc-800 text-zinc-100">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center space-x-2">
            <FileText className="h-4 w-4 text-zinc-100" />
            <span>Catalog Manifest Loader</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400">
            Configure remote URL or local file path conforming to <code className="text-zinc-200">apps.json</code> schema.
          </DialogDescription>
        </DialogHeader>

        {manifestInfo && (
          <div className="p-3 bg-zinc-900/60 border border-zinc-800/80 text-xs space-y-1 font-mono">
            <div className="flex justify-between">
              <span className="text-zinc-400">Active Source:</span>
              <span className="text-zinc-200 truncate max-w-[200px]">{manifestInfo.name || "Default Manifest"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">App Count:</span>
              <span className="text-zinc-200">{manifestInfo.appCount || 0} apps</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Schema Version:</span>
              <span className="text-zinc-200">v{manifestInfo.version || "1.0.0"}</span>
            </div>
          </div>
        )}

        <div className="space-y-3 py-2">
          <label className="text-xs font-semibold text-zinc-300">Manifest Source Type</label>
          <div className="grid grid-cols-3 gap-2">
            <Button
              type="button"
              variant={selectedType === "default" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedType("default")}
              className="text-xs h-8"
            >
              Default
            </Button>
            <Button
              type="button"
              variant={selectedType === "local" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedType("local")}
              className="text-xs h-8"
            >
              <FolderOpen className="h-3 w-3 mr-1" />
              Local File
            </Button>
            <Button
              type="button"
              variant={selectedType === "remote" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedType("remote")}
              className="text-xs h-8"
            >
              <Globe className="h-3 w-3 mr-1" />
              Remote URL
            </Button>
          </div>

          {selectedType === "remote" && (
            <div className="space-y-1.5 pt-1">
              <label className="text-xs text-zinc-400">Remote JSON URL</label>
              <Input
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/apps.json"
                className="text-xs font-mono bg-zinc-900 border-zinc-800 h-9"
              />
            </div>
          )}

          {selectedType === "local" && (
            <div className="space-y-1.5 pt-1">
              <label className="text-xs text-zinc-400">Absolute File Path</label>
              <Input
                value={pathInput}
                onChange={(e) => setPathInput(e.target.value)}
                placeholder="/path/to/my-apps.json or C:\apps.json"
                className="text-xs font-mono bg-zinc-900 border-zinc-800 h-9"
              />
            </div>
          )}

          {errorMsg && (
            <div className="flex items-center space-x-2 text-xs text-destructive bg-destructive/10 border border-destructive/20 p-2.5">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center space-x-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2.5">
              <Check className="h-4 w-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs h-8"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleApply}
            disabled={loading}
            className="text-xs h-8 bg-zinc-100 text-zinc-950 hover:bg-white"
          >
            {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
            <span>Apply & Load</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

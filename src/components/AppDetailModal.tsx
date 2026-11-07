import React from "react"
import { Play, Download, ArrowUpCircle, Trash2, ExternalLink, Terminal, Laptop, Monitor, GitBranch } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AppIcon } from "@/components/AppIcon"
import { AppItem } from "@/types/catalog"

interface AppDetailModalProps {
  app: AppItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onLaunch: (app: AppItem) => void
  onInstall: (app: AppItem) => void
  onUpdate: (app: AppItem) => void
  onUninstall: (app: AppItem) => void
}

export function AppDetailModal({
  app,
  open,
  onOpenChange,
  onLaunch,
  onInstall,
  onUpdate,
  onUninstall,
}: AppDetailModalProps) {
  if (!app) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-zinc-950 border-zinc-800 text-zinc-100">
        <DialogHeader className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center space-x-3.5">
              <div className="h-12 w-12 rounded-none bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-100 shadow-sm">
                <AppIcon name={app.icon} className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-base text-zinc-100 font-bold">{app.name}</DialogTitle>
                <DialogDescription className="text-xs text-zinc-400 font-mono">
                  by {app.author} · {app.category}
                </DialogDescription>
              </div>
            </div>
            <Badge
              variant={
                app.status === "installed"
                  ? "installed"
                  : app.status === "update_available"
                  ? "update"
                  : "available"
              }
            >
              {app.status === "installed"
                ? "Installed"
                : app.status === "update_available"
                ? "Update Available"
                : "Not Installed"}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Description */}
          <div className="p-3 bg-zinc-900/50 border border-zinc-800/80 text-zinc-300 leading-relaxed">
            {app.description}
          </div>

          {/* Versions and specs */}
          <div className="grid grid-cols-2 gap-2 font-mono">
            <div className="p-2.5 bg-zinc-900/30 border border-zinc-800/60">
              <span className="text-zinc-500 block text-[10px] uppercase">Catalog Version</span>
              <span className="text-zinc-200 font-semibold">v{app.version}</span>
            </div>
            <div className="p-2.5 bg-zinc-900/30 border border-zinc-800/60">
              <span className="text-zinc-500 block text-[10px] uppercase">Installed Version</span>
              <span className="text-zinc-200 font-semibold">
                {app.installedVersion ? `v${app.installedVersion}` : "None"}
              </span>
            </div>
            <div className="p-2.5 bg-zinc-900/30 border border-zinc-800/60">
              <span className="text-zinc-500 block text-[10px] uppercase">Package Size</span>
              <span className="text-zinc-200 font-semibold">{app.size}</span>
            </div>
            <div className="p-2.5 bg-zinc-900/30 border border-zinc-800/60">
              <span className="text-zinc-500 block text-[10px] uppercase">Category</span>
              <span className="text-zinc-200 font-semibold">{app.category}</span>
            </div>
          </div>

          {/* Cross-platform execution targets */}
          {app.installTargets && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-zinc-400">Target Platforms</span>
              <div className="space-y-1.5 font-mono text-[11px]">
                {app.installTargets.linux && (
                  <div className="flex items-center justify-between p-2 bg-zinc-900/40 border border-zinc-800/60">
                    <span className="flex items-center gap-1.5 text-zinc-300">
                      <Terminal className="h-3.5 w-3.5 text-zinc-400" />
                      Linux ({app.installTargets.linux.type})
                    </span>
                    <code className="text-zinc-400 bg-zinc-900 px-1.5 py-0.5">
                      {app.installTargets.linux.command || "default"}
                    </code>
                  </div>
                )}
                {app.installTargets.windows && (
                  <div className="flex items-center justify-between p-2 bg-zinc-900/40 border border-zinc-800/60">
                    <span className="flex items-center gap-1.5 text-zinc-300">
                      <Monitor className="h-3.5 w-3.5 text-zinc-400" />
                      Windows ({app.installTargets.windows.type})
                    </span>
                    <code className="text-zinc-400 bg-zinc-900 px-1.5 py-0.5">
                      {app.installTargets.windows.command || "default"}
                    </code>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* GitHub Repository Source */}
          {app.github && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-semibold text-zinc-400">GitHub Source</span>
              <div className="flex items-center justify-between p-2 bg-zinc-900/40 border border-zinc-800/60 font-mono text-[11px]">
                <span className="flex items-center gap-1.5 text-zinc-300">
                  <GitBranch className="h-3.5 w-3.5 text-zinc-400" />
                  {app.github}
                </span>
                <a
                  href={`https://github.com/${app.github}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-zinc-400 hover:text-zinc-100 text-[10px] underline flex items-center gap-1"
                >
                  <span>Releases & Code</span>
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </div>
            </div>
          )}

          {/* Release Notes */}
          {app.releaseNotes && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-emerald-400">Release Notes (v{app.version})</span>
                {app.releaseUrl && (
                  <a
                    href={app.releaseUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-zinc-400 hover:text-zinc-200 underline flex items-center gap-1"
                  >
                    <span>View on GitHub</span>
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                )}
              </div>
              <pre className="p-3 bg-zinc-900/60 border border-emerald-950/60 text-zinc-300 font-sans text-xs whitespace-pre-wrap max-h-36 overflow-y-auto leading-relaxed">
                {app.releaseNotes}
              </pre>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 justify-between items-center pt-2">
          {app.homepage ? (
            <a
              href={app.homepage}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center text-xs text-zinc-400 hover:text-zinc-200 gap-1 font-medium transition-colors"
            >
              <span>Official Website</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : <div />}

          <div className="flex items-center space-x-2">
            {app.status === "installed" && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onUninstall(app)
                    onOpenChange(false)
                  }}
                  className="text-destructive hover:bg-destructive/10 text-xs h-8 border-destructive/30"
                >
                  <Trash2 className="h-3 w-3 mr-1.5" />
                  <span>Uninstall</span>
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    onLaunch(app)
                    onOpenChange(false)
                  }}
                  className="bg-zinc-100 text-zinc-950 hover:bg-white text-xs h-8 font-semibold"
                >
                  <Play className="h-3 w-3 mr-1.5 fill-current" />
                  <span>Launch</span>
                </Button>
              </>
            )}

            {app.status === "update_available" && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onLaunch(app)
                    onOpenChange(false)
                  }}
                  className="text-xs h-8"
                >
                  <Play className="h-3 w-3 mr-1.5" />
                  <span>Launch Current</span>
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    onUpdate(app)
                    onOpenChange(false)
                  }}
                  className="bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs h-8 font-semibold"
                >
                  <ArrowUpCircle className="h-3 w-3 mr-1.5" />
                  <span>Update to v{app.version}</span>
                </Button>
              </>
            )}

            {app.status === "not_installed" && (
              <Button
                size="sm"
                onClick={() => {
                  onInstall(app)
                  onOpenChange(false)
                }}
                className="bg-zinc-100 text-zinc-950 hover:bg-white text-xs h-8 font-semibold"
              >
                <Download className="h-3 w-3 mr-1.5" />
                <span>Install v{app.version}</span>
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

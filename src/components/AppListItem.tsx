import React from "react"
import { Play, Download, ArrowUpCircle, Trash2, Info, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AppIcon } from "@/components/AppIcon"
import { AppItem } from "@/types/catalog"

interface AppListItemProps {
  app: AppItem
  isBusy: boolean
  busyProgress: number
  busyAction: string
  onLaunch: (app: AppItem) => void
  onInstall: (app: AppItem) => void
  onUpdate: (app: AppItem) => void
  onUninstall: (app: AppItem) => void
  onSelect: (app: AppItem) => void
}

export function AppListItem({
  app,
  isBusy,
  busyProgress,
  busyAction,
  onLaunch,
  onInstall,
  onUpdate,
  onUninstall,
  onSelect,
}: AppListItemProps) {
  return (
    <div className="flex items-center justify-between p-3 sm:p-4 rounded-lg border border-zinc-800/80 bg-zinc-950/60 hover:bg-zinc-900/40 hover:border-zinc-700 transition-colors gap-3">
      {/* Icon & Title info */}
      <div className="flex items-center space-x-3.5 min-w-0 flex-1">
        <div className="h-10 w-10 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-100 flex-shrink-0">
          <AppIcon name={app.icon} className="h-5 w-5 text-zinc-100" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center space-x-2">
            <h4
              onClick={() => onSelect(app)}
              className="font-semibold text-sm text-zinc-100 truncate hover:underline cursor-pointer"
            >
              {app.name}
            </h4>
            <span className="text-[11px] text-zinc-500 font-mono hidden md:inline">by {app.author}</span>
          </div>
          <p className="text-xs text-zinc-400 truncate max-w-xl hidden sm:block">
            {app.description}
          </p>
        </div>
      </div>

      {/* Metadata tags */}
      <div className="hidden lg:flex items-center space-x-2 font-mono text-xs text-zinc-400">
        <span className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[11px]">
          {app.category}
        </span>
        <span className="text-zinc-500">{app.size}</span>
      </div>

      {/* Status Badge */}
      <div className="flex-shrink-0 font-mono text-xs">
        {app.status === "installed" && (
          <Badge variant="installed" className="gap-1">
            <Check className="h-3 w-3" />
            <span className="hidden sm:inline">Installed</span> v{app.installedVersion || app.version}
          </Badge>
        )}
        {app.status === "update_available" && (
          <Badge variant="update" className="gap-1">
            <ArrowUpCircle className="h-3 w-3" />
            <span className="hidden sm:inline">Update</span> v{app.version}
          </Badge>
        )}
        {app.status === "not_installed" && (
          <Badge variant="available">v{app.version}</Badge>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center space-x-1.5 flex-shrink-0 min-w-[110px] justify-end">
        {isBusy ? (
          <div className="w-24 space-y-1">
            <div className="text-[10px] text-right font-mono text-zinc-400">{busyProgress}%</div>
            <Progress value={busyProgress} />
          </div>
        ) : (
          <>
            {app.status === "installed" && (
              <Button
                size="sm"
                onClick={() => onLaunch(app)}
                className="bg-zinc-100 text-zinc-950 hover:bg-white text-xs h-8 px-3 font-semibold space-x-1"
              >
                <Play className="h-3 w-3 fill-current" />
                <span>Launch</span>
              </Button>
            )}

            {app.status === "update_available" && (
              <Button
                size="sm"
                onClick={() => onUpdate(app)}
                className="bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs h-8 px-3 font-semibold space-x-1"
              >
                <ArrowUpCircle className="h-3 w-3" />
                <span>Update</span>
              </Button>
            )}

            {app.status === "not_installed" && (
              <Button
                size="sm"
                onClick={() => onInstall(app)}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700 text-xs h-8 px-3 font-medium space-x-1"
              >
                <Download className="h-3 w-3" />
                <span>Install</span>
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

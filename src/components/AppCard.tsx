import React from "react"
import { Play, Download, ArrowUpCircle, Trash2, ExternalLink, Info, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { AppIcon } from "@/components/AppIcon"
import { AppItem } from "@/types/catalog"

interface AppCardProps {
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

export function AppCard({
  app,
  isBusy,
  busyProgress,
  busyAction,
  onLaunch,
  onInstall,
  onUpdate,
  onUninstall,
  onSelect,
}: AppCardProps) {
  const getStatusBadge = () => {
    switch (app.status) {
      case "installed":
        return (
          <Badge variant="installed" className="gap-1 font-mono">
            <Check className="h-3 w-3" />
            <span>v{app.installedVersion || app.version}</span>
          </Badge>
        )
      case "update_available":
        return (
          <Badge variant="update" className="gap-1 font-mono">
            <ArrowUpCircle className="h-3 w-3" />
            <span>Update v{app.version}</span>
          </Badge>
        )
      case "not_installed":
      default:
        return (
          <Badge variant="available" className="font-mono">
            v{app.version}
          </Badge>
        )
    }
  }

  return (
    <div className="flex flex-col justify-between border-b border-r border-zinc-800 bg-zinc-950 hover:bg-zinc-900/40 transition-colors group relative min-h-[210px]">
      {/* Top Body Section */}
      <div className="p-5 sm:p-6 space-y-3 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center space-x-3.5 min-w-0">
            <div className="h-12 w-12 rounded-none bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-100 shadow-sm flex-shrink-0 group-hover:border-zinc-700 transition-colors">
              <AppIcon name={app.icon} className="h-6 w-6 text-zinc-100" />
            </div>
            <div className="min-w-0">
              <h3
                onClick={() => onSelect(app)}
                className="font-semibold text-sm sm:text-base text-zinc-100 truncate hover:underline cursor-pointer tracking-tight"
                title={app.name}
              >
                {app.name}
              </h3>
              <p className="text-xs text-zinc-400 font-mono truncate">{app.author || app.category}</p>
            </div>
          </div>
          <div className="flex-shrink-0">{getStatusBadge()}</div>
        </div>

        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed min-h-[34px]">
          {app.description}
        </p>

        <div className="flex items-center gap-2 pt-0.5 text-[11px] font-mono text-zinc-400">
          <span className="px-2 py-0.5 bg-zinc-900 text-zinc-300 font-medium border border-zinc-800">
            {app.category}
          </span>
          <span className="text-zinc-500">{app.size}</span>
        </div>
      </div>

      {/* Divider line touching both ends of the card */}
      <div className="w-full border-t border-zinc-800 px-5 sm:px-6 py-3 mt-auto bg-zinc-950/60">
        {isBusy ? (
          <div className="w-full space-y-1.5 py-0.5">
            <div className="flex justify-between text-[11px] font-mono text-zinc-400">
              <span className="capitalize">{busyAction}...</span>
              <span>{busyProgress}%</span>
            </div>
            <Progress value={busyProgress} />
          </div>
        ) : (
          <div className="flex items-center justify-between w-full gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSelect(app)}
              className="text-xs text-zinc-400 hover:text-zinc-100 px-2 h-8"
              title="View details"
            >
              <Info className="h-3.5 w-3.5 mr-1" />
              <span>Details</span>
            </Button>

            <div className="flex items-center space-x-1.5">
              {app.status === "installed" && (
                <>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onUninstall(app)}
                    className="text-zinc-500 hover:text-destructive h-8 w-8"
                    title="Uninstall app"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => onLaunch(app)}
                    className="bg-zinc-100 text-zinc-950 hover:bg-white text-xs h-8 px-3 font-semibold space-x-1"
                  >
                    <Play className="h-3 w-3 fill-current" />
                    <span>Launch</span>
                  </Button>
                </>
              )}

              {app.status === "update_available" && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onLaunch(app)}
                    className="text-xs h-8 px-2.5 text-zinc-300"
                    title="Launch current version"
                  >
                    <Play className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => onUpdate(app)}
                    className="bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs h-8 px-3 font-semibold space-x-1"
                  >
                    <ArrowUpCircle className="h-3 w-3" />
                    <span>Update</span>
                  </Button>
                </>
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
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

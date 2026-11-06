import React, { useState } from "react"
import {
  Settings,
  HardDrive,
  RefreshCw,
  Sparkles,
  Check,
  CheckCircle2,
  AlertCircle,
  Database,
  Cpu,
  Monitor,
  Bell,
  Trash2,
  ArrowUpCircle,
  ShieldCheck,
} from "lucide-react"
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
import { Switch } from "@/components/ui/switch"
import { LauncherSettings } from "@/types/settings"

interface SettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  settings: LauncherSettings
  onUpdateSettings: (newSettings: LauncherSettings) => void
  onResetCatalogOverrides: () => void
  systemPlatform: string
}

export function SettingsModal({
  open,
  onOpenChange,
  settings,
  onUpdateSettings,
  onResetCatalogOverrides,
  systemPlatform,
}: SettingsModalProps) {
  const [checkingUpdate, setCheckingUpdate] = useState(false)
  const [updateStatus, setUpdateStatus] = useState<string | null>(null)

  const handleToggle = (key: keyof LauncherSettings) => {
    onUpdateSettings({
      ...settings,
      [key]: !settings[key],
    })
  }

  const handleFrequencyChange = (freq: LauncherSettings["updateFrequency"]) => {
    onUpdateSettings({
      ...settings,
      updateFrequency: freq,
    })
  }

  const handleCheckUpdates = () => {
    setCheckingUpdate(true)
    setUpdateStatus(null)

    setTimeout(() => {
      setCheckingUpdate(false)
      setUpdateStatus("App Launcher v1.0.0 is up to date. No new releases found.")
    }, 900)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-zinc-950 border-zinc-800 text-zinc-100 max-h-[88vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-zinc-800 bg-zinc-950 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-100 shadow-sm flex-shrink-0">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold text-zinc-100 tracking-tight">
                Launcher Settings
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-400 font-mono">
                Manage background process execution, automatic updates, and system behavior.
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-6">
          {/* Section 1: Background Operation */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <HardDrive className="h-4 w-4 text-zinc-400" />
                <h4 className="text-xs font-bold text-zinc-200 uppercase font-mono tracking-wider">
                  Background Operation
                </h4>
              </div>
              <Badge
                variant={settings.runInBackground ? "installed" : "available"}
                className="font-mono text-[10px]"
              >
                {settings.runInBackground ? "RUNNING IN BACKGROUND" : "EXIT ON WINDOW CLOSE"}
              </Badge>
            </div>

            <div className="border border-zinc-800 divide-y divide-zinc-800 bg-zinc-950">
              {/* Setting 1: Run in Background */}
              <div className="p-4 flex items-start justify-between gap-4 hover:bg-zinc-900/30 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs sm:text-sm font-semibold text-zinc-100">
                      Run Launcher in Background
                    </span>
                    {settings.runInBackground && (
                      <span className="text-[10px] px-1.5 py-0.2 bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-mono">
                        Instant Start
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed max-w-lg">
                    When enabled, closing the window keeps App Launcher running silently in the background
                    so apps launch instantly and status stays synchronized.
                  </p>
                </div>
                <Switch
                  checked={settings.runInBackground}
                  onCheckedChange={() => handleToggle("runInBackground")}
                  aria-label="Toggle run in background"
                />
              </div>

              {/* Setting 2: Minimize to System Tray */}
              <div className="p-4 flex items-start justify-between gap-4 hover:bg-zinc-900/30 transition-colors">
                <div className="space-y-1">
                  <span className="text-xs sm:text-sm font-semibold text-zinc-100">
                    Minimize to System Tray
                  </span>
                  <p className="text-xs text-zinc-400 leading-relaxed max-w-lg">
                    Send App Launcher to the notification tray area when minimized or closed instead of
                    cluttering your taskbar.
                  </p>
                </div>
                <Switch
                  checked={settings.minimizeToTray}
                  disabled={!settings.runInBackground}
                  onCheckedChange={() => handleToggle("minimizeToTray")}
                  aria-label="Toggle minimize to tray"
                />
              </div>

              {/* Setting 3: Start on Boot */}
              <div className="p-4 flex items-start justify-between gap-4 hover:bg-zinc-900/30 transition-colors">
                <div className="space-y-1">
                  <span className="text-xs sm:text-sm font-semibold text-zinc-100">
                    Launch at System Startup
                  </span>
                  <p className="text-xs text-zinc-400 leading-relaxed max-w-lg">
                    Automatically initialize the launcher in background mode when you log into your system.
                  </p>
                </div>
                <Switch
                  checked={settings.startOnBoot}
                  onCheckedChange={() => handleToggle("startOnBoot")}
                  aria-label="Toggle start on boot"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Launcher Updates */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <RefreshCw className="h-4 w-4 text-zinc-400" />
                <h4 className="text-xs font-bold text-zinc-200 uppercase font-mono tracking-wider">
                  Launcher Client Updates
                </h4>
              </div>
              <Badge
                variant={settings.autoUpdate ? "installed" : "available"}
                className="font-mono text-[10px]"
              >
                {settings.autoUpdate ? "AUTO-UPDATE ACTIVE" : "MANUAL UPDATES"}
              </Badge>
            </div>

            <div className="border border-zinc-800 divide-y divide-zinc-800 bg-zinc-950">
              {/* Setting 4: Auto Update Launcher */}
              <div className="p-4 flex items-start justify-between gap-4 hover:bg-zinc-900/30 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs sm:text-sm font-semibold text-zinc-100">
                      Auto-Update App Launcher
                    </span>
                    {settings.autoUpdate && (
                      <span className="text-[10px] px-1.5 py-0.2 bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-mono">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed max-w-lg">
                    Automatically download and install new releases of App Launcher in the background. You
                    will be notified when updates are ready without disruption.
                  </p>
                </div>
                <Switch
                  checked={settings.autoUpdate}
                  onCheckedChange={() => handleToggle("autoUpdate")}
                  aria-label="Toggle auto update launcher"
                />
              </div>

              {/* Setting 5: Frequency Selector */}
              <div className="p-4 space-y-2.5 hover:bg-zinc-900/30 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-semibold text-zinc-100">
                    Update Check Frequency
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500 uppercase">
                    Channel: Stable
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleFrequencyChange("startup")}
                    className={`py-2 px-3 text-xs font-mono font-medium border text-center transition-colors ${
                      settings.updateFrequency === "startup"
                        ? "bg-zinc-100 text-zinc-950 border-zinc-100 font-bold"
                        : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200"
                    }`}
                  >
                    On Startup
                  </button>
                  <button
                    onClick={() => handleFrequencyChange("daily")}
                    className={`py-2 px-3 text-xs font-mono font-medium border text-center transition-colors ${
                      settings.updateFrequency === "daily"
                        ? "bg-zinc-100 text-zinc-950 border-zinc-100 font-bold"
                        : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200"
                    }`}
                  >
                    Daily
                  </button>
                  <button
                    onClick={() => handleFrequencyChange("manual")}
                    className={`py-2 px-3 text-xs font-mono font-medium border text-center transition-colors ${
                      settings.updateFrequency === "manual"
                        ? "bg-zinc-100 text-zinc-950 border-zinc-100 font-bold"
                        : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200"
                    }`}
                  >
                    Manual Only
                  </button>
                </div>
              </div>

              {/* Setting 6: Check for Updates Now button */}
              <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-zinc-950/60">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-zinc-200">Current Client Release</span>
                  <p className="text-[11px] font-mono text-zinc-500">
                    Version 1.0.0 (Production build x64)
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={checkingUpdate}
                    onClick={handleCheckUpdates}
                    className="text-xs h-8 border-zinc-800 bg-zinc-900 text-zinc-200 hover:bg-zinc-800 px-3 font-mono"
                  >
                    {checkingUpdate ? (
                      <>
                        <RefreshCw className="h-3 w-3 animate-spin mr-1.5" />
                        Checking...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-3.5 w-3.5 mr-1.5 text-zinc-400" />
                        Check for Updates
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {updateStatus && (
                <div className="p-3 bg-emerald-950/40 border-t border-emerald-900/50 flex items-center space-x-2 text-xs text-emerald-300 font-mono">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                  <span>{updateStatus}</span>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Data & Diagnostics */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Database className="h-4 w-4 text-zinc-400" />
              <h4 className="text-xs font-bold text-zinc-200 uppercase font-mono tracking-wider">
                Catalog & Storage Management
              </h4>
            </div>

            <div className="border border-zinc-800 p-4 bg-zinc-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-zinc-200">Reset Local App Overrides</span>
                <p className="text-xs text-zinc-400">
                  Clears local simulated install/update records from storage and restores the default catalog state.
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={onResetCatalogOverrides}
                className="text-xs h-8 border-zinc-800 bg-zinc-900 hover:bg-rose-950/60 hover:text-rose-200 hover:border-rose-800/60 text-zinc-400 px-3 font-mono flex-shrink-0"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                Reset Overrides
              </Button>
            </div>
          </div>

          {/* Section 4: System Info Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 border-l border-t border-zinc-800 text-[11px] font-mono bg-zinc-950/40">
            <div className="border-r border-b border-zinc-800 p-2.5">
              <span className="text-zinc-500 block text-[10px] uppercase">Environment</span>
              <span className="text-zinc-200 font-bold uppercase">{systemPlatform} x64</span>
            </div>
            <div className="border-r border-b border-zinc-800 p-2.5">
              <span className="text-zinc-500 block text-[10px] uppercase">Memory Budget</span>
              <span className="text-zinc-200 font-bold">~38 MB RAM</span>
            </div>
            <div className="border-r border-b border-zinc-800 p-2.5">
              <span className="text-zinc-500 block text-[10px] uppercase">Engine</span>
              <span className="text-zinc-200 font-bold">Electron 45.2.3</span>
            </div>
            <div className="border-r border-b border-zinc-800 p-2.5">
              <span className="text-zinc-500 block text-[10px] uppercase">Client Version</span>
              <span className="text-zinc-200 font-bold">v1.0.0-prod</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between">
          <span className="text-[11px] font-mono text-zinc-500">
            Settings auto-save on toggle
          </span>
          <Button
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs h-8 bg-zinc-100 text-zinc-950 hover:bg-white px-4 font-semibold"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}


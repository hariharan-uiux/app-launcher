import React, { useState, useEffect, useMemo, useRef } from "react"
import {
  Rocket,
  Search,
  LayoutGrid,
  List,
  Download,
  CheckCircle2,
  ArrowUpCircle,
  FolderOpen,
  RefreshCw,
  SlidersHorizontal,
  PackageCheck,
  HardDrive,
  Cpu,
  Layers,
  Sparkles,
  Play,
  RotateCcw,
  ExternalLink,
  Settings,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AppCard } from "@/components/AppCard"
import { AppListItem } from "@/components/AppListItem"
import { ManifestModal } from "@/components/ManifestModal"
import { AppDetailModal } from "@/components/AppDetailModal"
import { SettingsModal } from "@/components/SettingsModal"
import { AppItem, CatalogManifest, ViewMode, StatusFilter, AppStatus } from "@/types/catalog"
import { LauncherSettings, DEFAULT_LAUNCHER_SETTINGS } from "@/types/settings"
import { checkAppUpdates } from "@/lib/githubUpdates"

const LOCAL_STORAGE_KEY = "app_launcher_custom_catalog"
const MANIFEST_SOURCE_KEY = "app_launcher_manifest_source"
const SETTINGS_STORAGE_KEY = "app_launcher_user_settings"

// Declare window electron API for TypeScript
declare global {
  interface Window {
    electronAPI?: {
      readLocalCatalog: (filePath?: string) => Promise<{ ok: boolean; data?: CatalogManifest; error?: string }>
      saveLocalCatalog: (filePath: string | undefined, data: CatalogManifest) => Promise<{ ok: boolean; error?: string }>
      getInstalledState: () => Promise<{ ok: boolean; installed?: Record<string, { status: string; installedVersion: string; executablePath?: string }> }>
      installApp: (app: AppItem) => Promise<{ ok: boolean; version?: string; executablePath?: string; error?: string }>
      launchApp: (command: string, appName: string, appId?: string) => Promise<{ ok: boolean; message?: string; error?: string }>
      updateApp: (app: AppItem) => Promise<{ ok: boolean; version?: string; executablePath?: string; error?: string }>
      uninstallApp: (appId: string) => Promise<{ ok: boolean; message?: string; error?: string }>
      onInstallProgress: (callback: (data: { appId: string; progress: number; statusText: string; action: string }) => void) => () => void
      openExternalUrl: (url: string) => Promise<{ ok: boolean; error?: string }>
      getSystemInfo: () => Promise<{ platform: string; arch: string; version: string }>
      getSettings?: () => Promise<{ ok: boolean; settings?: any }>
      saveSettings?: (settings: any) => Promise<{ ok: boolean; settings?: any }>
      checkForLauncherUpdates?: () => Promise<{ ok: boolean; currentVersion: string; latestVersion: string; upToDate: boolean; message: string }>
    }
  }
}

export default function App() {
  const [manifest, setManifest] = useState<CatalogManifest | null>(null)
  const [apps, setApps] = useState<AppItem[]>([])
  const [activeTab, setActiveTab] = useState<"catalog" | "installed" | "manifest">("catalog")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [manifestModalOpen, setManifestModalOpen] = useState(false)
  const [settingsModalOpen, setSettingsModalOpen] = useState(false)
  const [launcherSettings, setLauncherSettings] = useState<LauncherSettings>(DEFAULT_LAUNCHER_SETTINGS)
  const [selectedApp, setSelectedApp] = useState<AppItem | null>(null)
  const [systemPlatform, setSystemPlatform] = useState<string>("linux")
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== searchInputRef.current) {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === ",") {
        e.preventDefault()
        setSettingsModalOpen((prev) => !prev)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Busy states for ongoing install / update simulations
  const [busyState, setBusyState] = useState<Record<string, { action: string; progress: number }>>({})
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "info" | "success" | "error" } | null>(null)

  const showToast = (text: string, type: "info" | "success" | "error" = "info") => {
    setToastMessage({ text, type })
    setTimeout(() => {
      setToastMessage(null)
    }, 3000)
  }

  // Load manifest initially
  const loadManifestFromSource = async (source: string, type: "default" | "local" | "remote"): Promise<boolean> => {
    try {
      let data: CatalogManifest

      if (window.electronAPI && type === "local") {
        const res = await window.electronAPI.readLocalCatalog(source)
        if (!res.ok || !res.data) throw new Error(res.error || "Failed to read local file")
        data = res.data
      } else if (type === "remote") {
        const res = await fetch(source)
        if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch remote manifest`)
        data = await res.json()
      } else {
        const res = await fetch("/apps.json")
        if (!res.ok) throw new Error("Could not load default catalog")
        data = await res.json()
      }

      if (!data.apps || !Array.isArray(data.apps)) {
        throw new Error("Invalid manifest schema: missing apps array")
      }

      // Merge with any persistent user overrides from localStorage
      const savedOverrides = localStorage.getItem(LOCAL_STORAGE_KEY)
      let initialApps = data.apps
      if (savedOverrides) {
        try {
          const overrides: Record<string, { status: any; installedVersion: any }> = JSON.parse(savedOverrides)
          initialApps = data.apps.map((a) => {
            if (overrides[a.id]) {
              return {
                ...a,
                status: overrides[a.id].status,
                installedVersion: overrides[a.id].installedVersion,
              }
            }
            return a
          })
        } catch (e) {
          // ignore parsing error
        }
      }

      setManifest(data)
      setApps(initialApps)
      localStorage.setItem(MANIFEST_SOURCE_KEY, JSON.stringify({ source, type }))

      // Background check for GitHub releases on load
      setTimeout(() => {
        checkAppUpdates(initialApps)
          .then(({ updatedApps, updatesFound }) => {
            if (updatesFound > 0) {
              persistAppChange(updatedApps)
              showToast(
                `Found ${updatesFound} new app update${updatesFound > 1 ? "s" : ""} on GitHub!`,
                "info"
              )
            }
          })
          .catch(() => {})
      }, 700)

      return true
    } catch (err: any) {
      showToast(err.message || "Failed to load manifest", "error")
      return false
    }
  }

  useEffect(() => {
    const savedSource = localStorage.getItem(MANIFEST_SOURCE_KEY)
    if (savedSource) {
      try {
        const { source, type } = JSON.parse(savedSource)
        loadManifestFromSource(source, type)
      } catch {
        loadManifestFromSource("/apps.json", "default")
      }
    } else {
      loadManifestFromSource("/apps.json", "default")
    }

    // Check true installed apps state from local disk
    if (window.electronAPI?.getInstalledState) {
      window.electronAPI.getInstalledState().then((res) => {
        if (res.ok && res.installed) {
          setApps((prevApps) =>
            prevApps.map((a) => {
              const installed = res.installed?.[a.id]
              if (installed) {
                return {
                  ...a,
                  status: (installed.status || "installed") as AppStatus,
                  installedVersion: installed.installedVersion || a.version,
                }
              }
              return a
            })
          )
        }
      })
    }

    // Load settings from localStorage or Electron
    const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setLauncherSettings((prev) => ({ ...prev, ...parsed }))
      } catch (e) {}
    } else if (window.electronAPI?.getSettings) {
      window.electronAPI.getSettings().then((res) => {
        if (res.ok && res.settings) {
          setLauncherSettings((prev) => ({ ...prev, ...res.settings }))
        }
      })
    }

    // Detect system info
    if (window.electronAPI) {
      window.electronAPI.getSystemInfo().then((info) => {
        setSystemPlatform(info.platform === "win32" ? "windows" : "linux")
      })
    } else {
      const isWin = navigator.userAgent.toLowerCase().includes("windows")
      setSystemPlatform(isWin ? "windows" : "linux")
    }
  }, [])

  // Listen to real-time install/update progress events from Electron
  useEffect(() => {
    if (window.electronAPI?.onInstallProgress) {
      const cleanup = window.electronAPI.onInstallProgress((data) => {
        setBusyState((prev) => ({
          ...prev,
          [data.appId]: {
            action: data.action || "installing",
            progress: data.progress,
          },
        }))
        if (data.statusText) {
          showToast(data.statusText, "info")
        }
        if (data.progress >= 100) {
          setTimeout(() => {
            setBusyState((prev) => {
              const next = { ...prev }
              delete next[data.appId]
              return next
            })
          }, 600)
        }
      })
      return cleanup
    }
  }, [])

  // Settings update handler
  const handleUpdateSettings = (newSettings: LauncherSettings) => {
    setLauncherSettings(newSettings)
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings))
    if (window.electronAPI?.saveSettings) {
      window.electronAPI.saveSettings(newSettings)
    }
    showToast("Settings saved", "success")
  }

  // Reset catalog overrides handler
  const handleResetCatalogOverrides = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY)
    if (manifest) {
      setApps(manifest.apps)
    }
    showToast("Catalog overrides reset to default", "info")
  }

  // Persist app status changes
  const persistAppChange = (updatedApps: AppItem[]) => {
    setApps(updatedApps)
    const overrides: Record<string, { status: any; installedVersion: any }> = {}
    updatedApps.forEach((a) => {
      overrides[a.id] = {
        status: a.status,
        installedVersion: a.installedVersion,
      }
    })
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(overrides))
  }

  // Keep selectedApp synchronized with apps updates
  useEffect(() => {
    if (selectedApp) {
      const fresh = apps.find((a) => a.id === selectedApp.id)
      if (fresh) setSelectedApp(fresh)
    }
  }, [apps])

  // Manual trigger to check GitHub Releases API for all catalog apps
  const handleCheckAllUpdates = async (): Promise<number> => {
    if (apps.length === 0) return 0
    setIsCheckingUpdates(true)
    showToast("Checking GitHub for app updates...", "info")

    try {
      const { updatedApps, updatesFound } = await checkAppUpdates(apps)
      persistAppChange(updatedApps)

      if (updatesFound > 0) {
        showToast(
          `Found ${updatesFound} new app update${updatesFound > 1 ? "s" : ""} on GitHub!`,
          "success"
        )
      } else {
        showToast("All catalog apps are up to date with GitHub releases", "success")
      }
      return updatesFound
    } catch (err: any) {
      showToast(err.message || "Failed to check GitHub releases", "error")
      return 0
    } finally {
      setIsCheckingUpdates(false)
    }
  }

  // App Action: Launch
  const handleLaunch = async (app: AppItem) => {
    if (systemPlatform === "windows" && !app.installTargets?.windows) {
      showToast(`${app.name} is only supported on Linux`, "error")
      return
    }
    const target = systemPlatform === "windows" ? app.installTargets?.windows : app.installTargets?.linux
    const cmd = target?.command || app.id

    if (window.electronAPI?.launchApp) {
      showToast(`Launching ${app.name}...`, "info")
      const res = await window.electronAPI.launchApp(cmd, app.name, app.id)
      if (res.ok) {
        showToast(`Running ${app.name}`, "success")
      } else {
        showToast(res.error || `Could not execute ${cmd}`, "error")
      }
    } else {
      showToast(`[Web Demo] Executing command: ${cmd}`, "success")
    }
  }

  // App Action: Install (real Electron installation with streaming progress)
  const handleInstall = async (app: AppItem) => {
    if (systemPlatform === "windows" && !app.installTargets?.windows) {
      showToast(`${app.name} is only supported on Linux`, "error")
      return
    }
    setBusyState((prev) => ({ ...prev, [app.id]: { action: "installing", progress: 5 } }))
    showToast(`Installing ${app.name}...`, "info")

    if (window.electronAPI?.installApp) {
      try {
        const res = await window.electronAPI.installApp(app)
        if (res.ok) {
          const nextApps = apps.map((a) =>
            a.id === app.id
              ? { ...a, status: "installed" as const, installedVersion: res.version || a.version }
              : a
          )
          persistAppChange(nextApps)
          showToast(`${app.name} v${res.version || app.version} installed successfully!`, "success")
        } else {
          showToast(res.error || `Failed to install ${app.name}`, "error")
        }
      } catch (err: any) {
        showToast(err.message || `Installation error for ${app.name}`, "error")
      } finally {
        setBusyState((prev) => {
          const next = { ...prev }
          delete next[app.id]
          return next
        })
      }
    } else {
      // Standalone web demo simulation
      let current = 5
      const interval = setInterval(() => {
        current += Math.floor(Math.random() * 25) + 10
        if (current >= 100) {
          clearInterval(interval)
          setBusyState((prev) => {
            const next = { ...prev }
            delete next[app.id]
            return next
          })
          const nextApps = apps.map((a) =>
            a.id === app.id
              ? { ...a, status: "installed" as const, installedVersion: a.version }
              : a
          )
          persistAppChange(nextApps)
          showToast(`${app.name} v${app.version} installed successfully`, "success")
        } else {
          setBusyState((prev) => ({ ...prev, [app.id]: { action: "installing", progress: current } }))
        }
      }, 180)
    }
  }

  // App Action: Update (real Electron update download and replacement)
  const handleUpdate = async (app: AppItem) => {
    setBusyState((prev) => ({ ...prev, [app.id]: { action: "updating", progress: 10 } }))
    showToast(`Updating ${app.name} to v${app.version}...`, "info")

    if (window.electronAPI?.updateApp) {
      try {
        const res = await window.electronAPI.updateApp(app)
        if (res.ok) {
          const nextApps = apps.map((a) =>
            a.id === app.id
              ? { ...a, status: "installed" as const, installedVersion: res.version || a.version }
              : a
          )
          persistAppChange(nextApps)
          showToast(`${app.name} updated to v${res.version || app.version}!`, "success")
        } else {
          showToast(res.error || `Failed to update ${app.name}`, "error")
        }
      } catch (err: any) {
        showToast(err.message || `Update error for ${app.name}`, "error")
      } finally {
        setBusyState((prev) => {
          const next = { ...prev }
          delete next[app.id]
          return next
        })
      }
    } else {
      // Standalone web demo simulation
      let current = 10
      const interval = setInterval(() => {
        current += Math.floor(Math.random() * 25) + 15
        if (current >= 100) {
          clearInterval(interval)
          setBusyState((prev) => {
            const next = { ...prev }
            delete next[app.id]
            return next
          })
          const nextApps = apps.map((a) =>
            a.id === app.id
              ? { ...a, status: "installed" as const, installedVersion: a.version }
              : a
          )
          persistAppChange(nextApps)
          showToast(`${app.name} updated to v${app.version}`, "success")
        } else {
          setBusyState((prev) => ({ ...prev, [app.id]: { action: "updating", progress: current } }))
        }
      }, 160)
    }
  }

  // App Action: Uninstall
  const handleUninstall = async (app: AppItem) => {
    if (window.electronAPI?.uninstallApp) {
      try {
        const res = await window.electronAPI.uninstallApp(app.id)
        if (!res.ok) {
          showToast(res.error || `Failed to uninstall ${app.name}`, "error")
          return
        }
      } catch (err: any) {
        showToast(err.message || `Failed to uninstall ${app.name}`, "error")
        return
      }
    }
    const nextApps = apps.map((a) =>
      a.id === app.id
        ? { ...a, status: "not_installed" as const, installedVersion: null }
        : a
    )
    persistAppChange(nextApps)
    showToast(`${app.name} uninstalled`, "info")
  }

  // Batch Action: Update All
  const handleUpdateAll = () => {
    const pending = apps.filter((a) => a.status === "update_available")
    if (pending.length === 0) return
    pending.forEach((a) => handleUpdate(a))
  }

  // Filtered lists
  const filteredApps = useMemo(() => {
    return apps.filter((app) => {
      // Tab filter
      if (activeTab === "installed" && app.status === "not_installed") {
        return false
      }

      // Status filter
      if (statusFilter !== "all" && app.status !== statusFilter) {
        return false
      }

      // Category filter
      if (selectedCategory !== "All" && app.category !== selectedCategory) {
        return false
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchName = app.name.toLowerCase().includes(q)
        const matchDesc = app.description.toLowerCase().includes(q)
        const matchAuthor = app.author.toLowerCase().includes(q)
        return matchName || matchDesc || matchAuthor
      }

      return true
    })
  }, [apps, activeTab, statusFilter, selectedCategory, searchQuery])

  // Counts
  const installedCount = apps.filter((a) => a.status === "installed" || a.status === "update_available").length
  const updatesCount = apps.filter((a) => a.status === "update_available").length


  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-zinc-800 selection:text-zinc-100">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div
            className={`px-4 py-2.5 border text-xs font-medium shadow-xl flex items-center space-x-2 ${
              toastMessage.type === "success"
                ? "bg-emerald-950/90 border-emerald-500/40 text-emerald-200"
                : toastMessage.type === "error"
                ? "bg-rose-950/90 border-rose-500/40 text-rose-200"
                : "bg-zinc-900 border-zinc-700 text-zinc-200"
            }`}
          >
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Top Application Bar */}
      <header className="border-b border-zinc-800 bg-zinc-950 sticky top-0 z-40">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center space-x-2.5 flex-shrink-0">
            <div className="h-8 w-8 bg-zinc-100 text-zinc-950 flex items-center justify-center font-bold shadow">
              <Rocket className="h-4 w-4" />
            </div>
            <span className="font-bold text-sm tracking-tight text-zinc-100">AppLauncher</span>
          </div>

          {/* Central Search Bar */}
          <div className="flex-1 max-w-md mx-2 sm:mx-6">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Search apps, authors, or categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-8 bg-zinc-900/80 border-zinc-800 text-xs text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-700 h-9"
              />
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-2.5 text-xs text-zinc-500 hover:text-zinc-300"
                >
                  ✕
                </button>
              ) : (
                <kbd className="absolute right-2.5 top-2.5 text-[10px] text-zinc-500 bg-zinc-800/80 border border-zinc-700/60 px-1.5 py-0.5 font-mono pointer-events-none">
                  /
                </kbd>
              )}
            </div>
          </div>

          {/* Right Tools */}
          <div className="flex items-center space-x-2 flex-shrink-0">
            <span className="text-xs text-zinc-400 font-mono hidden md:inline mr-1">
              {filteredApps.length} apps
            </span>

            {/* View Mode Switcher */}
            <div className="flex items-center bg-zinc-900 border border-zinc-800 p-0.5">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 text-xs transition-colors ${
                  viewMode === "grid" ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
                }`}
                title="Grid View"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 text-xs transition-colors ${
                  viewMode === "list" ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
                }`}
                title="List View"
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Check Updates Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleCheckAllUpdates}
              disabled={isCheckingUpdates}
              className="text-xs h-8 border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:text-zinc-100 px-2.5"
              title="Check GitHub for latest app releases"
            >
              <RefreshCw className={`h-3.5 w-3.5 sm:mr-1.5 ${isCheckingUpdates ? "animate-spin text-emerald-400" : ""}`} />
              <span className="hidden sm:inline">{isCheckingUpdates ? "Checking..." : "Check Updates"}</span>
            </Button>

            {/* Manifest Switcher Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setManifestModalOpen(true)}
              className="text-xs h-8 border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:text-zinc-100 px-2.5"
              title="Load custom catalog manifest"
            >
              <FolderOpen className="h-3.5 w-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">Manifest</span>
            </Button>

            {/* Settings Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSettingsModalOpen(true)}
              className="text-xs h-8 border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:text-zinc-100 px-2.5"
              title="Launcher Settings (Ctrl+,)"
            >
              <Settings className="h-3.5 w-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">Settings</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full flex-1 bg-zinc-950 flex flex-col py-6 sm:py-8 pb-28 sm:pb-32">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-1 flex flex-col">
          {/* Top Metrics Stat Boxes */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 border-l border-t border-zinc-800 mb-6 bg-zinc-950">
            {/* Box 1: Total Apps */}
            <div
              onClick={() => {
                setActiveTab("catalog")
                setStatusFilter("all")
              }}
              className="border-r border-b border-zinc-800 p-3 sm:p-3.5 bg-zinc-950 hover:bg-zinc-900/50 transition-colors flex items-center space-x-3 cursor-pointer group"
              title="View all catalog apps"
            >
              <div className="h-8 w-8 bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-zinc-200 group-hover:border-zinc-700 transition-colors flex-shrink-0">
                <PackageCheck className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-zinc-500 uppercase font-mono block leading-none mb-1">Total Apps</span>
                <span className="text-sm sm:text-base font-bold font-mono text-zinc-100 leading-none">{apps.length}</span>
              </div>
            </div>

            {/* Box 2: Installed */}
            <div
              onClick={() => {
                setActiveTab("installed")
                setStatusFilter("all")
              }}
              className="border-r border-b border-zinc-800 p-3 sm:p-3.5 bg-zinc-950 hover:bg-zinc-900/50 transition-colors flex items-center space-x-3 cursor-pointer group"
              title="View installed apps"
            >
              <div className="h-8 w-8 bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-emerald-400 group-hover:border-zinc-700 transition-colors flex-shrink-0">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-zinc-500 uppercase font-mono block leading-none mb-1">Installed</span>
                <span className="text-sm sm:text-base font-bold font-mono text-zinc-100 leading-none">{installedCount}</span>
              </div>
            </div>

            {/* Box 3: RAM */}
            <div className="border-r border-b border-zinc-800 p-3 sm:p-3.5 bg-zinc-950 flex items-center space-x-3">
              <div className="h-8 w-8 bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 flex-shrink-0">
                <Cpu className="h-4 w-4 text-zinc-400" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-zinc-500 uppercase font-mono block leading-none mb-1">RAM</span>
                <span className="text-sm sm:text-base font-bold font-mono text-zinc-100 leading-none">~38 MB</span>
              </div>
            </div>

            {/* Box 4: Fast Startup */}
            <div className="border-r border-b border-zinc-800 p-3 sm:p-3.5 bg-zinc-950 flex items-center space-x-3">
              <div className="h-8 w-8 bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 flex-shrink-0">
                <Sparkles className="h-4 w-4 text-amber-400" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-zinc-500 uppercase font-mono block leading-none mb-1">Fast Startup</span>
                <span className="text-sm sm:text-base font-bold font-mono text-zinc-100 leading-none">&lt;120ms</span>
              </div>
            </div>

            {/* Box 5: Platform */}
            <div className="border-r border-b border-zinc-800 p-3 sm:p-3.5 bg-zinc-950 flex items-center space-x-3 col-span-2 sm:col-span-1">
              <div className="h-8 w-8 bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 flex-shrink-0">
                <HardDrive className="h-4 w-4 text-zinc-400" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-zinc-500 uppercase font-mono block leading-none mb-1">Platform</span>
                <span className="text-xs sm:text-sm font-bold font-mono text-zinc-100 uppercase leading-none truncate block">
                  {systemPlatform} x64
                </span>
              </div>
            </div>
          </div>
          {filteredApps.length === 0 ? (
            <div className="py-24 flex flex-col items-center justify-center text-center space-y-3 border border-zinc-800 bg-zinc-950">
              <div className="h-12 w-12 bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
                <Search className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-zinc-200">No applications match your filter</h3>
                <p className="text-xs text-zinc-500 mt-1 max-w-sm">
                  Try clearing your search query or switching categories to browse more apps.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("")
                  setSelectedCategory("All")
                  setStatusFilter("all")
                }}
                className="text-xs h-8 mt-2"
              >
                Reset Filters
              </Button>
            </div>
          ) : viewMode === "grid" ? (
            <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-l border-t border-zinc-800">
              {filteredApps.map((app) => (
                <AppCard
                  key={app.id}
                  app={app}
                  isBusy={!!busyState[app.id]}
                  busyProgress={busyState[app.id]?.progress || 0}
                  busyAction={busyState[app.id]?.action || ""}
                  onLaunch={handleLaunch}
                  onInstall={handleInstall}
                  onUpdate={handleUpdate}
                  onUninstall={handleUninstall}
                  onSelect={(a) => setSelectedApp(a)}
                />
              ))}
            </div>
          ) : (
            <div className="w-full flex flex-col border-l border-r border-t border-zinc-800">
              {filteredApps.map((app) => (
                <AppListItem
                  key={app.id}
                  app={app}
                  isBusy={!!busyState[app.id]}
                  busyProgress={busyState[app.id]?.progress || 0}
                  busyAction={busyState[app.id]?.action || ""}
                  onLaunch={handleLaunch}
                  onInstall={handleInstall}
                  onUpdate={handleUpdate}
                  onUninstall={handleUninstall}
                  onSelect={(a) => setSelectedApp(a)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Floating Bottom Navigation Tab Bar */}
      <nav
        aria-label="Bottom Navigation"
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 pointer-events-none"
      >
        <div className="pointer-events-auto flex items-center space-x-1 bg-zinc-950/90 backdrop-blur-md border border-zinc-800 p-1.5 shadow-2xl shadow-black/80">
          {/* App Catalog Tab */}
          <button
            onClick={() => {
              setActiveTab("catalog")
              setStatusFilter("all")
            }}
            className={`px-3 py-1.5 text-xs font-semibold transition-colors flex items-center space-x-2 ${
              activeTab === "catalog" && statusFilter === "all"
                ? "bg-zinc-100 text-zinc-950"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
            }`}
          >
            <PackageCheck className="h-3.5 w-3.5" />
            <span>App Catalog</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 font-mono ${
                activeTab === "catalog" && statusFilter === "all"
                  ? "bg-zinc-900 text-zinc-200"
                  : "bg-zinc-800 text-zinc-300"
              }`}
            >
              {apps.length}
            </span>
          </button>

          {/* Installed Tab */}
          <button
            onClick={() => {
              setActiveTab("installed")
              setStatusFilter("all")
            }}
            className={`px-3 py-1.5 text-xs font-semibold transition-colors flex items-center space-x-2 ${
              activeTab === "installed"
                ? "bg-zinc-100 text-zinc-950"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Installed</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 font-mono ${
                activeTab === "installed"
                  ? "bg-zinc-900 text-zinc-200"
                  : "bg-zinc-800 text-zinc-300"
              }`}
            >
              {installedCount}
            </span>
          </button>

          {/* Updates Tab */}
          {updatesCount > 0 && (
            <button
              onClick={() => {
                setActiveTab("catalog")
                setStatusFilter("update_available")
              }}
              className={`px-2.5 py-1.5 text-xs font-semibold transition-colors flex items-center space-x-1.5 text-amber-400 hover:bg-amber-500/10 ${
                statusFilter === "update_available" ? "bg-amber-500/20 text-amber-300" : ""
              }`}
            >
              <ArrowUpCircle className="h-3.5 w-3.5" />
              <span>{updatesCount} updates</span>
            </button>
          )}

          {/* Installed Tab Tools: Update All */}
          {activeTab === "installed" && updatesCount > 0 && (
            <>
              <div className="h-4 w-px bg-zinc-800 mx-1" />
              <Button
                size="sm"
                onClick={handleUpdateAll}
                className="text-xs h-7 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold space-x-1 px-2.5"
              >
                <ArrowUpCircle className="h-3 w-3" />
                <span>Update All</span>
              </Button>
            </>
          )}
        </div>
      </nav>

      {/* Manifest Modal */}
      <ManifestModal
        open={manifestModalOpen}
        onOpenChange={setManifestModalOpen}
        currentSource={manifest?.name || "/apps.json"}
        sourceType="default"
        onLoadManifest={loadManifestFromSource}
        manifestInfo={{
          name: manifest?.name,
          version: manifest?.version,
          updatedAt: manifest?.updatedAt,
          appCount: manifest?.apps.length,
        }}
      />

      {/* App Detail Modal */}
      <AppDetailModal
        app={selectedApp}
        open={!!selectedApp}
        onOpenChange={(open) => !open && setSelectedApp(null)}
        onLaunch={handleLaunch}
        onInstall={handleInstall}
        onUpdate={handleUpdate}
        onUninstall={handleUninstall}
      />

      {/* Settings Modal */}
      <SettingsModal
        open={settingsModalOpen}
        onOpenChange={setSettingsModalOpen}
        settings={launcherSettings}
        onUpdateSettings={handleUpdateSettings}
        onResetCatalogOverrides={handleResetCatalogOverrides}
        systemPlatform={systemPlatform}
        onCheckAppUpdates={handleCheckAllUpdates}
      />
    </div>
  )
}

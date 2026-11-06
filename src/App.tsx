import React, { useState, useEffect, useMemo } from "react"
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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AppCard } from "@/components/AppCard"
import { AppListItem } from "@/components/AppListItem"
import { ManifestModal } from "@/components/ManifestModal"
import { AppDetailModal } from "@/components/AppDetailModal"
import { AppItem, CatalogManifest, ViewMode, StatusFilter } from "@/types/catalog"

const LOCAL_STORAGE_KEY = "app_launcher_custom_catalog"
const MANIFEST_SOURCE_KEY = "app_launcher_manifest_source"

// Declare window electron API for TypeScript
declare global {
  interface Window {
    electronAPI?: {
      readLocalCatalog: (filePath?: string) => Promise<{ ok: boolean; data?: CatalogManifest; error?: string }>
      saveLocalCatalog: (filePath: string | undefined, data: CatalogManifest) => Promise<{ ok: boolean; error?: string }>
      launchApp: (command: string, appName: string) => Promise<{ ok: boolean; message?: string; error?: string }>
      openExternalUrl: (url: string) => Promise<{ ok: boolean; error?: string }>
      getSystemInfo: () => Promise<{ platform: string; arch: string; version: string }>
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
  const [selectedApp, setSelectedApp] = useState<AppItem | null>(null)
  const [systemPlatform, setSystemPlatform] = useState<string>("linux")

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

  // App Action: Launch
  const handleLaunch = async (app: AppItem) => {
    const target = systemPlatform === "windows" ? app.installTargets?.windows : app.installTargets?.linux
    const cmd = target?.command || app.id

    if (window.electronAPI) {
      showToast(`Launching ${app.name}...`, "info")
      const res = await window.electronAPI.launchApp(cmd, app.name)
      if (res.ok) {
        showToast(`Running ${app.name}`, "success")
      } else {
        showToast(res.error || `Could not execute ${cmd}`, "error")
      }
    } else {
      showToast(`[Simulated Launch] Executing command: ${cmd}`, "success")
    }
  }

  // App Action: Install (simulated progress with state update)
  const handleInstall = (app: AppItem) => {
    setBusyState((prev) => ({ ...prev, [app.id]: { action: "installing", progress: 5 } }))
    showToast(`Installing ${app.name}...`, "info")

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

  // App Action: Update
  const handleUpdate = (app: AppItem) => {
    setBusyState((prev) => ({ ...prev, [app.id]: { action: "updating", progress: 10 } }))
    showToast(`Updating ${app.name} to v${app.version}...`, "info")

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

  // App Action: Uninstall
  const handleUninstall = (app: AppItem) => {
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
        const matchTags = app.tags.some((t) => t.toLowerCase().includes(q))
        const matchAuthor = app.author.toLowerCase().includes(q)
        return matchName || matchDesc || matchTags || matchAuthor
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
            className={`px-4 py-2.5 rounded-lg border text-xs font-medium shadow-xl flex items-center space-x-2 ${
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
      <header className="border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center space-x-2.5 flex-shrink-0">
            <div className="h-8 w-8 rounded-lg bg-zinc-100 text-zinc-950 flex items-center justify-center font-bold shadow">
              <Rocket className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-bold text-sm tracking-tight text-zinc-100">AppLauncher</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-400 font-mono border border-zinc-800">
                  {systemPlatform}
                </span>
              </div>
            </div>
          </div>

          {/* Central Search Bar */}
          <div className="flex-1 max-w-md mx-2 sm:mx-6">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
              <Input
                type="text"
                placeholder="Search apps, tags, authors, or categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 bg-zinc-900/80 border-zinc-800 text-xs text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-zinc-700 h-9 rounded-lg"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-2.5 text-xs text-zinc-500 hover:text-zinc-300"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Right Tools */}
          <div className="flex items-center space-x-1.5 flex-shrink-0">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-md p-0.5">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded text-xs transition-colors ${
                  viewMode === "grid" ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
                }`}
                title="Grid View"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded text-xs transition-colors ${
                  viewMode === "list" ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
                }`}
                title="List View"
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>

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
          </div>
        </div>
      </header>

      {/* Navigation Tabs Bar */}
      <div className="border-b border-zinc-800/80 bg-zinc-950/60 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 py-2.5">
          {/* Primary View Tabs */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => {
                setActiveTab("catalog")
                setStatusFilter("all")
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center space-x-1.5 ${
                activeTab === "catalog"
                  ? "bg-zinc-100 text-zinc-950"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              <PackageCheck className="h-3.5 w-3.5" />
              <span>App Catalog</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-300 font-mono">
                {apps.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab("installed")
                setStatusFilter("all")
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center space-x-1.5 ${
                activeTab === "installed"
                  ? "bg-zinc-100 text-zinc-950"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Installed</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-zinc-800 text-zinc-300 font-mono">
                {installedCount}
              </span>
            </button>

            {updatesCount > 0 && (
              <button
                onClick={() => {
                  setActiveTab("catalog")
                  setStatusFilter("update_available")
                }}
                className={`px-2.5 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center space-x-1.5 text-amber-400 hover:bg-amber-500/10 ${
                  statusFilter === "update_available" ? "bg-amber-500/20" : ""
                }`}
              >
                <ArrowUpCircle className="h-3.5 w-3.5" />
                <span>{updatesCount} updates</span>
              </button>
            )}
          </div>

          {/* Status Quick Filter (Catalog view only) */}
          {activeTab === "catalog" && (
            <div className="flex items-center space-x-1 overflow-x-auto text-xs pb-1 sm:pb-0">
              <span className="text-[11px] text-zinc-500 mr-1 hidden sm:inline">Status:</span>
              <button
                onClick={() => setStatusFilter("all")}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  statusFilter === "all"
                    ? "bg-zinc-800 text-zinc-100 border border-zinc-700"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter("installed")}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  statusFilter === "installed"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Installed
              </button>
              <button
                onClick={() => setStatusFilter("update_available")}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  statusFilter === "update_available"
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Updates ({updatesCount})
              </button>
              <button
                onClick={() => setStatusFilter("not_installed")}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  statusFilter === "not_installed"
                    ? "bg-zinc-800 text-zinc-100 border border-zinc-700"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Not Installed
              </button>
            </div>
          )}

          {/* Installed Tab Tools */}
          {activeTab === "installed" && updatesCount > 0 && (
            <Button
              size="sm"
              onClick={handleUpdateAll}
              className="text-xs h-7 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold space-x-1"
            >
              <ArrowUpCircle className="h-3 w-3" />
              <span>Update All ({updatesCount})</span>
            </Button>
          )}
        </div>
      </div>

      {/* Category Filter Pills (When on Catalog tab) */}
      {activeTab === "catalog" && manifest?.categories && (
        <div className="border-b border-zinc-900 bg-zinc-950/40 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto flex items-center space-x-1 overflow-x-auto py-2 text-xs">
            {manifest.categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-md whitespace-nowrap text-xs transition-colors font-medium ${
                  selectedCategory === cat
                    ? "bg-zinc-800 text-zinc-100 border border-zinc-700"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full">
        {filteredApps.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
          <div className="space-y-2">
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
      </main>

      {/* Bottom Status Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950/80 px-4 sm:px-6 py-2.5 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 font-mono text-[11px]">
          <div className="flex items-center space-x-3">
            <span>
              Catalog: <strong className="text-zinc-300 font-semibold">{manifest?.name || "Community Catalog"}</strong>
            </span>
            <span>·</span>
            <span>{apps.length} Total Apps</span>
            <span>·</span>
            <span>{installedCount} Installed</span>
          </div>
          <div className="flex items-center space-x-3 text-zinc-400">
            <span>RAM: ~38 MB</span>
            <span>·</span>
            <span>Fast Startup (&lt;120ms)</span>
            <span>·</span>
            <span className="uppercase text-zinc-300">{systemPlatform} x64</span>
          </div>
        </div>
      </footer>

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
    </div>
  )
}

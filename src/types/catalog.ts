export type AppStatus = "not_installed" | "installed" | "update_available"

export interface InstallTarget {
  type: string
  command?: string
  checkInstalled?: string
  downloadUrl?: string
}

export interface AppItem {
  id: string
  name: string
  description: string
  icon: string
  category: string
  tags: string[]
  version: string
  installedVersion: string | null
  status: AppStatus
  author: string
  size: string
  homepage?: string
  installTargets?: {
    linux?: InstallTarget
    windows?: InstallTarget
  }
}

export interface CatalogManifest {
  $schema?: string
  name: string
  description?: string
  version: string
  updatedAt: string
  categories: string[]
  apps: AppItem[]
}

export type ViewMode = "grid" | "list"
export type StatusFilter = "all" | "installed" | "update_available" | "not_installed"

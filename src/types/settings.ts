export interface LauncherSettings {
  runInBackground: boolean
  autoUpdate: boolean
  startOnBoot: boolean
  minimizeToTray: boolean
  updateFrequency: "startup" | "daily" | "manual"
  notificationsEnabled: boolean
}

export const DEFAULT_LAUNCHER_SETTINGS: LauncherSettings = {
  runInBackground: true,
  autoUpdate: true,
  startOnBoot: false,
  minimizeToTray: true,
  updateFrequency: "startup",
  notificationsEnabled: true,
}


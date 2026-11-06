import React from "react"
import {
  Code2,
  Sparkles,
  BookOpen,
  Send,
  PlayCircle,
  Container,
  Cpu,
  Database,
  MessageSquare,
  Network,
  GitBranch,
  Camera,
  Terminal,
  Package,
  Layers,
  Flame,
  Globe,
  HardDrive,
  Folder,
} from "lucide-react"

interface AppIconProps {
  name: string
  className?: string
}

const iconMap: Record<string, React.ElementType> = {
  Code2,
  Sparkles,
  BookOpen,
  Send,
  PlayCircle,
  Container,
  Cpu,
  Database,
  MessageSquare,
  Network,
  GitBranch,
  Camera,
  Terminal,
  Package,
  Layers,
  Flame,
  Globe,
  HardDrive,
  Folder,
}

export function AppIcon({ name, className = "h-5 w-5" }: AppIconProps) {
  const IconComponent = iconMap[name] || Package
  return <IconComponent className={className} />
}

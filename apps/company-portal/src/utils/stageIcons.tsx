import type { LucideIcon } from "lucide-react";
import {
  Binary,
  Circle,
  ClipboardCheck,
  Code2,
  FileSearch,
  Network,
  Search,
  Square,
} from "lucide-react";

const STAGE_ICON_MAP: Record<string, LucideIcon> = {
  circle: Circle,
  square: Square,
  "file-search": FileSearch,
  "code-2": Code2,
  network: Network,
  "clipboard-check": ClipboardCheck,
  search: Search,
  binary: Binary,
};

export const getStageIcon = (icon?: string | null): LucideIcon =>
  STAGE_ICON_MAP[icon ?? ""] ?? Circle;

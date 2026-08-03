export type ClipboardType =
  | "text"
  | "url"
  | "email"
  | "phone"
  | "hex"
  | "json"
  | "sql"
  | "code"
  | "image"
  | "filepath";

export interface ClipboardItemMetadata {
  language?: string; // e.g., 'typescript', 'sql', 'json'
  urlDomain?: string;
  urlTitle?: string;
  imageWidth?: number;
  imageHeight?: number;
  imageSizeFormatted?: string;
  colorHex?: string;
  colorRgb?: string;
  colorHsl?: string;
  jsonKeyCount?: number;
  lineCount?: number;
  wordCount?: number;
  charCount?: number;
  isSensitive?: boolean;
  sensitiveType?: "password" | "otp" | "credit_card" | "api_key" | null;
  maskedContent?: string;
  aiSummary?: string;
  aiTitle?: string;
  aiActionItems?: string[];
  aiExplanation?: string;
}

export interface ClipboardItem {
  id: string;
  content: string; // Plain text or base64 data for images
  type: ClipboardType;
  created_at: number; // Timestamp
  favorite: boolean;
  pinned: boolean;
  collection?: string | null; // Collection ID or name
  tags: string[];
  app_name?: string; // Source application e.g. "VS Code", "Chrome", "Terminal"
  source_url?: string;
  ocr_text?: string;
  metadata: ClipboardItemMetadata;
  copy_count?: number; // Times re-copied
}

export interface Collection {
  id: string;
  name: string;
  color: string; // Tailwind color e.g. 'emerald', 'indigo', 'amber'
  description?: string;
  created_at: number;
}

export interface AppSettings {
  historyLimit: number; // e.g. 100, 500, 1000
  autoDeleteDays: number; // 0 = never, 1, 7, 30
  privacyMode: boolean; // Pause recording if true
  maskSensitiveData: boolean; // Passwords, OTP, Credit Cards
  excludedApps: string[];
  hotkey: string; // e.g. 'Ctrl+Shift+V'
  launchOnStartup: boolean;
  theme: "dark" | "light" | "system";
  syncEnabled: boolean;
  syncEndpoint?: string;
  pollIntervalMs: number; // 500ms to 2000ms
  soundEffects: boolean;
}

export type ViewTab =
  | "timeline"
  | "search"
  | "favorites"
  | "collections"
  | "analytics"
  | "settings"
  | "privacy";

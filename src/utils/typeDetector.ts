import { ClipboardType, ClipboardItemMetadata } from "../types/clipboard";

export interface DetectionResult {
  type: ClipboardType;
  metadata: ClipboardItemMetadata;
}

export function detectClipboardType(content: string): DetectionResult {
  const trimmed = content.trim();
  const lineCount = content.split("\n").length;
  const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;
  const charCount = content.length;

  const baseMetadata: ClipboardItemMetadata = {
    lineCount,
    wordCount,
    charCount,
  };

  // 1. Check for Image Data URL
  if (content.startsWith("data:image/") || /^https?:\/\/.*\.(png|jpg|jpeg|gif|webp|svg)(\?.*)?$/i.test(trimmed)) {
    return {
      type: "image",
      metadata: {
        ...baseMetadata,
        imageSizeFormatted: formatBytes(Math.round(content.length * 0.75)),
      },
    };
  }

  // 2. Hex Color / RGB / HSL
  const hexMatch = trimmed.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/);
  const rgbMatch = trimmed.match(/^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i);
  if (hexMatch) {
    const colorHex = hexMatch[0].toUpperCase();
    return {
      type: "hex",
      metadata: {
        ...baseMetadata,
        colorHex,
        colorRgb: hexToRgb(colorHex),
        colorHsl: hexToHsl(colorHex),
      },
    };
  } else if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10);
    const g = parseInt(rgbMatch[2], 10);
    const b = parseInt(rgbMatch[3], 10);
    const colorHex = rgbToHex(r, g, b);
    return {
      type: "hex",
      metadata: {
        ...baseMetadata,
        colorHex,
        colorRgb: `rgb(${r}, ${g}, ${b})`,
        colorHsl: hexToHsl(colorHex),
      },
    };
  }

  // 3. JSON Detection
  if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
    try {
      const parsed = JSON.parse(trimmed);
      const jsonKeyCount = typeof parsed === "object" && parsed !== null ? Object.keys(parsed).length : 0;
      return {
        type: "json",
        metadata: {
          ...baseMetadata,
          language: "json",
          jsonKeyCount,
        },
      };
    } catch {
      // Not valid JSON
    }
  }

  // 4. URL
  if (/^(https?:\/\/|ftps?:\/\/)[^\s/$.?#].[^\s]*$/i.test(trimmed)) {
    try {
      const urlObj = new URL(trimmed);
      return {
        type: "url",
        metadata: {
          ...baseMetadata,
          urlDomain: urlObj.hostname,
          urlTitle: urlObj.hostname,
        },
      };
    } catch {
      // invalid URL
    }
  }

  // 5. Email
  if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(trimmed)) {
    return {
      type: "email",
      metadata: {
        ...baseMetadata,
      },
    };
  }

  // 6. Phone Number
  if (/^(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}$/.test(trimmed)) {
    return {
      type: "phone",
      metadata: {
        ...baseMetadata,
      },
    };
  }

  // 7. File Path
  if (
    /^([a-zA-Z]:\\|\/|\.\/|\.\.\/)[^\0]+$/i.test(trimmed) &&
    (trimmed.includes("/") || trimmed.includes("\\")) &&
    !trimmed.includes("\n")
  ) {
    return {
      type: "filepath",
      metadata: {
        ...baseMetadata,
      },
    };
  }

  // 8. SQL Query Detection
  const sqlRegex = /\b(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP|GRANT|TRUNCATE|JOIN|WHERE|FROM|GROUP BY|ORDER BY)\b/i;
  if (sqlRegex.test(trimmed) && (trimmed.includes("FROM") || trimmed.includes("TABLE") || trimmed.includes("INTO"))) {
    return {
      type: "sql",
      metadata: {
        ...baseMetadata,
        language: "sql",
      },
    };
  }

  // 9. Code Detection
  const codeLang = detectCodeLanguage(trimmed);
  if (codeLang) {
    return {
      type: "code",
      metadata: {
        ...baseMetadata,
        language: codeLang,
      },
    };
  }

  // Default to Plain Text
  return {
    type: "text",
    metadata: baseMetadata,
  };
}

function detectCodeLanguage(text: string): string | null {
  if (text.includes("import ") && (text.includes("from ") || text.includes("react"))) return "typescript";
  if (text.includes("const ") || text.includes("let ") || text.includes("function ") || text.includes("=>")) return "javascript";
  if (text.includes("def ") && text.includes(":") && (text.includes("self") || text.includes("import "))) return "python";
  if (text.includes("<html") || (text.includes("<div") && text.includes(">"))) return "html";
  if (text.includes("fn main()") || text.includes("let mut ")) return "rust";
  if (text.includes("#include <") || text.includes("int main(")) return "cpp";
  if (text.includes("class ") && text.includes("public static void main")) return "java";
  if (text.startsWith("#!") || (text.includes("echo ") && text.includes("$"))) return "shell";
  if (text.includes("{") && text.includes("}") && text.includes("margin") || text.includes("padding") || text.includes("color:")) return "css";

  return null;
}

// Helpers
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function hexToRgb(hex: string): string {
  let c = hex.replace("#", "");
  if (c.length === 3) {
    c = c.split("").map((x) => x + x).join("");
  }
  const num = parseInt(c, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgb(${r}, ${g}, ${b})`;
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("").toUpperCase();
}

function hexToHsl(hex: string): string {
  let c = hex.replace("#", "");
  if (c.length === 3) c = c.split("").map((x) => x + x).join("");
  const r = parseInt(c.substring(0, 2), 16) / 255;
  const g = parseInt(c.substring(2, 4), 16) / 255;
  const b = parseInt(c.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
}

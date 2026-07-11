import type { CSSProperties } from "react";

/** Convert theme object (primaryColor/backgroundColor/...) thành CSS custom properties dùng bởi các component thật (--theme-*). */
export function themeStyleFor(theme: Record<string, string>): CSSProperties {
  const bodyFont = theme.bodyFont || theme.fontFamily;
  return {
    "--theme-primary": theme.primaryColor || "#059669",
    "--theme-bg": theme.backgroundColor || "#ffffff",
    "--theme-text": theme.textColor || "#111111",
    "--theme-button": theme.buttonColor || theme.primaryColor || "#059669",
    "--theme-button-text": theme.buttonTextColor || "#ffffff",
    "--theme-heading-font": theme.headingFont || bodyFont,
    "--theme-body-font": bodyFont,
    backgroundColor: theme.backgroundColor || "#ffffff",
    color: theme.textColor || undefined,
  } as CSSProperties;
}

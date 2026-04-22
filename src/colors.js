/**
 * PRESET_COLORS — 30 visually distinct, professionally curated colors.
 * Expanded to ensure large inventories don't share similar colors.
 * Tuned to remain legible on both pure white and dark slate backgrounds.
 */
export const PRESET_COLORS = [
  // ── The Core Vibrant Base (Tailwind 500s) ──
  '#3b82f6', // Blue
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#ef4444', // Red
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#ec4899', // Pink
  '#84cc16', // Lime
  '#14b8a6', // Teal
  '#a855f7', // Purple
  '#eab308', // Yellow
  '#6366f1', // Indigo
  '#d946ef', // Fuchsia
  '#f43f5e', // Rose
  '#0ea5e9', // Sky Blue
  '#22c55e', // Green

  // ── The Bright Pastels (Tailwind 300s/400s) ──
  '#fcd34d', // Bright Pale Gold
  '#6ee7b7', // Mint Green
  '#7dd3fc', // Baby Blue
  '#d8b4fe', // Light Lavender
  '#fbcfe8', // Soft Pink
  '#fda4af', // Salmon Coral
  '#bef264', // Electric Lime
  '#67e8f9', // Bright Cyan

  // ── The Deep Accents (Tailwind 600s/700s) ──
  '#b45309', // Burnt Orange / Bronze
  '#4d7c0f', // Forest Green
  '#be185d', // Deep Magenta / Berry
  '#0369a1', // Deep Ocean Blue
  '#7e22ce', // Deep Royal Purple
]

/**
 * Returns the next color from the preset palette based on how many
 * categories already exist, cycling if more than 30.
 */
export const getNextColor = (existingCount) =>
  PRESET_COLORS[existingCount % PRESET_COLORS.length]

/**
 * Returns a random color from the palette (for cycle-on-click).
 * Avoids returning the current color if possible.
 */
export const cycleColor = (currentColor) => {
  const others = PRESET_COLORS.filter(c => c !== currentColor)
  return others[Math.floor(Math.random() * others.length)]
}
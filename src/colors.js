/**
 * PRESET_COLORS — 12 visually distinct, professionally curated colors.
 * Chosen to be easily differentiated at a glance on both light and dark
 * backgrounds, and to work well in bar charts and SVG progress rings.
 */
export const PRESET_COLORS = [
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
  '#facc15', // Yellow
]

/**
 * Returns the next color from the preset palette based on how many
 * categories already exist, cycling if more than 12.
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

export interface FoldedDimensions {
  length: number
  width: number
  height: number
  raw: string
  parsed: boolean
}

/**
 * Parse folded size strings like "71×41×55cm" or "54x58x27cm"
 * Returns dimensions sorted descending (length ≥ height ≥ width).
 */
export function parseFoldedSize(s: string): FoldedDimensions {
  const m = s.match(
    /(\d+(?:\.\d+)?)\s*[×xX]\s*(\d+(?:\.\d+)?)\s*[×xX]\s*(\d+(?:\.\d+)?)/
  )
  if (m) {
    const dims = [parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3])].sort(
      (a, b) => b - a
    )
    return { length: dims[0], height: dims[1], width: dims[2], raw: s, parsed: true }
  }
  return { length: 0, height: 0, width: 0, raw: s, parsed: false }
}

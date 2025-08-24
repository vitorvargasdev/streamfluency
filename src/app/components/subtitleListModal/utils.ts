export const isOnlyBracketsOrParentheses = (text: string | null): boolean => {
  if (!text) return false
  const trimmed = text.trim()
  return /^\[[^\]]*\]$/.test(trimmed) || /^\([^)]*\)$/.test(trimmed)
}

export const sanitizeHtml = (text: string): string => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/&lt;br\s*\/?&gt;/gi, '<br />')
}

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

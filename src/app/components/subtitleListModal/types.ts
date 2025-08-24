export interface CombinedSubtitle {
  time: number
  endTime: number
  learningText: string | null
  nativeText: string | null
  isCurrent: boolean
}

export type TabType = 'learning' | 'native'

export interface ScrollState {
  hasScrolledToCurrentOnOpen: boolean
  hasScrolledToCurrentOnTabChange: Record<string, boolean>
}

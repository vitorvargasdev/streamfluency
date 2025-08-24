export interface IPlayerAdapter {
  name: string

  play(): void
  pause(): void
  isPaused(): boolean

  currentTime(): number
  setTime(time: number): void
  getDuration(): number

  getPlaybackRate(): number
  setPlaybackRate(rate: number): void

  isReady(): boolean
  dispose(): void
}

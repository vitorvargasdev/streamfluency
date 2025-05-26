export interface PlayerPlatformInterface {
  name: string

  play(): void
  pause(): void
  isPaused(): boolean
  currentTime(): number
  setTime(time: number): void
}

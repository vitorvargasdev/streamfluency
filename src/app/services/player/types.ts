export enum PlayerState {
  IDLE = 'idle',
  READY = 'ready',
  PLAYING = 'playing',
  PAUSED = 'paused',
  ENDED = 'ended',
  ERROR = 'error'
}

export class PlayerError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'PlayerError'
  }
}

export const PlayerErrorCodes = {
  ELEMENT_NOT_FOUND: 'ELEMENT_NOT_FOUND',
  INVALID_TIME: 'INVALID_TIME',
  INVALID_RATE: 'INVALID_RATE',
  PLAYBACK_FAILED: 'PLAYBACK_FAILED',
  NOT_READY: 'NOT_READY'
} as const
export class SubtitleError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'SubtitleError'
  }
}

export const SubtitleErrorCodes = {
  PLAYER_NOT_FOUND: 'PLAYER_NOT_FOUND',
  NO_CAPTIONS: 'NO_CAPTIONS',
  LANGUAGE_NOT_FOUND: 'LANGUAGE_NOT_FOUND',
  FETCH_FAILED: 'FETCH_FAILED',
  PARSE_FAILED: 'PARSE_FAILED',
  URL_NOT_FOUND: 'URL_NOT_FOUND',
  XHR_INTERCEPT_TIMEOUT: 'XHR_INTERCEPT_TIMEOUT'
} as const
import { Subtitle } from '@/app/services/subtitles/types'

export type YoutubeSubtitle = {
  events: Event[]
}

type Event = {
  id: number
  tStartMs: number
  dDurationMs: number
  segs?: segs[]
}

type segs = {
  utf8: string
  acAsrConf?: number
  tOffsetMs?: number
}

const parse = (data: YoutubeSubtitle): Subtitle[] => {
  return data.events
    .map((event: Event) => {
      const text = event.segs?.map((seg: segs) => seg.utf8).join('')

      return {
        begin: event.tStartMs * 0.001,
        end: event.tStartMs + event.dDurationMs * 0.001,
        text,
      } as Subtitle
    })
    .filter((subtitle) => subtitle.text !== undefined)
    .filter((subtitle) => subtitle.text !== '\n')
}

export default parse

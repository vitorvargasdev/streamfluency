import { Subtitle } from '@/app/services/subtitle/types'

export type ParseFormat = 'html' | 'text'

export interface ISubtitleParser<T = any> {
  parse(data: T, format: ParseFormat): Subtitle[]
}
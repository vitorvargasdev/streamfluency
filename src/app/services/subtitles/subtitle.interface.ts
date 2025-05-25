import { LANGUAGES, Subtitle } from "./types";

export interface SubtitleInterface {
  fetchSubtitles(lang: LANGUAGES): Promise<Subtitle[]>
}

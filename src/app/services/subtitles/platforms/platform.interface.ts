import { LANGUAGES, PLATFORM, Subtitle } from "../types";

export interface PlatformInterface {
  name: PLATFORM

  fetchSubtitles(lang: LANGUAGES): Promise<Subtitle[]>
}

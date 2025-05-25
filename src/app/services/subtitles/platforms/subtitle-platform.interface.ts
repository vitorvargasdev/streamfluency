import { PLATFORM } from "@/app/services/types";
import { LANGUAGES, Subtitle } from "@/app/services/subtitles/types";

export interface SubtitlePlatformInterface {
  name: PLATFORM

  fetchSubtitles(lang: LANGUAGES): Promise<Subtitle[]>
}

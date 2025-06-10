import { SubtitleInterface } from "@/app/services/subtitles/subtitle.interface";
import { Subtitle } from "@/app/services/subtitles/types";

export interface State {
  subtitleService: SubtitleInterface | undefined,
  isSubtitlesOn: boolean,
  subtitles: {
    native: Subtitle[],
    learning: Subtitle[],
  }
  currentSubtitles: {
    native: Subtitle | null,
    learning: Subtitle | null,
  }
}

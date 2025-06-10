import { GLOBAL_LANGUAGES } from "@/app/assets/constants"

export interface State {
  languages: {
    native: GLOBAL_LANGUAGES
    learning: GLOBAL_LANGUAGES
  }
}

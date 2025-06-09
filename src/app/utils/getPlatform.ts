import { PLATFORM } from '../assets/constants'

export default (): PLATFORM | undefined => {
  const app = document.querySelector('#op-app') as HTMLElement
  const platform = app.getAttribute('platform')

  return platform as PLATFORM
}

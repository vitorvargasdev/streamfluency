export const enum PLATFORMS {
  YOUTUBE = 'youtube',
}

export const isInjected = (path: string): boolean => {
  const app = document.querySelector(`${path} > #app`)
  return !!app
}

export const inject = (
  platform: PLATFORMS,
  head: HTMLElement,
  parentApp: HTMLElement
): void => {
  const timestamp = new Date().getTime()

  const css: HTMLLinkElement = document.createElement('link')
  css.rel = 'stylesheet'
  css.id = 'op-css'
  css.href = chrome.runtime.getURL('/assets/app.css?timestamp=' + timestamp)
  head?.append(css)

  const app: HTMLDivElement = document.createElement('div')
  app.id = 'op-app'
  app.setAttribute('platform', platform)
  app.style.position = 'absolute'
  app.style.webkitUserSelect = 'text'
  app.style.userSelect = 'text'
  app.style.left = '0'
  app.style.width = '100%'
  app.style.zIndex = '10'
  parentApp.append(app)

  const script: HTMLScriptElement = document.createElement('script')
  script.type = 'module'
  script.src = chrome.runtime.getURL('/assets/app.js?timestamp=' + timestamp)
  script.id = 'op-script'
  head?.append(script)
}

export const remove = (): void => {
  const css = document.querySelector('#op-css')
  const app = document.querySelector('#op-app')
  const script = document.querySelector('#op-script')
  css?.remove()
  app?.remove()
  script?.remove()
}

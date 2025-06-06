export default (): string => {
  const app = document.querySelector('#op-app') as HTMLElement
  return app.getAttribute('platform') as string
}

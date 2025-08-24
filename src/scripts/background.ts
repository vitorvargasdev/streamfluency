declare const browser: typeof chrome | undefined

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'downloadBackup') {
    const { backup, filename } = request
    downloadBackupFile(backup, filename)
      .then(() => {
        sendResponse({ success: true })
      })
      .catch((error) => {
        sendResponse({ success: false, error: error.message })
      })
    return true
  }

  if (request.action === 'testBackground') {
    sendResponse({ success: true, message: 'Background is active' })
  }
})

async function downloadBackupFile(
  backup: unknown,
  filename: string
): Promise<void> {
  const dataStr = JSON.stringify(backup, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(dataBlob)

  try {
    let downloadPath = filename

    if (downloadPath.startsWith('/')) {
      downloadPath = downloadPath.substring(1)
    }

    downloadPath = downloadPath.replace(/\\/g, '/')

    const api =
      typeof browser !== 'undefined' && browser.downloads ? browser : chrome

    const downloadOptions: chrome.downloads.DownloadOptions = {
      url: url,
      filename: downloadPath,
      saveAs: false,
    }

    if (
      api === chrome ||
      (browser &&
        browser.downloads &&
        'FilenameConflictAction' in browser.downloads)
    ) {
      downloadOptions.conflictAction = 'overwrite'
    }

    const downloadId = await api.downloads.download(downloadOptions)

    return new Promise((resolve, reject) => {
      let checkCount = 0
      const maxChecks = 50

      const checkDownload = setInterval(() => {
        checkCount++

        api.downloads.search({ id: downloadId }, async (items) => {
          if (items && items[0]) {
            const item = items[0]

            if (item.state === 'complete') {
              clearInterval(checkDownload)
              URL.revokeObjectURL(url)
              resolve()
            } else if (item.state === 'interrupted') {
              clearInterval(checkDownload)
              URL.revokeObjectURL(url)
              reject(new Error(item.error || 'Download interrupted'))
            }
          }

          if (checkCount >= maxChecks) {
            clearInterval(checkDownload)
            URL.revokeObjectURL(url)
            reject(new Error('Download timeout'))
          }
        })
      }, 500)
    })
  } catch (error) {
    URL.revokeObjectURL(url)
    throw error
  }
}

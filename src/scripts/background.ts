// Background script for auto-backups with proper Firefox subfolder support

// Declare browser for Firefox compatibility
declare const browser: typeof chrome | undefined

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  console.log('Background received message:', request.action)

  if (request.action === 'downloadBackup') {
    const { backup, filename } = request
    downloadBackupFile(backup, filename)
      .then(() => {
        console.log('Backup downloaded successfully')
        sendResponse({ success: true })
      })
      .catch((error) => {
        console.error('Download failed:', error)
        sendResponse({ success: false, error: error.message })
      })
    return true // Keep channel open for async response
  }

  if (request.action === 'testBackground') {
    console.log('Background script is working!')
    sendResponse({ success: true, message: 'Background is active' })
  }
})

async function downloadBackupFile(
  backup: any,
  filename: string
): Promise<void> {
  console.log('=== Download Request ===')
  console.log('Original filename:', filename)

  const dataStr = JSON.stringify(backup, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(dataBlob)

  try {
    // Ensure proper path formatting for Firefox
    let downloadPath = filename

    // Remove leading slash if present (Firefox doesn't allow it)
    if (downloadPath.startsWith('/')) {
      downloadPath = downloadPath.substring(1)
    }

    // Ensure we're using forward slashes (not backslashes)
    downloadPath = downloadPath.replace(/\\/g, '/')

    // Log the final path
    console.log('Final download path:', downloadPath)
    console.log('Path analysis:', {
      hasFolder: downloadPath.includes('/'),
      folder: downloadPath.split('/')[0],
      filename: downloadPath.split('/').pop(),
    })

    // Use the appropriate API (browser for Firefox, chrome for others)
    const api =
      typeof browser !== 'undefined' && browser.downloads ? browser : chrome

    // Download configuration matching Simple Tab Groups
    const downloadOptions: any = {
      url: url,
      filename: downloadPath,
      saveAs: false, // Don't show dialog for auto-backups
    }

    // Only add conflictAction if supported (not in older Firefox)
    if (
      api === chrome ||
      (browser &&
        browser.downloads &&
        'FilenameConflictAction' in browser.downloads)
    ) {
      downloadOptions.conflictAction = 'overwrite'
    }

    console.log('Download options:', downloadOptions)

    const downloadId = await api.downloads.download(downloadOptions)
    console.log('Download started with ID:', downloadId)

    // Monitor download progress
    return new Promise((resolve, reject) => {
      let checkCount = 0
      const maxChecks = 50 // 25 seconds max

      const checkDownload = setInterval(() => {
        checkCount++

        api.downloads.search({ id: downloadId }, async (items) => {
          if (items && items[0]) {
            const item = items[0]
            console.log(`Download state: ${item.state}`)

            if (item.state === 'complete') {
              clearInterval(checkDownload)
              URL.revokeObjectURL(url)
              console.log('=== Download Complete ===')
              console.log('Saved to:', item.filename)
              resolve()
            } else if (item.state === 'interrupted') {
              clearInterval(checkDownload)
              URL.revokeObjectURL(url)
              console.error('Download interrupted:', item.error)
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

// Log when background script loads
console.log('StreamFluency background script loaded (fixed version)')

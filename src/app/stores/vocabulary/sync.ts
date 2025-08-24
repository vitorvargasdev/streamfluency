import type { VocabularyItem } from './types'

export enum SYNC_ACTIONS {
  ADD = 'add',
  UPDATE = 'update',
  DELETE = 'delete',
  CLEAR = 'clear',
}

export interface SyncMessage {
  action: SYNC_ACTIONS
  data?: VocabularyItem | string
  timestamp: number
}

export class VocabularySync {
  private channel?: BroadcastChannel
  private readonly storageKey = 'streamfluency_vocabulary_sync'
  private readonly onSyncCallback: (message: SyncMessage) => void
  private readonly MESSAGE_EXPIRY_MS = 5000

  constructor(onSync: (message: SyncMessage) => void) {
    this.onSyncCallback = onSync
    this.setupSync()
  }

  private setupSync(): void {
    if (!('BroadcastChannel' in window)) {
      this.setupStorageFallback()
      return
    }

    try {
      this.channel = new BroadcastChannel('streamfluency-vocabulary')
      this.channel.onmessage = (event) => this.handleSync(event.data)
    } catch {
      this.setupStorageFallback()
    }
  }

  private setupStorageFallback(): void {
    window.addEventListener('storage', (event) => {
      if (event.key !== this.storageKey || !event.newValue) return

      try {
        const message = JSON.parse(event.newValue)
        this.handleSync(message)
      } catch {}
    })
  }

  private handleSync(message: SyncMessage): void {
    if (Date.now() - message.timestamp > this.MESSAGE_EXPIRY_MS) return
    this.onSyncCallback(message)
  }

  broadcast(action: SYNC_ACTIONS, data?: VocabularyItem | string): void {
    const message: SyncMessage = {
      action,
      data,
      timestamp: Date.now(),
    }

    if (this.channel) {
      this.channel.postMessage(message)
      return
    }

    localStorage.setItem(this.storageKey, JSON.stringify(message))

    setTimeout(() => {
      try {
        localStorage.removeItem(this.storageKey)
      } catch {}
    }, 100)
  }

  destroy(): void {
    this.channel?.close()
  }
}

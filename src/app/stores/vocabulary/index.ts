import { defineStore } from 'pinia'
import type { VocabularyItem, VocabularyState } from './types'
import { isRecord, isString, isNumber } from '../types'
import { VocabularySync, SYNC_ACTIONS, type SyncMessage } from './sync'

const STORAGE_KEY = 'streamfluency_vocabulary'
const ERROR_MESSAGES = {
  LOAD_FAILED: 'Failed to load vocabulary',
  ADD_FAILED: 'Failed to add item',
  UPDATE_FAILED: 'Failed to update item',
  DELETE_FAILED: 'Failed to delete item',
  CLEAR_FAILED: 'Failed to clear vocabulary',
  SAVE_FAILED: 'Failed to save vocabulary to storage',
  ITEM_NOT_FOUND: 'Vocabulary item not found',
} as const

let syncInstance: VocabularySync | null = null

export const useVocabularyStore = defineStore('vocabulary', {
  state: (): VocabularyState => ({
    items: [],
    isLoading: false,
    error: null,
  }),

  getters: {
    sortedItems: (state): VocabularyItem[] =>
      [...state.items].sort((a, b) => b.timestamp - a.timestamp),

    searchItems:
      (state) =>
      (query: string): VocabularyItem[] => {
        const trimmedQuery = query.trim()
        if (!trimmedQuery) return state.items

        const lowerQuery = trimmedQuery.toLowerCase()
        return state.items.filter((item) =>
          isItemMatchingQuery(item, lowerQuery)
        )
      },

    vocabularyTextsSet: (state): Set<string> =>
      new Set(state.items.map((item) => item.text.toLowerCase())),

    itemsSortedByLength: (state): VocabularyItem[] =>
      [...state.items].sort((a, b) => b.text.length - a.text.length),
  },

  actions: {
    async init(): Promise<void> {
      if (this.isLoading) return

      this.isLoading = true

      try {
        await this.loadFromStorage()

        if (!syncInstance) {
          syncInstance = new VocabularySync((message: SyncMessage) => {
            this.handleSyncMessage(message)
          })
        }
      } catch {
        this.error = ERROR_MESSAGES.LOAD_FAILED
      } finally {
        this.isLoading = false
      }
    },

    async loadFromStorage(): Promise<void> {
      const stored = this.getStoredData()
      if (!stored) return

      this.items = this.parseStoredData(stored)
    },

    getStoredData(): string | null {
      try {
        return localStorage.getItem(STORAGE_KEY)
      } catch {
        return null
      }
    },

    parseStoredData(stored: string): VocabularyItem[] {
      try {
        const parsed = JSON.parse(stored)
        if (!Array.isArray(parsed)) return []
        return parsed.filter((item) => this.isValidVocabularyItem(item))
      } catch {
        return []
      }
    },

    isValidVocabularyItem(item: unknown): item is VocabularyItem {
      if (!isRecord(item)) return false

      return (
        isString(item.id) && isString(item.text) && isNumber(item.timestamp)
      )
    },

    async addItem(
      item: Omit<VocabularyItem, 'id' | 'timestamp'>
    ): Promise<VocabularyItem> {
      try {
        const newItem = this.createVocabularyItem(item)
        this.items = [...this.items, newItem]
        await this.saveToStorage()

        syncInstance?.broadcast(SYNC_ACTIONS.ADD, newItem)

        return newItem
      } catch (error) {
        this.error = ERROR_MESSAGES.ADD_FAILED
        throw error
      }
    },

    createVocabularyItem(
      item: Omit<VocabularyItem, 'id' | 'timestamp'>
    ): VocabularyItem {
      return {
        ...item,
        id: this.generateId(),
        timestamp: Date.now(),
      }
    },

    generateId(): string {
      return crypto.randomUUID()
    },

    async updateItem(
      id: string,
      updates: Partial<Omit<VocabularyItem, 'id'>>
    ): Promise<void> {
      try {
        const index = this.findItemIndex(id)
        if (index === -1) {
          throw new Error(ERROR_MESSAGES.ITEM_NOT_FOUND)
        }

        const updatedItem = {
          ...this.items[index],
          ...updates,
          id,
        }

        this.items = [
          ...this.items.slice(0, index),
          updatedItem,
          ...this.items.slice(index + 1),
        ]

        await this.saveToStorage()
        syncInstance?.broadcast(SYNC_ACTIONS.UPDATE, updatedItem)
      } catch (error) {
        this.error = ERROR_MESSAGES.UPDATE_FAILED
        throw error
      }
    },

    async deleteItem(id: string): Promise<void> {
      try {
        const index = this.findItemIndex(id)
        if (index === -1) return

        this.items = this.items.filter((_, i) => i !== index)
        await this.saveToStorage()
        syncInstance?.broadcast(SYNC_ACTIONS.DELETE, id)
      } catch (error) {
        this.error = ERROR_MESSAGES.DELETE_FAILED
        throw error
      }
    },

    async clearAll(): Promise<void> {
      if (this.items.length === 0) return

      try {
        this.items = []
        await this.saveToStorage()
        syncInstance?.broadcast(SYNC_ACTIONS.CLEAR)
      } catch (error) {
        this.error = ERROR_MESSAGES.CLEAR_FAILED
        throw error
      }
    },

    async saveToStorage(): Promise<void> {
      try {
        const data = JSON.stringify(this.items)
        localStorage.setItem(STORAGE_KEY, data)
      } catch (error) {
        if (this.isQuotaExceededError(error)) {
          this.error = 'Storage quota exceeded. Please clear some items.'
          throw new Error('Storage quota exceeded')
        }
        throw error
      }
    },

    isQuotaExceededError(error: unknown): boolean {
      if (!(error instanceof DOMException)) return false

      return (
        error.name === 'QuotaExceededError' ||
        error.name === 'NS_ERROR_DOM_QUOTA_REACHED'
      )
    },

    checkIfExists(text: string, context?: string): boolean {
      if (!text) return false

      const normalizedText = text.toLowerCase().trim()
      const normalizedContext = context?.toLowerCase().trim()

      return this.items.some(
        (item) =>
          item.text.toLowerCase().trim() === normalizedText &&
          item.context?.toLowerCase().trim() === normalizedContext
      )
    },

    findItemIndex(id: string): number {
      return this.items.findIndex((item) => item.id === id)
    },

    exportItems(): string {
      return JSON.stringify(this.items, null, 2)
    },

    handleSyncMessage(message: SyncMessage): void {
      if (message.action === SYNC_ACTIONS.ADD) {
        if (!message.data || typeof message.data !== 'object') return

        const item = message.data as VocabularyItem
        const exists = this.items.some((i) => i.id === item.id)
        if (exists) return

        this.items = [...this.items, item]
        return
      }

      if (message.action === SYNC_ACTIONS.UPDATE) {
        if (!message.data || typeof message.data !== 'object') return

        const updatedItem = message.data as VocabularyItem
        const index = this.findItemIndex(updatedItem.id)
        if (index === -1) return

        this.items = [
          ...this.items.slice(0, index),
          updatedItem,
          ...this.items.slice(index + 1),
        ]
        return
      }

      if (message.action === SYNC_ACTIONS.DELETE) {
        if (!message.data || typeof message.data !== 'string') return

        this.items = this.items.filter((item) => item.id !== message.data)
        return
      }

      if (message.action === SYNC_ACTIONS.CLEAR) {
        this.items = []
        return
      }
    },
  },
})

function isItemMatchingQuery(item: VocabularyItem, query: string): boolean {
  const searchableFields = [
    item.text,
    item.translation,
    item.notes,
    item.context,
    item.videoTitle,
  ].filter(Boolean)

  return searchableFields.some((field) => field!.toLowerCase().includes(query))
}

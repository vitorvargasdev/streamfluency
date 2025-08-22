import { defineStore } from 'pinia'
import type { VocabularyItem, VocabularyState } from './types'
import { isRecord, isString, isNumber } from '../types'

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
        if (!query.trim()) return state.items

        const lowerQuery = query.toLowerCase().trim()
        return state.items.filter((item) =>
          isItemMatchingQuery(item, lowerQuery)
        )
      },
  },

  actions: {
    async init(): Promise<void> {
      this.isLoading = true

      try {
        await this.loadFromStorage()
      } catch (error) {
        this.error = ERROR_MESSAGES.LOAD_FAILED
        console.error(ERROR_MESSAGES.LOAD_FAILED, error)
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
      } catch (error) {
        console.error('Failed to access localStorage:', error)
        return null
      }
    },

    parseStoredData(stored: string): VocabularyItem[] {
      try {
        const parsed = JSON.parse(stored)
        if (!Array.isArray(parsed)) {
          console.warn('Invalid stored data format, expected array')
          return []
        }
        return parsed.filter((item) => this.isValidVocabularyItem(item))
      } catch (error) {
        console.error('Failed to parse stored data:', error)
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
        this.items.push(newItem)
        await this.saveToStorage()
        return newItem
      } catch (error) {
        this.error = ERROR_MESSAGES.ADD_FAILED
        console.error(ERROR_MESSAGES.ADD_FAILED, error)
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

        this.items[index] = {
          ...this.items[index],
          ...updates,
          id,
        }

        await this.saveToStorage()
      } catch (error) {
        this.error = ERROR_MESSAGES.UPDATE_FAILED
        console.error(ERROR_MESSAGES.UPDATE_FAILED, error)
        throw error
      }
    },

    async deleteItem(id: string): Promise<void> {
      try {
        const index = this.findItemIndex(id)
        if (index === -1) return

        this.items.splice(index, 1)
        await this.saveToStorage()
      } catch (error) {
        this.error = ERROR_MESSAGES.DELETE_FAILED
        console.error(ERROR_MESSAGES.DELETE_FAILED, error)
        throw error
      }
    },

    async clearAll(): Promise<void> {
      if (this.items.length === 0) return

      try {
        this.items = []
        await this.saveToStorage()
      } catch (error) {
        this.error = ERROR_MESSAGES.CLEAR_FAILED
        console.error(ERROR_MESSAGES.CLEAR_FAILED, error)
        throw error
      }
    },

    async saveToStorage(): Promise<void> {
      try {
        const data = JSON.stringify(this.items)
        localStorage.setItem(STORAGE_KEY, data)
      } catch (error) {
        const message = ERROR_MESSAGES.SAVE_FAILED
        console.error(message, error)

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

    checkIfExists(text: string): boolean {
      if (!text) return false

      const normalizedText = text.toLowerCase().trim()
      return this.items.some(
        (item) => item.text.toLowerCase().trim() === normalizedText
      )
    },

    findItemIndex(id: string): number {
      return this.items.findIndex((item) => item.id === id)
    },

    exportItems(): string {
      return JSON.stringify(this.items, null, 2)
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

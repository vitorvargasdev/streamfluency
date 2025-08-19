import { defineStore } from 'pinia'
import type { VocabularyItem, VocabularyState } from './types'

const STORAGE_KEY = 'streamfluency_vocabulary'
const OLD_STORAGE_KEY = 'openfluency_vocabulary' // For migration

export const useVocabularyStore = defineStore('vocabulary', {
  state: (): VocabularyState => ({
    items: [],
    isLoading: false,
    error: null,
  }),

  getters: {
    sortedItems: (state) => {
      return [...state.items].sort((a, b) => b.timestamp - a.timestamp)
    },

    itemsByLanguage: (state) => {
      return (language: string) =>
        state.items.filter((item) => item.language === language)
    },

    searchItems: (state) => {
      return (query: string) => {
        const lowerQuery = query.toLowerCase()
        return state.items.filter(
          (item) =>
            item.text.toLowerCase().includes(lowerQuery) ||
            item.translation?.toLowerCase().includes(lowerQuery) ||
            item.notes?.toLowerCase().includes(lowerQuery)
        )
      }
    },
  },

  actions: {
    async init() {
      try {
        this.isLoading = true
        let stored = localStorage.getItem(STORAGE_KEY)

        // Try to migrate from old key if not found
        if (!stored) {
          const oldStored = localStorage.getItem(OLD_STORAGE_KEY)
          if (oldStored) {
            localStorage.setItem(STORAGE_KEY, oldStored)
            localStorage.removeItem(OLD_STORAGE_KEY)
            stored = oldStored
          }
        }

        if (stored) {
          this.items = JSON.parse(stored)
        }
      } catch (error) {
        this.error = 'Failed to load vocabulary'
        console.error('Failed to load vocabulary:', error)
      } finally {
        this.isLoading = false
      }
    },

    async addItem(item: Omit<VocabularyItem, 'id' | 'timestamp'>) {
      try {
        const newItem: VocabularyItem = {
          ...item,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
        }

        this.items.push(newItem)
        await this.saveToStorage()
        return newItem
      } catch (error) {
        this.error = 'Failed to add item'
        console.error('Failed to add vocabulary item:', error)
        throw error
      }
    },

    async updateItem(id: string, updates: Partial<VocabularyItem>) {
      try {
        const index = this.items.findIndex((item) => item.id === id)
        if (index !== -1) {
          this.items[index] = { ...this.items[index], ...updates }
          await this.saveToStorage()
        }
      } catch (error) {
        this.error = 'Failed to update item'
        console.error('Failed to update vocabulary item:', error)
        throw error
      }
    },

    async deleteItem(id: string) {
      try {
        const index = this.items.findIndex((item) => item.id === id)
        if (index !== -1) {
          this.items.splice(index, 1)
          await this.saveToStorage()
        }
      } catch (error) {
        this.error = 'Failed to delete item'
        console.error('Failed to delete vocabulary item:', error)
        throw error
      }
    },

    async clearAll() {
      try {
        this.items = []
        await this.saveToStorage()
      } catch (error) {
        this.error = 'Failed to clear vocabulary'
        console.error('Failed to clear vocabulary:', error)
        throw error
      }
    },

    async saveToStorage() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.items))
      } catch (error) {
        console.error('Failed to save vocabulary to storage:', error)
        throw error
      }
    },

    checkIfExists(text: string): boolean {
      return this.items.some(
        (item) => item.text.toLowerCase() === text.toLowerCase()
      )
    },
  },
})

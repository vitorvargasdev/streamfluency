import type { IDictionaryAdapter } from '../adapters/dictionary/IDictionaryAdapter'
import { FreeDictionaryAdapter } from '../adapters/dictionary/FreeDictionaryAdapter'

export class DictionaryAdapterFactory {
  private static adapters: Map<string, IDictionaryAdapter> = new Map()

  static {
    // Register available adapters
    this.registerAdapter(new FreeDictionaryAdapter())
  }

  static registerAdapter(adapter: IDictionaryAdapter): void {
    this.adapters.set(adapter.id, adapter)
  }

  static getAdapter(id: string): IDictionaryAdapter | null {
    return this.adapters.get(id) || null
  }

  static getAllAdapters(): IDictionaryAdapter[] {
    return Array.from(this.adapters.values())
  }

  static getAvailableAdapters(): Array<{ id: string; name: string }> {
    return Array.from(this.adapters.values()).map((adapter) => ({
      id: adapter.id,
      name: adapter.name,
    }))
  }
}

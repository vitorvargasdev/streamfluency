import type { ITranslationAdapter } from '../adapters/translation/ITranslationAdapter'
import { MyMemoryAdapter } from '../adapters/translation/MyMemoryAdapter'

export class TranslationAdapterFactory {
  private static adapters: Map<string, ITranslationAdapter> = new Map()

  static {
    // Register available adapters
    this.registerAdapter(new MyMemoryAdapter())
  }

  static registerAdapter(adapter: ITranslationAdapter): void {
    this.adapters.set(adapter.id, adapter)
  }

  static getAdapter(id: string): ITranslationAdapter | null {
    return this.adapters.get(id) || null
  }

  static getAllAdapters(): ITranslationAdapter[] {
    return Array.from(this.adapters.values())
  }

  static getAvailableAdapters(): Array<{ id: string; name: string }> {
    return Array.from(this.adapters.values()).map((adapter) => ({
      id: adapter.id,
      name: adapter.name,
    }))
  }
}

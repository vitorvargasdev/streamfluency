<script setup lang="ts">
import { DATE_FILTERS, SORT_OPTIONS, UI_CONFIG } from './constants'
import type { DateFilter, SortOption } from './types'

defineProps<{
  searchQuery: string
  dateFilter: DateFilter
  sortBy: SortOption
  videoFilter: string
  uniqueVideos: string[]
  hasActiveFilters: boolean
  hasItems: boolean
}>()

const emit = defineEmits<{
  'update:searchQuery': [value: string]
  'update:dateFilter': [value: DateFilter]
  'update:sortBy': [value: SortOption]
  'update:videoFilter': [value: string]
  clearAll: []
  clearFilters: []
}>()

const truncateVideoTitle = (title: string): string => {
  if (title.length <= UI_CONFIG.MAX_VIDEO_TITLE_LENGTH) return title
  return `${title.substring(0, UI_CONFIG.MAX_VIDEO_TITLE_LENGTH)}...`
}
</script>

<template>
  <div>
    <div class="search-header">
      <input
        :value="searchQuery"
        @input="
          $emit('update:searchQuery', ($event.target as HTMLInputElement).value)
        "
        type="text"
        placeholder="Buscar palavras..."
        class="search-input"
      />
      <button v-if="hasItems" @click="$emit('clearAll')" class="clear-all-btn">
        Limpar Tudo
      </button>
    </div>

    <div class="filters-bar">
      <div class="filter-chips">
        <div class="filter-chip-group">
          <button
            v-for="filter in Object.values(DATE_FILTERS)"
            :key="filter"
            @click="$emit('update:dateFilter', filter as DateFilter)"
            :class="['filter-chip', { active: dateFilter === filter }]"
          >
            {{
              filter === 'all'
                ? 'Todos'
                : filter === 'today'
                  ? 'Hoje'
                  : filter === 'week'
                    ? 'Semana'
                    : 'Mês'
            }}
          </button>
        </div>

        <div class="filter-chip-group">
          <button
            @click="$emit('update:sortBy', SORT_OPTIONS.RECENT)"
            :class="['filter-chip', { active: sortBy === SORT_OPTIONS.RECENT }]"
          >
            ↓ Recente
          </button>
          <button
            @click="$emit('update:sortBy', SORT_OPTIONS.ALPHABETICAL)"
            :class="[
              'filter-chip',
              { active: sortBy === SORT_OPTIONS.ALPHABETICAL },
            ]"
          >
            A-Z
          </button>
        </div>

        <button
          v-if="hasActiveFilters"
          @click="$emit('clearFilters')"
          class="filter-chip clear-chip"
        >
          ✕ Limpar
        </button>
      </div>

      <div v-if="uniqueVideos.length > 0" class="video-filter">
        <select
          :value="videoFilter"
          @change="
            $emit(
              'update:videoFilter',
              ($event.target as HTMLSelectElement).value
            )
          "
          class="video-select"
        >
          <option value="all">📹 Todos os vídeos</option>
          <option
            v-for="video in uniqueVideos"
            :key="video"
            :value="video"
            :title="video"
          >
            {{ truncateVideoTitle(video) }}
          </option>
        </select>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.search-header {
  display: flex;
  gap: 8px;
  padding: 16px 12px 12px 12px;
  background: #1a1a1a;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: sticky;
  top: 0;
  z-index: 100;
  flex-shrink: 0;

  .search-input {
    flex: 1;
    padding: 8px 12px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    color: #fff;
    font-size: 14px;

    &::placeholder {
      color: rgba(255, 255, 255, 0.4);
    }

    &:focus {
      outline: none;
      border-color: rgba(102, 126, 234, 0.5);
      background: rgba(255, 255, 255, 0.08);
    }
  }

  .clear-all-btn {
    padding: 8px 16px;
    background: rgba(211, 47, 47, 0.2);
    color: #ef5350;
    border: 1px solid rgba(211, 47, 47, 0.3);
    border-radius: 6px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    transition: all 0.2s;

    &:hover {
      background: rgba(211, 47, 47, 0.3);
      border-color: rgba(211, 47, 47, 0.5);
    }
  }
}

.filters-bar {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px 12px 12px 12px;
  margin-top: 8px;
  background: #1a1a1a;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  border-top: 1px solid rgba(255, 255, 255, 0.06);

  .filter-chips {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    align-items: center;
    margin-bottom: 4px;

    .filter-chip-group {
      display: flex;
      gap: 4px;
      background: rgba(255, 255, 255, 0.03);
      padding: 3px;
      border-radius: 8px;
    }

    .filter-chip {
      padding: 6px 12px;
      background: transparent;
      border: none;
      border-radius: 6px;
      color: rgba(255, 255, 255, 0.5);
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;

      &:hover {
        background: rgba(255, 255, 255, 0.05);
        color: rgba(255, 255, 255, 0.7);
      }

      &.active {
        background: rgba(102, 126, 234, 0.2);
        color: #8fa1f3;
        font-weight: 600;

        &:hover {
          background: rgba(102, 126, 234, 0.25);
        }
      }

      &.clear-chip {
        background: transparent;
        color: rgba(239, 83, 80, 0.8);
        margin-left: auto;

        &:hover {
          background: rgba(239, 83, 80, 0.1);
          color: #ff6b6b;
        }
      }
    }
  }

  .video-filter {
    width: 100%;

    .video-select {
      width: 100%;
      padding: 8px 12px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      color: rgba(255, 255, 255, 0.9);
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s ease;
      appearance: none;
      background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.4)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
      background-repeat: no-repeat;
      background-position: right 8px center;
      background-size: 16px;
      padding-right: 32px;

      &:hover {
        background-color: rgba(255, 255, 255, 0.06);
        border-color: rgba(255, 255, 255, 0.12);
      }

      &:focus {
        outline: none;
        border-color: rgba(102, 126, 234, 0.4);
        background-color: rgba(255, 255, 255, 0.06);
      }

      option {
        background: #1a1a1a;
        color: #fff;
        padding: 8px;
      }
    }
  }
}

@media (max-width: 768px) {
  .search-header {
    padding: 10px;
  }

  .filters-bar {
    padding: 10px;
    gap: 8px;

    .filter-chips {
      .filter-chip-group {
        width: 100%;
        justify-content: space-between;
      }

      .filter-chip {
        flex: 1;
        font-size: 11px;
        padding: 5px 8px;
      }
    }

    .video-filter {
      .video-select {
        font-size: 12px;
      }
    }
  }
}
</style>

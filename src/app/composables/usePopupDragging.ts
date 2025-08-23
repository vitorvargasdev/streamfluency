import { ref, Ref } from 'vue'
import { POPUP_CONFIG } from '../components/selectionPopup/constants'

export interface DragState {
  isDragging: Ref<boolean>
  position: Ref<{ x: number; y: number }>
  startDrag: (event: MouseEvent | TouchEvent) => void
  stopDrag: () => void
  setupDragListeners: () => void
  cleanupDragListeners: () => void
}

export function usePopupDragging(initialPosition = { x: 0, y: 0 }): DragState {
  const isDragging = ref(false)
  const position = ref(initialPosition)
  const dragOffset = ref({ x: 0, y: 0 })

  const startDrag = (event: MouseEvent | TouchEvent) => {
    isDragging.value = true

    const clientX =
      'touches' in event ? event.touches[0].clientX : event.clientX
    const clientY =
      'touches' in event ? event.touches[0].clientY : event.clientY

    dragOffset.value = {
      x: clientX - position.value.x,
      y: clientY - position.value.y,
    }

    event.preventDefault()
  }

  const onDrag = (event: MouseEvent | TouchEvent) => {
    if (!isDragging.value) return

    const clientX =
      'touches' in event ? event.touches[0].clientX : event.clientX
    const clientY =
      'touches' in event ? event.touches[0].clientY : event.clientY

    const newX = clientX - dragOffset.value.x
    const newY = clientY - dragOffset.value.y

    const maxX = window.innerWidth - POPUP_CONFIG.DIMENSIONS.WIDTH
    const maxY = window.innerHeight - POPUP_CONFIG.DIMENSIONS.HEIGHT

    position.value = {
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY)),
    }
  }

  const stopDrag = () => {
    isDragging.value = false
  }

  const setupDragListeners = () => {
    document.addEventListener('mousemove', onDrag)
    document.addEventListener('mouseup', stopDrag)
    document.addEventListener('touchmove', onDrag)
    document.addEventListener('touchend', stopDrag)
  }

  const cleanupDragListeners = () => {
    document.removeEventListener('mousemove', onDrag)
    document.removeEventListener('mouseup', stopDrag)
    document.removeEventListener('touchmove', onDrag)
    document.removeEventListener('touchend', stopDrag)
  }

  return {
    isDragging,
    position,
    startDrag,
    stopDrag,
    setupDragListeners,
    cleanupDragListeners,
  }
}

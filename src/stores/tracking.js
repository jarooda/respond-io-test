import { computed, shallowRef } from 'vue'
import { defineStore } from 'pinia'

export const HISTORY_LIMIT = 100

export const useTrackingStore = defineStore('tracking', () => {
  const past = shallowRef([])
  const future = shallowRef([])

  const canUndo = computed(() => past.value.length > 0)
  const canRedo = computed(() => future.value.length > 0)

  function record(snapshot) {
    past.value = [...past.value, snapshot].slice(-HISTORY_LIMIT)
    future.value = []
  }

  function undo(current) {
    if (!canUndo.value) return null
    const previous = past.value.at(-1)
    past.value = past.value.slice(0, -1)
    future.value = [...future.value, current]
    return previous
  }

  function redo(current) {
    if (!canRedo.value) return null
    const next = future.value.at(-1)
    future.value = future.value.slice(0, -1)
    past.value = [...past.value, current].slice(-HISTORY_LIMIT)
    return next
  }

  function clear() {
    past.value = []
    future.value = []
  }

  return { past, future, canUndo, canRedo, record, undo, redo, clear }
})

import { onBeforeUnmount, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useQueryClient } from '@tanstack/vue-query'

import { queryKeys } from '@/config/query'
import { useTrackingStore } from '@/stores/tracking'

export function useFlowHistory() {
  const queryClient = useQueryClient()
  const store = useTrackingStore()
  const { canUndo, canRedo } = storeToRefs(store)

  const current = () => queryClient.getQueryData(queryKeys.flow) ?? []

  function undo() {
    const snapshot = store.undo(current())
    if (snapshot) queryClient.setQueryData(queryKeys.flow, snapshot)
  }

  function redo() {
    const snapshot = store.redo(current())
    if (snapshot) queryClient.setQueryData(queryKeys.flow, snapshot)
  }

  return { canUndo, canRedo, undo, redo }
}

const isTextField = (element) =>
  element instanceof HTMLElement &&
  (element.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName))

export function useUndoRedoShortcuts({ undo, redo }) {
  function onKeydown(event) {
    if (!(event.metaKey || event.ctrlKey) || event.altKey || isTextField(event.target)) return
    const key = event.key.toLowerCase()

    if (key === 'z' && !event.shiftKey) undo()
    else if ((key === 'z' && event.shiftKey) || key === 'y') redo()
    else return

    event.preventDefault()
  }

  onMounted(() => window.addEventListener('keydown', onKeydown))
  onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
}

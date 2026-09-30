import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { CONNECTOR_TYPE } from '@/constants/nodeTypes'

export function useNodeDrawer(items) {
  const route = useRoute()
  const router = useRouter()

  const nodeId = computed(() => {
    const id = route.query.node
    return typeof id === 'string' && id ? id : null
  })

  const openItem = computed(() => {
    if (!nodeId.value || !items.value) return null
    const item = items.value.find((entry) => String(entry.id) === nodeId.value)
    // Success/Failure connectors are display-only.
    return item && item.type !== CONNECTOR_TYPE ? item : null
  })

  const isOpen = computed(() => !!openItem.value)

  const open = (id) => router.push({ name: 'canvas', query: { ...route.query, node: String(id) } })

  const close = ({ replace = false } = {}) => {
    const { node: _node, ...query } = route.query
    return (replace ? router.replace : router.push)({ name: 'canvas', query })
  }

  const toggle = (id) => (nodeId.value === String(id) ? close() : open(id))

  watch(
    [nodeId, items],
    () => {
      if (nodeId.value && items.value && !openItem.value) close({ replace: true })
    },
    { immediate: true },
  )

  return { nodeId, openItem, isOpen, open, close, toggle }
}

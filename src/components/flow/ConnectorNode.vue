<script setup>
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'

import { Badge } from '@/components/ui/badge'
import { useConnectionValidator } from '@/composables/useConnectionValidator'
import { CONNECTOR_TONES } from '@/constants/nodeTypes'
import { CONNECTOR_HEIGHT, NODE_WIDTH } from '@/utils/flowTransform'

const props = defineProps({
  data: { type: Object, required: true },
})

const item = computed(() => props.data.node)
const color = computed(() => CONNECTOR_TONES[item.value.data?.connectorType] ?? 'neutral')

// Full node width keeps the pill centered on the same axis as the cards around it.
const isValidConnection = useConnectionValidator()

const size = { width: `${NODE_WIDTH}px`, height: `${CONNECTOR_HEIGHT}px` }
</script>

<template>
  <div class="connector-node" :style="size">
    <Handle
      type="target"
      :position="Position.Top"
      :connectable="false"
      class="connector-node__handle connector-node__handle--hidden"
    />
    <Badge :color="color" pill dot>{{ item.name }}</Badge>
    <!-- Branches link onward from here, so only the source handle is interactive. -->
    <Handle
      type="source"
      :position="Position.Bottom"
      :is-valid-connection="isValidConnection"
      class="connector-node__handle"
    />
  </div>
</template>

<style scoped>
.connector-node {
  display: flex;
  align-items: center;
  justify-content: center;
}

.connector-node__handle {
  width: 8px;
  height: 8px;
  background: var(--surface-card);
  border: 1px solid var(--border-strong);
  /* The connector node itself ignores pointer events; its source handle must not. */
  pointer-events: all;
  transition: scale var(--duration-fast) var(--ease-standard);
}

.connector-node__handle:hover {
  scale: 1.4;
  border-color: var(--border-focus);
}

.connector-node__handle--hidden {
  opacity: 0;
  pointer-events: none;
}
</style>

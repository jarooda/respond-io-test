<script setup>
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import { Icon } from '@iconify/vue'

import { useConnectionValidator } from '@/composables/useConnectionValidator'
import { NODE_TYPES } from '@/constants/nodeTypes'
import { CARD_HEIGHT, NODE_WIDTH } from '@/utils/flowTransform'
import { getAttachmentCount, getNodeDescription, getNodeTitle } from '@/utils/nodeSummary'

const props = defineProps({
  data: { type: Object, required: true },
  selected: { type: Boolean, default: false },
})

const item = computed(() => props.data.node)
const meta = computed(() => NODE_TYPES[item.value.type] ?? NODE_TYPES.addComment)
const title = computed(() => getNodeTitle(item.value))
const description = computed(() => getNodeDescription(item.value))
const attachmentCount = computed(() => getAttachmentCount(item.value))
const hasTarget = computed(() => item.value.type !== 'trigger')

const isValidConnection = useConnectionValidator()

const size = { width: `${NODE_WIDTH}px`, height: `${CARD_HEIGHT}px` }
</script>

<template>
  <div class="flow-node" :class="{ 'flow-node--selected': selected }" :style="size">
    <Handle
      v-if="hasTarget"
      type="target"
      :position="Position.Top"
      :is-valid-connection="isValidConnection"
      class="flow-node__handle"
    />

    <span class="flow-node__icon" :class="`flow-node__icon--${meta.tone}`">
      <Icon :icon="meta.icon" />
    </span>

    <div class="flow-node__body">
      <div class="flow-node__meta">
        <span class="flow-node__type">{{ meta.label }}</span>
        <span
          v-if="attachmentCount"
          class="flow-node__attachments"
          :aria-label="`${attachmentCount} attachment${attachmentCount > 1 ? 's' : ''}`"
        >
          <Icon icon="material-symbols:image-outline" />
          {{ attachmentCount }}
        </span>
      </div>
      <div class="flow-node__title">{{ title }}</div>
      <p v-if="description" class="flow-node__description">{{ description }}</p>
    </div>

    <Handle
      type="source"
      :position="Position.Bottom"
      :is-valid-connection="isValidConnection"
      class="flow-node__handle"
    />
  </div>
</template>

<style scoped>
.flow-node {
  box-sizing: border-box;
  display: flex;
  gap: var(--space-3);
  padding: var(--space-3);
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-sm);
  font-family: var(--font-sans);
  text-align: left;
  transition:
    box-shadow var(--duration-fast) var(--ease-standard),
    border-color var(--duration-fast) var(--ease-standard);
}

.flow-node:hover {
  box-shadow: var(--shadow-md);
}

.flow-node--selected,
:global(.vue-flow__node:focus-visible) .flow-node {
  border-color: var(--border-focus);
  box-shadow: var(--ring-focus);
}

.flow-node__icon {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  font-size: 18px;
}

.flow-node__icon--warning {
  background: var(--warning-subtle);
  color: var(--warning-text);
}
.flow-node__icon--brand {
  background: var(--accent-subtle);
  color: var(--text-brand);
}
.flow-node__icon--info {
  background: var(--info-subtle);
  color: var(--info-text);
}
.flow-node__icon--neutral {
  background: var(--surface-muted);
  color: var(--text-secondary);
}

.flow-node__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.flow-node__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.flow-node__type {
  color: var(--text-tertiary);
  font-size: var(--text-2xs);
  font-weight: var(--weight-semibold);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}

.flow-node__attachments {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  color: var(--text-tertiary);
  font-size: var(--text-2xs);
}

.flow-node__title {
  overflow: hidden;
  color: var(--text-primary);
  font-size: var(--text-base);
  font-weight: var(--weight-semibold);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.flow-node__description {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  color: var(--text-secondary);
  font-size: var(--text-sm);
  line-height: var(--leading-snug);
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}

.flow-node__handle {
  width: 8px;
  height: 8px;
  background: var(--surface-card);
  border: 1px solid var(--border-strong);
  transition: scale var(--duration-fast) var(--ease-standard);
}

/* `scale` (not `transform`) so Vue Flow's per-side translate positioning is kept. */
.flow-node__handle:hover {
  scale: 1.4;
  border-color: var(--border-focus);
}
</style>

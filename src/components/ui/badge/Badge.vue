<script setup lang="ts">
import { computed } from 'vue'

type BadgeColor = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info'

const props = withDefaults(
  defineProps<{
    color?: BadgeColor
    solid?: boolean
    pill?: boolean
    /** Leading dot in the current color. @default false */
    dot?: boolean
    /** When true, renders a trailing × button that emits `remove`. */
    removable?: boolean
  }>(),
  {
    color: 'neutral',
    solid: false,
    pill: false,
    dot: false,
    removable: false,
  },
)

const emit = defineEmits<{ remove: [event: MouseEvent] }>()

const cls = computed(() =>
  [
    'jl-badge',
    `jl-badge--${props.color}`,
    props.solid ? 'jl-badge--solid' : '',
    props.pill ? 'jl-badge--pill' : '',
  ]
    .filter(Boolean)
    .join(' '),
)

function onRemove(event: MouseEvent) {
  event.stopPropagation()
  emit('remove', event)
}
</script>

<template>
  <span :class="cls">
    <span v-if="props.dot" class="jl-badge__dot" />
    <slot name="icon" />
    <slot />
    <button
      v-if="props.removable"
      type="button"
      class="jl-badge__remove"
      aria-label="Remove"
      @click="onRemove"
    >
      <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path
          d="M4 4l8 8M12 4l-8 8"
          stroke="currentColor"
          stroke-width="1.75"
          stroke-linecap="round"
        />
      </svg>
    </button>
  </span>
</template>

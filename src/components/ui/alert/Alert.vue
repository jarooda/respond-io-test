<script setup lang="ts">
import { useSlots } from 'vue'

type AlertTone = 'info' | 'success' | 'warning' | 'danger'

const props = withDefaults(
  defineProps<{
    tone?: AlertTone
    title?: string
    dismissible?: boolean
  }>(),
  { tone: 'info', title: '', dismissible: false },
)

const emit = defineEmits<{
  close: []
}>()

const slots = useSlots()

const ICON_PATHS: Record<AlertTone, string> = {
  info: 'M12 8h.01M11 12h1v4h1',
  success: 'M8 12.5l2.5 2.5 5.5-6',
  warning: 'M12 8.5v4M12 16h.01',
  danger: 'M12 8v4.5M12 16h.01',
}
</script>

<template>
  <div class="jl-alert" :class="`jl-alert--${props.tone}`" role="status">
    <span class="jl-alert__icon">
      <slot name="icon">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6" opacity="0.35" />
          <path
            :d="ICON_PATHS[props.tone]"
            stroke="currentColor"
            stroke-width="1.7"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </slot>
    </span>
    <div class="jl-alert__body">
      <div v-if="props.title" class="jl-alert__title">{{ props.title }}</div>
      <div v-if="slots.default" class="jl-alert__text"><slot /></div>
      <div v-if="slots.action" class="jl-alert__action"><slot name="action" /></div>
    </div>
    <button
      v-if="props.dismissible"
      type="button"
      class="jl-alert__close"
      aria-label="Dismiss"
      @click="emit('close')"
    >
      <svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true">
        <path
          d="M4 4l8 8M12 4l-8 8"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
        />
      </svg>
    </button>
  </div>
</template>

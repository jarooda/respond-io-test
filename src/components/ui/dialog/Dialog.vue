<script setup lang="ts">
import { watch, onBeforeUnmount } from 'vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    title?: string
    description?: string
    size?: 'sm' | 'md' | 'lg'
    showClose?: boolean
    /** Below --bp-mobile, render as a bottom sheet ("sheet", default) or stay centered ("center"). */
    mobile?: 'sheet' | 'center'
  }>(),
  { title: '', description: '', size: 'md', showClose: true, mobile: 'sheet' },
)

const emit = defineEmits<{ close: []; 'update:open': [open: boolean] }>()

function close() {
  emit('close')
  emit('update:open', false)
}
function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') close()
}
watch(
  () => props.open,
  (v) => {
    if (v) document.addEventListener('keydown', onKey)
    else document.removeEventListener('keydown', onKey)
  },
)
onBeforeUnmount(() => document.removeEventListener('keydown', onKey))
</script>

<template>
  <div v-if="open" class="jl-dialog__overlay" :data-mobile="mobile" @mousedown.self="close">
    <div :class="['jl-dialog', `jl-dialog--${size}`]" role="dialog" aria-modal="true">
      <div v-if="title || showClose" class="jl-dialog__header">
        <div class="jl-dialog__header-text">
          <div v-if="title" class="jl-dialog__title">{{ title }}</div>
          <div v-if="description" class="jl-dialog__desc">{{ description }}</div>
        </div>
        <button
          v-if="showClose"
          type="button"
          class="jl-dialog__close"
          aria-label="Close"
          @click="close"
        >
          <svg viewBox="0 0 18 18" width="18" height="18" fill="none" aria-hidden="true">
            <path
              d="M5 5l8 8M13 5l-8 8"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
            />
          </svg>
        </button>
      </div>
      <div v-if="$slots.default" class="jl-dialog__body"><slot /></div>
      <div v-if="$slots.footer" class="jl-dialog__footer"><slot name="footer" /></div>
    </div>
  </div>
</template>

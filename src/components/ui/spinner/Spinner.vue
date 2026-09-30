<script setup lang="ts">
import { computed } from 'vue'

type SpinnerSize = 'sm' | 'md' | 'lg'
type SpinnerTone = 'inherit' | 'neutral' | 'white'

const props = withDefaults(
  defineProps<{
    size?: SpinnerSize | number
    tone?: SpinnerTone
  }>(),
  { size: 'md', tone: undefined },
)

const SIZES: Record<SpinnerSize, number> = { sm: 16, md: 20, lg: 28 }

const px = computed(() => (typeof props.size === 'number' ? props.size : (SIZES[props.size] ?? 20)))

const color = computed(() =>
  props.tone === 'inherit'
    ? 'currentColor'
    : props.tone === 'neutral'
      ? 'var(--neutral-400)'
      : props.tone === 'white'
        ? '#fff'
        : undefined,
)
</script>

<template>
  <span class="jl-spinner" role="status" aria-label="Loading" :style="{ color }">
    <svg :width="px" :height="px" viewBox="0 0 24 24" fill="none">
      <circle
        class="jl-spinner__track"
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        stroke-width="2.5"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
      />
    </svg>
  </span>
</template>

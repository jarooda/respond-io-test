<script setup lang="ts">
import { useSlots } from 'vue'

type DividerOrientation = 'horizontal' | 'vertical'

const props = withDefaults(
  defineProps<{
    orientation?: DividerOrientation
    label?: string
  }>(),
  { orientation: 'horizontal', label: undefined },
)

const slots = useSlots()
const hasLabel = () => props.label != null || slots.default != null
const isVertical = () => props.orientation === 'vertical'
</script>

<template>
  <div v-if="hasLabel()" class="jl-divider jl-divider--labeled" role="separator">
    <slot>{{ props.label }}</slot>
  </div>
  <hr
    v-else
    class="jl-divider"
    :class="isVertical() ? 'jl-divider--v' : 'jl-divider--h'"
    role="separator"
    :aria-orientation="isVertical() ? 'vertical' : undefined"
  />
</template>

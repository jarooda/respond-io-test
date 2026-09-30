<script setup lang="ts">
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'subtle' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

const props = withDefaults(
  defineProps<{
    variant?: ButtonVariant
    size?: ButtonSize
    fullWidth?: boolean
    disabled?: boolean
    type?: 'button' | 'submit' | 'reset'
  }>(),
  {
    variant: 'primary',
    size: 'md',
    fullWidth: false,
    disabled: false,
    type: 'button',
  },
)

const cls = [
  'jl-btn',
  `jl-btn--${props.variant}`,
  `jl-btn--${props.size}`,
  props.fullWidth ? 'jl-btn--block' : '',
]
  .filter(Boolean)
  .join(' ')
</script>

<template>
  <button :type="props.type" :disabled="props.disabled" :class="cls">
    <slot name="icon" />
    <span v-if="$slots.default"><slot /></span>
    <slot name="trailing-icon" />
  </button>
</template>

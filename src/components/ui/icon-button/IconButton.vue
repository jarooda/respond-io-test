<script setup lang="ts">
import { computed } from 'vue'

type IconButtonVariant = 'ghost' | 'secondary' | 'primary'
type IconButtonSize = 'sm' | 'md' | 'lg'

const props = withDefaults(
  defineProps<{
    variant?: IconButtonVariant
    size?: IconButtonSize
    round?: boolean
    disabled?: boolean
    type?: 'button' | 'submit' | 'reset'
  }>(),
  {
    variant: 'ghost',
    size: 'md',
    round: false,
    disabled: false,
    type: 'button',
  },
)

const cls = computed(() =>
  [
    'jl-iconbtn',
    `jl-iconbtn--${props.variant}`,
    `jl-iconbtn--${props.size}`,
    props.round ? 'jl-iconbtn--round' : '',
  ]
    .filter(Boolean)
    .join(' '),
)
</script>

<template>
  <button :type="props.type" :disabled="props.disabled" :class="cls">
    <slot />
  </button>
</template>

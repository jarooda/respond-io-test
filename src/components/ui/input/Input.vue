<script setup lang="ts">
// Attributes (id, maxlength, aria-*) belong on the native control, not the wrapper.
defineOptions({ inheritAttrs: false })
import { computed, useSlots } from 'vue'

type InputSize = 'sm' | 'md' | 'lg'

const props = withDefaults(
  defineProps<{
    size?: InputSize
    invalid?: boolean
    disabled?: boolean
    modelValue?: string | number
    /** Inline text before the field (e.g. "https://"). Or use the `prefix` slot. */
    prefix?: string
    /** Inline text after the field (e.g. ".dev", a unit). Or use the `suffix` slot. */
    suffix?: string
    /** Show a clear (×) button when the value is non-empty. @default false */
    clearable?: boolean
  }>(),
  {
    size: 'md',
    invalid: false,
    disabled: false,
    modelValue: '',
    prefix: undefined,
    suffix: undefined,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  clear: []
}>()

const slots = useSlots()

const showClear = computed(
  () => props.clearable && !props.disabled && props.modelValue != null && props.modelValue !== '',
)

function onInput(event: Event) {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}
function onClear() {
  emit('update:modelValue', '')
  emit('clear')
}
</script>

<template>
  <div
    class="jl-input-wrap"
    :class="`jl-input-wrap--${props.size}`"
    :data-invalid="props.invalid || undefined"
    :data-disabled="props.disabled || undefined"
  >
    <span v-if="slots.icon" class="jl-input-adorn"><slot name="icon" /></span>
    <span v-if="slots.prefix || props.prefix" class="jl-input-affix"
      ><slot name="prefix">{{ props.prefix }}</slot></span
    >
    <input
      class="jl-input"
      :value="props.modelValue"
      :disabled="props.disabled"
      :aria-invalid="props.invalid || undefined"
      v-bind="$attrs"
      @input="onInput"
    />
    <button
      v-if="showClear"
      type="button"
      class="jl-input-clear"
      aria-label="Clear"
      tabindex="-1"
      @click="onClear"
    >
      <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path
          d="M4 4l8 8M12 4l-8 8"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
        />
      </svg>
    </button>
    <span v-if="slots.suffix || props.suffix" class="jl-input-affix"
      ><slot name="suffix">{{ props.suffix }}</slot></span
    >
    <span v-if="slots.trailing" class="jl-input-adorn"><slot name="trailing" /></span>
  </div>
</template>

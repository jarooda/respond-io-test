<script setup lang="ts">
// Attributes (id, maxlength, aria-*) belong on the native control, not the wrapper.
defineOptions({ inheritAttrs: false })
import { computed } from 'vue'

type SelectLeafOption = string | { value: string; label: string; disabled?: boolean }
type SelectOption = SelectLeafOption | { label: string; options: SelectLeafOption[] }
type SelectSize = 'sm' | 'md' | 'lg'

const props = withDefaults(
  defineProps<{
    size?: SelectSize
    options?: SelectOption[]
    placeholder?: string
    modelValue?: string
    disabled?: boolean
  }>(),
  { size: 'md', options: () => [], placeholder: undefined, modelValue: '', disabled: false },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

type NormLeaf = { value: string; label: string; disabled?: boolean }
type NormEntry =
  ({ kind: 'option' } & NormLeaf) | { kind: 'group'; label: string; options: NormLeaf[] }

const normLeaf = (o: SelectLeafOption): NormLeaf =>
  typeof o === 'string' ? { value: o, label: o } : o

const normalized = computed<NormEntry[]>(() =>
  props.options.map((o) => {
    if (o && typeof o === 'object' && 'options' in o && Array.isArray(o.options)) {
      return { kind: 'group', label: o.label, options: o.options.map(normLeaf) }
    }
    return { kind: 'option', ...normLeaf(o as SelectLeafOption) }
  }),
)

const isPlaceholder = computed(
  () => props.placeholder != null && (props.modelValue === '' || props.modelValue == null),
)

function onChange(event: Event) {
  emit('update:modelValue', (event.target as HTMLSelectElement).value)
}
</script>

<template>
  <span class="jl-select-wrap">
    <select
      class="jl-select"
      :class="`jl-select--${props.size}`"
      :data-placeholder="isPlaceholder || undefined"
      :value="props.modelValue"
      :disabled="props.disabled"
      v-bind="$attrs"
      @change="onChange"
    >
      <option v-if="props.placeholder" value="" disabled>{{ props.placeholder }}</option>
      <template
        v-for="(entry, i) in normalized"
        :key="entry.kind === 'group' ? `g${i}` : entry.value"
      >
        <optgroup v-if="entry.kind === 'group'" :label="entry.label">
          <option
            v-for="opt in entry.options"
            :key="opt.value"
            :value="opt.value"
            :disabled="opt.disabled || undefined"
          >
            {{ opt.label }}
          </option>
        </optgroup>
        <option v-else :value="entry.value" :disabled="entry.disabled || undefined">
          {{ entry.label }}
        </option>
      </template>
      <slot />
    </select>
    <span class="jl-select-chevron">
      <svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true">
        <path
          d="M4 6l4 4 4-4"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </span>
  </span>
</template>

<script setup lang="ts">
// Attributes (id, maxlength, aria-*) belong on the native control, not the wrapper.
defineOptions({ inheritAttrs: false })
import { ref, computed, watch, nextTick, onMounted } from 'vue'

const props = withDefaults(
  defineProps<{
    invalid?: boolean
    modelValue?: string
    /** Grow the field to fit its content. @default false */
    autoResize?: boolean
    /** Show a character counter (turns red past `maxLength`). @default false */
    showCount?: boolean
    maxLength?: number
  }>(),
  { invalid: false, modelValue: '', autoResize: false, showCount: false, maxLength: undefined },
)

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const area = ref<HTMLTextAreaElement | null>(null)
const len = computed(() => String(props.modelValue ?? '').length)
const over = computed(() => props.maxLength != null && len.value > props.maxLength)

function fit() {
  const el = area.value
  if (!el || !props.autoResize) return
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}

function onInput(event: Event) {
  emit('update:modelValue', (event.target as HTMLTextAreaElement).value)
  fit()
}

onMounted(fit)
watch(
  () => props.modelValue,
  () => nextTick(fit),
)
</script>

<template>
  <span v-if="showCount" class="jl-textarea-wrap">
    <textarea
      ref="area"
      class="jl-textarea"
      :class="autoResize ? 'jl-textarea--auto' : ''"
      :value="props.modelValue"
      :aria-invalid="props.invalid || undefined"
      :maxlength="props.maxLength"
      v-bind="$attrs"
      @input="onInput"
    />
    <span class="jl-textarea__count" :data-over="over || undefined">
      {{ props.maxLength != null ? `${len}/${props.maxLength}` : len }}
    </span>
  </span>
  <textarea
    v-else
    ref="area"
    class="jl-textarea"
    :class="autoResize ? 'jl-textarea--auto' : ''"
    :value="props.modelValue"
    :aria-invalid="props.invalid || undefined"
    :maxlength="props.maxLength"
    v-bind="$attrs"
    @input="onInput"
  />
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import flatpickr from 'flatpickr'
import 'flatpickr/dist/flatpickr.css'

defineOptions({ inheritAttrs: false })

const model = defineModel({ type: String, default: '' })
const props = defineProps({
  disabled: { type: Boolean, default: false },
  invalid: { type: Boolean, default: false },
  minuteIncrement: { type: Number, default: 5 },
})

const input = ref(null)
let picker = null

onMounted(() => {
  picker = flatpickr(input.value, {
    enableTime: true,
    noCalendar: true,
    time_24hr: true,
    dateFormat: 'H:i',
    allowInput: true,
    minuteIncrement: props.minuteIncrement,
    defaultDate: model.value || undefined,
    onChange: (_, value) => {
      if (value && value !== model.value) model.value = value
    },
  })
})

watch(model, (value) => {
  if (picker && picker.input.value !== value) picker.setDate(value || null, false)
})

onBeforeUnmount(() => picker?.destroy())
</script>

<template>
  <div
    class="jl-input-wrap jl-input-wrap--sm time-picker"
    :data-invalid="invalid || undefined"
    :data-disabled="disabled || undefined"
  >
    <input
      ref="input"
      class="jl-input"
      :value="model"
      :disabled="disabled"
      :aria-invalid="invalid || undefined"
      inputmode="numeric"
      maxlength="5"
      autocomplete="off"
      v-bind="$attrs"
      @input="model = $event.target.value"
    />
    <svg class="time-picker__icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.25" stroke="currentColor" stroke-width="1.5" />
      <path d="M12 7.5V12l3 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
    </svg>
  </div>
</template>

<style scoped>
.time-picker__icon {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  margin-right: var(--space-2);
  color: var(--text-tertiary);
  pointer-events: none;
}
</style>

<style>
.flatpickr-calendar {
  z-index: 130;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  background: var(--surface-overlay);
  box-shadow: var(--shadow-lg);
  font-family: var(--font-sans);
}

.flatpickr-calendar::before,
.flatpickr-calendar::after {
  display: none;
}

.flatpickr-time input,
.flatpickr-time .flatpickr-time-separator {
  color: var(--text-primary);
  font-size: var(--text-md);
}

.flatpickr-time input:hover,
.flatpickr-time input:focus {
  background: var(--accent-subtle);
}

.flatpickr-time .numInputWrapper span.arrowUp::after {
  border-bottom-color: var(--text-secondary);
}

.flatpickr-time .numInputWrapper span.arrowDown::after {
  border-top-color: var(--text-secondary);
}
</style>

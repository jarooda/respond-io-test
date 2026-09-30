<script setup lang="ts">
withDefaults(
  defineProps<{
    label?: string
    hint?: string
    error?: string
    required?: boolean
    optional?: boolean
    htmlFor?: string
  }>(),
  { label: '', hint: '', error: '', required: false, optional: false, htmlFor: undefined },
)
</script>

<template>
  <div class="jl-field">
    <label v-if="label" class="jl-field__label" :for="htmlFor">
      {{ label }}
      <span v-if="required" class="jl-field__req" aria-hidden="true">*</span>
      <span v-if="optional" class="jl-field__optional">(optional)</span>
    </label>
    <slot />
    <div v-if="error" class="jl-field__error" role="alert">{{ error }}</div>
    <div v-else-if="hint" class="jl-field__hint">{{ hint }}</div>
  </div>
</template>

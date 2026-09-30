<script setup>
import { computed, nextTick, ref, watch } from 'vue'

import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { CREATABLE_NODE_TYPES, NODE_TYPES } from '@/constants/nodeTypes'
import {
  DESCRIPTION_MAX_LENGTH,
  TITLE_MAX_LENGTH,
  emptyNodeForm,
  validateNodeForm,
} from '@/utils/nodeForm'

const open = defineModel('open', { type: Boolean, default: false })
const emit = defineEmits(['create'])

const typeOptions = CREATABLE_NODE_TYPES.map((value) => ({ value, label: NODE_TYPES[value].label }))

const form = ref(emptyNodeForm())
const submitted = ref(false)
const errors = computed(() => (submitted.value ? validateNodeForm(form.value) : {}))

watch(open, async (isOpen) => {
  if (!isOpen) return
  form.value = emptyNodeForm()
  submitted.value = false
  await nextTick()
  document.getElementById('new-node-title')?.focus()
})

function submit() {
  submitted.value = true
  if (Object.keys(errors.value).length) return

  emit('create', {
    title: form.value.title.trim(),
    description: form.value.description.trim(),
    type: form.value.type,
  })
  open.value = false
}
</script>

<template>
  <Dialog
    v-model:open="open"
    title="Create new node"
    description="Add a step to this flow. Connect it to other nodes after it's created."
  >
    <form id="new-node-form" class="new-node" novalidate @submit.prevent="submit">
      <Field label="Title" required html-for="new-node-title" :error="errors.title">
        <Input
          id="new-node-title"
          v-model="form.title"
          :invalid="!!errors.title"
          :maxlength="TITLE_MAX_LENGTH"
          placeholder="e.g. Holiday notice"
          autocomplete="off"
        />
      </Field>

      <Field
        label="Description"
        optional
        html-for="new-node-description"
        hint="Shown on the node card. Two lines max."
        :error="errors.description"
      >
        <Textarea
          id="new-node-description"
          v-model="form.description"
          :invalid="!!errors.description"
          :max-length="DESCRIPTION_MAX_LENGTH"
          :maxlength="DESCRIPTION_MAX_LENGTH"
          rows="3"
        />
      </Field>

      <Field label="Type of node" required html-for="new-node-type" :error="errors.type">
        <Select
          id="new-node-type"
          v-model="form.type"
          :options="typeOptions"
          :aria-invalid="!!errors.type"
          placeholder="Select a type"
        />
      </Field>
    </form>

    <template #footer>
      <Button variant="ghost" @click="open = false">Cancel</Button>
      <Button type="submit" form="new-node-form">Create</Button>
    </template>
  </Dialog>
</template>

<style scoped>
.new-node {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.new-node :deep(.jl-select[aria-invalid='true']) {
  border-color: var(--danger);
}
.new-node :deep(.jl-select[aria-invalid='true']:focus-visible) {
  box-shadow: var(--ring-danger);
}
</style>

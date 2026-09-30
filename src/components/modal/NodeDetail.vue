<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { Icon } from '@iconify/vue'

import '@/assets/node-detail.css'
import AddCommentFields from '@/components/detail/AddCommentFields.vue'
import BusinessHoursFields from '@/components/detail/BusinessHoursFields.vue'
import SendMessageFields from '@/components/detail/SendMessageFields.vue'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Drawer } from '@/components/ui/drawer'
import { Field } from '@/components/ui/field'
import { IconButton } from '@/components/ui/icon-button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { DRAWER_WIDTH } from '@/constants/layout'
import { NODE_TYPES } from '@/constants/nodeTypes'
import { draftToPatch, toDraft, validateDraft } from '@/utils/nodeDetail'
import { DESCRIPTION_MAX_LENGTH, TITLE_MAX_LENGTH } from '@/utils/nodeForm'

const SAVE_DELAY_MS = 400

const FIELDS = {
  sendMessage: SendMessageFields,
  addComment: AddCommentFields,
  businessHours: BusinessHoursFields,
}

const props = defineProps({
  item: { type: Object, required: true },
})
const emit = defineEmits(['update', 'delete', 'close'])

const meta = computed(() => NODE_TYPES[props.item.type] ?? NODE_TYPES.addComment)
const fields = computed(() => FIELDS[props.item.type])

/*
 * Autosave: edits go to a local draft; once it's valid and has changed, it's saved after a short
 * pause. `draftItem` pins the item the draft was made from, so switching nodes mid-edit still
 * saves the pending changes to the right node.
 */
let draftItem = props.item
const draft = ref(toDraft(draftItem))
let savedSnapshot = JSON.stringify(draftToPatch(draftItem, draft.value))
let saveTimer = null
const isSaving = ref(false)
const isConfirmingDelete = ref(false)

const errors = computed(() => validateDraft(draftItem.type, draft.value))
const errorCount = computed(() => Object.keys(errors.value).length)

function flush() {
  clearTimeout(saveTimer)
  saveTimer = null
  isSaving.value = false
  if (errorCount.value) return

  const patch = draftToPatch(draftItem, draft.value)
  const snapshot = JSON.stringify(patch)
  if (snapshot === savedSnapshot) return
  savedSnapshot = snapshot
  emit('update', { id: draftItem.id, patch })
}

watch(
  draft,
  () => {
    clearTimeout(saveTimer)
    const unchanged = JSON.stringify(draftToPatch(draftItem, draft.value)) === savedSnapshot
    isSaving.value = !unchanged && !errorCount.value
    if (isSaving.value) saveTimer = setTimeout(flush, SAVE_DELAY_MS)
  },
  { deep: true },
)

function resetDraft(item) {
  draftItem = item
  draft.value = toDraft(item)
  savedSnapshot = JSON.stringify(draftToPatch(item, draft.value))
}

watch(
  () => props.item,
  (item, previous) => {
    // Switched to another node: save what's pending on the old one, then load the new one.
    if (item.id !== previous.id) {
      flush()
      resetDraft(item)
      isConfirmingDelete.value = false
      return
    }

    // Same node, new object: either our own save coming back (or a move/relink, which the
    // drawer doesn't edit), or an outside change such as undo/redo. Only the latter reloads,
    // so the drawer never saves stale values over an undo.
    const incoming = JSON.stringify(draftToPatch(item, toDraft(item)))
    if (incoming === savedSnapshot) {
      draftItem = item
      return
    }
    clearTimeout(saveTimer)
    isSaving.value = false
    resetDraft(item)
  },
)

onBeforeUnmount(flush)

const status = computed(() => {
  if (errorCount.value)
    return {
      tone: 'danger',
      text: `${errorCount.value} error${errorCount.value > 1 ? 's' : ''} to fix before saving`,
    }
  if (isSaving.value) return { tone: 'muted', text: 'Saving…' }
  return { tone: 'success', text: 'All changes saved' }
})

const deleteDescription = computed(
  () =>
    `This removes the node${props.item.type === 'businessHours' ? ', its Success and Failure branches,' : ''} and its connection from the flow. You can undo for a few seconds afterwards.`,
)

function confirmDelete() {
  clearTimeout(saveTimer)
  isConfirmingDelete.value = false
  emit('delete', props.item.id)
}
</script>

<template>
  <Drawer
    class="node-detail"
    open
    :modal="false"
    :show-close="false"
    :size="DRAWER_WIDTH"
    @update:open="(open) => !open && emit('close')"
  >
    <div class="node-detail__header">
      <span class="node-detail__icon" :class="`node-detail__icon--${meta.tone}`">
        <Icon :icon="meta.icon" />
      </span>

      <div class="node-detail__heading">
        <label class="node-detail__type" for="node-title">{{ meta.label }}</label>
        <Input
          id="node-title"
          v-model="draft.title"
          :invalid="!!errors.title"
          :maxlength="TITLE_MAX_LENGTH"
          placeholder="Node title"
          autocomplete="off"
        />
        <p v-if="errors.title" class="detail-error" role="alert">{{ errors.title }}</p>
      </div>

      <IconButton aria-label="Close details" @click="emit('close')">
        <Icon icon="material-symbols:close" />
      </IconButton>
    </div>

    <div class="node-detail__body">
      <Field label="Description" html-for="node-description" :error="errors.description">
        <Textarea
          id="node-description"
          v-model="draft.description"
          :invalid="!!errors.description"
          :maxlength="DESCRIPTION_MAX_LENGTH"
          rows="3"
          auto-resize
          placeholder="Shown on the node card"
        />
      </Field>

      <component :is="fields" v-if="fields" v-model:data="draft.data" :errors="errors" />
    </div>

    <template #footer>
      <Button variant="danger" size="sm" @click="isConfirmingDelete = true">
        <template #icon><Icon icon="material-symbols:delete-outline" /></template>
        Delete node
      </Button>

      <span
        class="node-detail__status"
        :class="`node-detail__status--${status.tone}`"
        aria-live="polite"
      >
        <Icon v-if="status.tone === 'success'" icon="material-symbols:check" />
        {{ status.text }}
      </span>
    </template>
  </Drawer>

  <Dialog
    v-model:open="isConfirmingDelete"
    class="node-detail__confirm"
    size="sm"
    :title="`Delete ${draft.title.trim() || meta.label}?`"
    :description="deleteDescription"
  >
    <template #footer>
      <Button variant="ghost" @click="isConfirmingDelete = false">Cancel</Button>
      <Button variant="danger" @click="confirmDelete">Delete</Button>
    </template>
  </Dialog>
</template>

<style scoped>
/* Floating panel inset from the window edge, matching the design. */
.node-detail :deep(.jl-drawer) {
  height: calc(100% - 2 * var(--space-3));
  margin: var(--space-3);
  overflow: hidden;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-card);
}

.node-detail :deep(.jl-drawer__body) {
  display: flex;
  flex-direction: column;
  padding: 0;
}

.node-detail :deep(.jl-drawer__footer) {
  align-items: center;
  justify-content: space-between;
}

.node-detail__header {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-5) var(--space-5) var(--space-4);
  border-bottom: 1px solid var(--border-subtle);
}

.node-detail__icon {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 36px;
  height: 36px;
  margin-top: 2px;
  border-radius: var(--radius-lg);
  font-size: 20px;
}

.node-detail__icon--warning {
  background: var(--warning-subtle);
  color: var(--warning-text);
}
.node-detail__icon--brand {
  background: var(--accent-subtle);
  color: var(--text-brand);
}
.node-detail__icon--info {
  background: var(--info-subtle);
  color: var(--info-text);
}
.node-detail__icon--neutral {
  background: var(--surface-muted);
  color: var(--text-secondary);
}

.node-detail__heading {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.node-detail__type {
  color: var(--text-tertiary);
  font-size: var(--text-2xs);
  font-weight: var(--weight-semibold);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}

.node-detail__heading :deep(.jl-input) {
  font-size: var(--text-md);
  font-weight: var(--weight-semibold);
}

.node-detail__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--space-6);
  padding: var(--space-5);
  overflow: auto;
}

.node-detail__status {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--text-xs);
}

.node-detail__status--success,
.node-detail__status--muted {
  color: var(--text-tertiary);
}

.node-detail__status--success :deep(svg) {
  color: var(--success);
}

.node-detail__status--danger {
  color: var(--danger-text);
}

/* The JLDS dialog stacks below the drawer by default. */
.node-detail__confirm {
  z-index: 120;
}
</style>

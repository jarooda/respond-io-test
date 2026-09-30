<script setup>
import { nextTick, ref } from 'vue'
import { Icon } from '@iconify/vue'

import { Button } from '@/components/ui/button'
import { IconButton } from '@/components/ui/icon-button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/components/ui/toast'
import {
  ATTACHMENT_TYPES,
  MESSAGE_MAX_LENGTH,
  getAttachmentError,
  nextKey,
} from '@/utils/nodeDetail'

const data = defineModel('data', { type: Object, required: true })
defineProps({
  errors: { type: Object, default: () => ({}) },
})

const isDragging = ref(false)
const brokenImages = ref(new Set())

async function addText() {
  const key = nextKey()
  data.value.texts.push({ key, text: '' })
  await nextTick()
  document.getElementById(`message-${key}`)?.focus()
}

function removeText(key) {
  data.value.texts = data.value.texts.filter((entry) => entry.key !== key)
}

function addFiles(fileList) {
  for (const file of fileList) {
    const error = getAttachmentError(file)
    if (error) {
      toast.warning(error)
      continue
    }
    data.value.attachments.push({ key: nextKey(), url: URL.createObjectURL(file), name: file.name })
  }
}

function onFileInput(event) {
  addFiles(event.target.files)
  event.target.value = ''
}

function onDrop(event) {
  isDragging.value = false
  addFiles(event.dataTransfer?.files ?? [])
}

function removeAttachment(key) {
  data.value.attachments = data.value.attachments.filter((entry) => entry.key !== key)
}

function markBroken(key) {
  brokenImages.value = new Set(brokenImages.value).add(key)
}
</script>

<template>
  <section class="detail-section">
    <header class="detail-section__header">
      <h3 class="detail-section__title">Messages</h3>
      <span class="detail-section__meta">{{ data.texts.length }}</span>
    </header>

    <div v-for="(entry, index) in data.texts" :key="entry.key" class="message">
      <div class="message__row">
        <Textarea
          :id="`message-${entry.key}`"
          v-model="entry.text"
          :invalid="!!errors[`text.${entry.key}`]"
          :maxlength="MESSAGE_MAX_LENGTH"
          :aria-label="`Message ${index + 1}`"
          auto-resize
          rows="3"
        />
        <IconButton
          size="sm"
          :aria-label="`Remove message ${index + 1}`"
          @click="removeText(entry.key)"
        >
          <Icon icon="material-symbols:delete-outline" />
        </IconButton>
      </div>
      <p v-if="errors[`text.${entry.key}`]" class="detail-error" role="alert">
        {{ errors[`text.${entry.key}`] }}
      </p>
    </div>

    <div>
      <Button variant="secondary" size="sm" @click="addText">
        <template #icon><Icon icon="material-symbols:add" /></template>
        Add text
      </Button>
    </div>
  </section>

  <section class="detail-section">
    <header class="detail-section__header">
      <h3 class="detail-section__title">Attachments</h3>
      <span class="detail-section__meta">PNG, JPG · up to 5 MB</span>
    </header>

    <div class="attachments">
      <figure v-for="entry in data.attachments" :key="entry.key" class="attachment">
        <div class="attachment__preview">
          <Icon v-if="brokenImages.has(entry.key)" icon="material-symbols:image-outline" />
          <img
            v-else
            :src="entry.url"
            :alt="entry.name"
            loading="lazy"
            @error="markBroken(entry.key)"
          />
        </div>
        <figcaption class="attachment__name" :title="entry.name">{{ entry.name }}</figcaption>
        <IconButton
          class="attachment__remove"
          variant="secondary"
          size="sm"
          round
          :aria-label="`Remove ${entry.name}`"
          @click="removeAttachment(entry.key)"
        >
          <Icon icon="material-symbols:close" />
        </IconButton>
      </figure>

      <label
        class="upload-tile"
        :class="{ 'upload-tile--active': isDragging }"
        @dragover.prevent="isDragging = true"
        @dragleave="isDragging = false"
        @drop.prevent="onDrop"
      >
        <input
          class="upload-tile__input"
          type="file"
          :accept="ATTACHMENT_TYPES.join(',')"
          multiple
          @change="onFileInput"
        />
        <Icon icon="material-symbols:upload" class="upload-tile__icon" />
        <span>Drop image or <span class="upload-tile__browse">browse</span></span>
      </label>
    </div>
  </section>
</template>

<style scoped>
.message {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.message__row {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
}

.message__row > :first-child {
  flex: 1;
}

.attachments {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(104px, 1fr));
  gap: var(--space-3);
}

.attachment {
  position: relative;
  margin: 0;
  overflow: hidden;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-lg);
  background: var(--surface-card);
}

.attachment__preview {
  display: grid;
  place-items: center;
  aspect-ratio: 1 / 0.75;
  background: var(--surface-muted);
  color: var(--text-tertiary);
  font-size: 24px;
}

.attachment__preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.attachment__name {
  overflow: hidden;
  padding: var(--space-1) var(--space-2);
  color: var(--text-secondary);
  font-size: var(--text-2xs);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.attachment__remove {
  position: absolute;
  top: var(--space-1);
  right: var(--space-1);
  opacity: 0;
  transition: opacity var(--duration-fast) var(--ease-standard);
}

.attachment:hover .attachment__remove,
.attachment__remove:focus-visible {
  opacity: 1;
}

.upload-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  min-height: 104px;
  padding: var(--space-2);
  border: 1px dashed var(--border-strong);
  border-radius: var(--radius-lg);
  color: var(--text-secondary);
  font-size: var(--text-xs);
  text-align: center;
  cursor: pointer;
  transition: var(--transition-control);
}

.upload-tile:hover,
.upload-tile--active,
.upload-tile:focus-within {
  border-color: var(--border-focus);
  background: var(--accent-subtle);
}

.upload-tile__input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
}

.upload-tile__icon {
  font-size: 20px;
}

.upload-tile__browse {
  color: var(--text-brand);
  font-weight: var(--weight-semibold);
}
</style>

<script setup>
import { Icon } from '@iconify/vue'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { COMMENT_MAX_LENGTH } from '@/utils/nodeDetail'

const data = defineModel('data', { type: Object, required: true })
defineProps({
  errors: { type: Object, default: () => ({}) },
})
</script>

<template>
  <section class="detail-section">
    <header class="detail-section__header">
      <h3 class="detail-section__title">
        <label for="node-comment">Comment</label>
      </h3>
      <Button variant="ghost" size="sm" :disabled="!data.comment" @click="data.comment = ''">
        <template #icon><Icon icon="material-symbols:close" /></template>
        Clear
      </Button>
    </header>

    <Textarea
      id="node-comment"
      v-model="data.comment"
      :invalid="!!errors.comment"
      :maxlength="COMMENT_MAX_LENGTH"
      rows="5"
      auto-resize
      placeholder="Leave a note for your team"
    />
    <p v-if="errors.comment" class="detail-error" role="alert">{{ errors.comment }}</p>
    <p v-else class="detail-hint">
      <Icon icon="material-symbols:lock-outline" />
      Internal only. Contacts never see comments.
    </p>
  </section>
</template>

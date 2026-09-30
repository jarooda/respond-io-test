<script setup>
import { ref } from 'vue'
import { Icon } from '@iconify/vue'
import IconButton from '../ui/icon-button/IconButton.vue'
import Divider from '../ui/divider/Divider.vue'
import Button from '../ui/button/Button.vue'
import NewNode from '../modal/NewNode.vue'
import { useFlowHistory } from '@/composables/useFlowHistory'

const emit = defineEmits(['create'])

const isNewNodeOpen = ref(false)

const { canUndo, canRedo, undo, redo } = useFlowHistory()
const isMac = /Mac|iPhone|iPad/.test(navigator.platform)
const undoHint = isMac ? 'Undo (⌘Z)' : 'Undo (Ctrl+Z)'
const redoHint = isMac ? 'Redo (⇧⌘Z)' : 'Redo (Ctrl+Shift+Z)'
</script>

<template>
  <div class="header-wrapper">
    <div class="header-undo-redo">
      <IconButton :disabled="!canUndo" :aria-label="undoHint" :title="undoHint" @click="undo">
        <Icon icon="material-symbols:undo" />
      </IconButton>
      <IconButton :disabled="!canRedo" :aria-label="redoHint" :title="redoHint" @click="redo">
        <Icon icon="material-symbols:redo" />
      </IconButton>
    </div>
    <Divider orientation="vertical" />
    <Button @click="isNewNodeOpen = true">
      <div class="button-text-position">
        <Icon icon="material-symbols:add" />
        <span> Create New Node </span>
      </div>
    </Button>
  </div>

  <NewNode v-model:open="isNewNodeOpen" @create="emit('create', $event)" />
</template>

<style scoped>
.header-wrapper {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
  display: flex;
  background-color: var(--neutral-0);
  border-radius: 10px;
  padding: 8px;
}

.header-undo-redo {
  display: flex;
}
</style>

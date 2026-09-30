<script setup>
import { computed, nextTick, watch } from 'vue'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@vue-flow/controls/dist/style.css'
import '@vue-flow/minimap/dist/style.css'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { toast } from '@/components/ui/toast'
import { provideConnectionValidator } from '@/composables/useConnectionValidator'
import { useFlowHistory, useUndoRedoShortcuts } from '@/composables/useFlowHistory'
import { useFlowMutations } from '@/composables/useFlowMutations'
import { useNodeDrawer } from '@/composables/useNodeDrawer'
import { useFlowQuery } from '@/composables/useFlowQuery'
import { DRAWER_SPACE, FOCUS_DURATION_MS } from '@/constants/layout'
import { getNodeTone } from '@/constants/nodeTypes'
import { getEnterNodeId, getKeyboardMoves } from '@/utils/canvasEvents'
import { getConnectionError } from '@/utils/flowConnect'
import { CARD_HEIGHT, NODE_WIDTH, toFlowElements } from '@/utils/flowTransform'
import { getCoveredRight, getFocusCenter } from '@/utils/viewport'

import FloatingHeader from '@/components/header/FloatingHeader.vue'
import ConnectorNode from '@/components/flow/ConnectorNode.vue'
import FlowNode from '@/components/flow/FlowNode.vue'
import NodeDetail from '@/components/modal/NodeDetail.vue'

const { data, isPending, isError, error, refetch } = useFlowQuery()

const { createNode, connectNodes, moveNodes, updateNode, deleteNode } = useFlowMutations()
const history = useFlowHistory()
useUndoRedoShortcuts(history)
const { screenToFlowCoordinate, setCenter, getViewport, findNode, onInit } = useVueFlow()
const drawer = useNodeDrawer(data)

// Opening a node glides the camera so the node sits in the middle of the canvas left of the drawer.
function focusNode(id) {
  const node = findNode(id)
  if (!node) return
  const { zoom } = getViewport()
  const coveredRight = getCoveredRight(DRAWER_SPACE, window.innerWidth)
  const { x, y } = getFocusCenter(node.position, { zoom, coveredRight })
  setCenter(x, y, { zoom, duration: FOCUS_DURATION_MS })
}

watch(
  () => drawer.openItem.value?.id,
  (id) => id != null && focusNode(String(id)),
  { flush: 'post' },
)

// Direct links (?node=…): wait for the initial fit-view, then focus the node.
onInit(() => nextTick(() => drawer.openItem.value && focusNode(String(drawer.openItem.value.id))))

const elements = computed(() => toFlowElements(data.value))

// Live feedback while dragging a connection; the mutation re-validates on drop.
provideConnectionValidator(
  ({ source, target }) => !getConnectionError(data.value ?? [], source, target),
)

async function handleConnect({ source, target }) {
  try {
    await connectNodes.mutateAsync({ source, target })
  } catch (err) {
    toast.danger(err.message)
  }
}

function handleDragStop({ nodes }) {
  moveNodes.mutate(nodes.map(({ id, position }) => ({ id, position })))
}

// Arrow keys move a selected node without a drag, so there's no drag-stop: save those moves here.
function handleNodesChange(changes) {
  const moves = getKeyboardMoves(changes)
  if (moves.length) moveNodes.mutate(moves)
}

// Enter on a focused node opens its details (Vue Flow's own Enter only selects it).
function handleCanvasKeydown(event) {
  const id = getEnterNodeId(event)
  if (!id) return
  event.preventDefault()
  drawer.open(id)
}

// New nodes appear in the middle of what the user is looking at (the canvas fills the window).
function viewportCenter() {
  const center = screenToFlowCoordinate({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
  return { x: center.x - NODE_WIDTH / 2, y: center.y - CARD_HEIGHT / 2 }
}

async function handleCreate(form) {
  try {
    await createNode.mutateAsync({ ...form, position: viewportCenter() })
    toast.success(`"${form.title}" created`)
  } catch {
    toast.danger("Couldn't create the node. Please try again.")
  }
}

function handleNodeClick({ node }) {
  if (node.type === 'flow') drawer.toggle(node.id)
}

function handleUpdate({ id, patch }) {
  updateNode.mutate({ id, patch })
}

async function handleDelete(id) {
  const item = drawer.openItem.value
  const name = item?.name ?? 'Node'
  try {
    await deleteNode.mutateAsync(id)
    await drawer.close({ replace: true })
    toast.success(`"${name}" deleted`, {
      action: { label: 'Undo', onClick: history.undo },
    })
  } catch {
    toast.danger("Couldn't delete the node. Please try again.")
  }
}

const headerOffset = `${DRAWER_SPACE + 16}px`

// The minimap renders `fill` as an SVG attribute, which can't resolve CSS vars, so tone via class.
const minimapNodeClass = (node) => `minimap-node--${getNodeTone(node.data.node)}`
</script>

<template>
  <main
    class="canvas"
    :class="{ 'canvas--drawer-open': drawer.isOpen.value }"
    @keydown="handleCanvasKeydown"
  >
    <FloatingHeader @create="handleCreate" />

    <div v-if="isPending" class="canvas__state">
      <Spinner size="lg" />
    </div>

    <div v-else-if="isError" class="canvas__state">
      <Alert tone="danger" title="Couldn't load the flow">
        {{ error.message }}
        <Button size="sm" @click="refetch()">Retry</Button>
      </Alert>
    </div>

    <VueFlow
      v-else
      :nodes="elements.nodes"
      :edges="elements.edges"
      fit-view-on-init
      @connect="handleConnect"
      @node-drag-stop="handleDragStop"
      @nodes-change="handleNodesChange"
      @node-click="handleNodeClick"
      @pane-click="drawer.close()"
      :min-zoom="0.2"
      :max-zoom="4"
    >
      <template #node-flow="{ id, data, selected }">
        <FlowNode :data="data" :selected="selected || drawer.nodeId.value === id" />
      </template>

      <template #node-connector="{ data }">
        <ConnectorNode :data="data" />
      </template>

      <Background pattern-color="#aaa" :gap="16" />

      <MiniMap :node-class-name="minimapNodeClass" pannable zoomable />

      <Controls position="bottom-left"> </Controls>
    </VueFlow>

    <NodeDetail
      v-if="drawer.openItem.value"
      :item="drawer.openItem.value"
      @update="handleUpdate"
      @delete="handleDelete"
      @close="drawer.close()"
    />
  </main>
</template>

<style scoped>
.canvas {
  width: 100vw;
  height: 100vh;
}

.canvas__state {
  display: grid;
  place-items: center;
  height: 100%;
}

.canvas :deep(.header-wrapper) {
  transition: right var(--duration-base) var(--ease-standard);
}
.canvas--drawer-open :deep(.header-wrapper) {
  right: calc(v-bind(headerOffset));
}

.canvas :deep(.vue-flow__node-flow) {
  cursor: pointer;
}

.canvas :deep(.vue-flow__node-connector) {
  pointer-events: none;
}
.canvas :deep(.vue-flow__node-connector .jl-badge) {
  pointer-events: all;
  cursor: grab;
}

.canvas :deep(.minimap-node--warning) {
  fill: var(--warning);
}
.canvas :deep(.minimap-node--brand) {
  fill: var(--accent);
}
.canvas :deep(.minimap-node--info) {
  fill: var(--info);
}
.canvas :deep(.minimap-node--neutral) {
  fill: var(--text-tertiary);
}
.canvas :deep(.minimap-node--success) {
  fill: var(--success);
}
.canvas :deep(.minimap-node--danger) {
  fill: var(--danger);
}
</style>

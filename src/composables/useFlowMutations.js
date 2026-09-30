import { useMutation, useQueryClient } from '@tanstack/vue-query'

import { queryKeys } from '@/config/query'
import { useTrackingStore } from '@/stores/tracking'
import { getConnectionError, reparentNode } from '@/utils/flowConnect'
import { removeNode, updateNode as applyNodePatch } from '@/utils/flowEdit'
import { applyLayout } from '@/utils/flowTransform'
import { buildNewNodes } from '@/utils/nodeFactory'

const samePosition = (a, b) => a?.x === b.x && a?.y === b.y

export function useFlowMutations() {
  const queryClient = useQueryClient()
  const history = useTrackingStore()

  /** Applies an immutable update to the cached flow and records the previous flow for undo. */
  function commit(update) {
    const current = queryClient.getQueryData(queryKeys.flow) ?? []
    const next = update(current)
    if (next === current) return
    history.record(current)
    queryClient.setQueryData(queryKeys.flow, next)
  }

  const createNode = useMutation({
    mutationFn: async ({ position, ...form }) => {
      const current = queryClient.getQueryData(queryKeys.flow) ?? []
      return buildNewNodes(
        form,
        current.map((item) => item.id),
        { position },
      )
    },
    // applyLayout only fills positions for items created without one.
    onSuccess: (created) => commit((items) => applyLayout([...items, ...created])),
  })

  const connectNodes = useMutation({
    mutationFn: async ({ source, target }) => {
      const current = queryClient.getQueryData(queryKeys.flow) ?? []
      const error = getConnectionError(current, source, target)
      if (error) throw new Error(error)
      // Keep the parent's original id (the trigger's id is numeric in the payload).
      const parent = current.find((item) => String(item.id) === String(source))
      return { target, parentId: parent.id }
    },
    onSuccess: ({ target, parentId }) => commit((items) => reparentNode(items, target, parentId)),
  })

  /** Saves dragged positions: `moves` is `[{ id, position }]` (several when multi-dragging). */
  const moveNodes = useMutation({
    mutationFn: async (moves) => moves,
    onSuccess: (moves) => {
      const byId = new Map(moves.map(({ id, position }) => [String(id), position]))
      commit((items) => {
        let moved = false
        const next = items.map((item) => {
          const position = byId.get(String(item.id))
          if (!position || samePosition(item.position, position)) return item
          moved = true
          return { ...item, position: { x: position.x, y: position.y } }
        })
        // A drag that ends where it started is not worth an undo step.
        return moved ? next : items
      })
    },
  })

  /** Saves edits from the details drawer: `{ id, patch }` (see `draftToPatch`). */
  const updateNode = useMutation({
    mutationFn: async (variables) => variables,
    onSuccess: ({ id, patch }) => commit((items) => applyNodePatch(items, id, patch)),
  })

  const deleteNode = useMutation({
    mutationFn: async (id) => id,
    onSuccess: (id) => commit((items) => removeNode(items, id)),
  })

  return { createNode, connectNodes, moveNodes, updateNode, deleteNode }
}

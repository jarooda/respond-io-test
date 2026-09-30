import { describe, expect, it } from 'vitest'
import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'

import { queryKeys } from '@/config/query'
import { useFlowMutations } from '@/composables/useFlowMutations'
import { useTrackingStore } from '@/stores/tracking'

function setup(initial) {
  const queryClient = new QueryClient()
  queryClient.setQueryData(queryKeys.flow, initial)

  let mutations
  let history
  mount(
    defineComponent({
      setup() {
        mutations = useFlowMutations()
        history = useTrackingStore()
        return () => null
      },
    }),
    { global: { plugins: [createPinia(), [VueQueryPlugin, { queryClient }]] } },
  )
  return { queryClient, history, ...mutations }
}

describe('useFlowMutations › createNode', () => {
  it('appends the created node at the given position without moving others', async () => {
    const existing = [{ id: 1, parentId: -1, type: 'trigger', data: {}, position: { x: 5, y: 5 } }]
    const { queryClient, createNode } = setup(existing)

    await createNode.mutateAsync({
      title: 'Note',
      description: '',
      type: 'addComment',
      position: { x: 300, y: 400 },
    })

    const flow = queryClient.getQueryData(queryKeys.flow)
    expect(flow).toHaveLength(2)
    expect(flow[0]).toBe(existing[0])
    expect(flow[1]).toMatchObject({
      name: 'Note',
      type: 'addComment',
      parentId: -1,
      position: { x: 300, y: 400 },
    })
  })

  it('lays out a node created without a position', async () => {
    const { queryClient, createNode } = setup([])

    await createNode.mutateAsync({ title: 'Note', description: '', type: 'addComment' })

    expect(queryClient.getQueryData(queryKeys.flow)[0].position).toEqual(expect.any(Object))
  })

  it('appends connectors along with a business hours node', async () => {
    const { queryClient, createNode } = setup([])

    await createNode.mutateAsync({ title: 'Hours', description: '', type: 'businessHours' })

    const types = queryClient.getQueryData(queryKeys.flow).map((item) => item.type)
    expect(types).toEqual(['businessHours', 'dateTimeConnector', 'dateTimeConnector'])
  })
})

describe('useFlowMutations › connectNodes', () => {
  const trigger = { id: 1, parentId: -1, type: 'trigger', data: {} }
  const comment = { id: 'aaa111', parentId: -1, type: 'addComment', data: {} }

  it("sets the target's parentId to the source's original id", async () => {
    const { queryClient, connectNodes } = setup([trigger, comment])

    await connectNodes.mutateAsync({ source: '1', target: 'aaa111' })

    const moved = queryClient.getQueryData(queryKeys.flow).find((item) => item.id === 'aaa111')
    expect(moved.parentId).toBe(1)
  })

  it('rejects invalid connections without touching the cache', async () => {
    const initial = [trigger, comment]
    const { queryClient, connectNodes } = setup(initial)

    await expect(connectNodes.mutateAsync({ source: 'aaa111', target: '1' })).rejects.toThrow(
      'The trigger must stay at the start of the flow',
    )
    expect(queryClient.getQueryData(queryKeys.flow)).toBe(initial)
  })
})

describe('useFlowMutations › moveNodes', () => {
  it('saves plain positions for every moved node and leaves others alone', async () => {
    const a = { id: 1, parentId: -1, type: 'trigger', position: { x: 0, y: 0 } }
    const b = { id: 'bbb', parentId: 1, type: 'addComment', position: { x: 0, y: 100 } }
    const c = { id: 'ccc', parentId: 1, type: 'addComment', position: { x: 300, y: 100 } }
    const { queryClient, moveNodes } = setup([a, b, c])

    const dragged = { x: 50, y: 60, extra: 'ignored' }
    await moveNodes.mutateAsync([
      { id: '1', position: dragged },
      { id: 'bbb', position: { x: 70, y: 80 } },
    ])

    const [nextA, nextB, nextC] = queryClient.getQueryData(queryKeys.flow)
    expect(nextA.position).toEqual({ x: 50, y: 60 })
    expect(nextA.position).not.toBe(dragged)
    expect(nextB.position).toEqual({ x: 70, y: 80 })
    expect(nextC).toBe(c)
  })

  it('keeps positions when a node is relinked afterwards', async () => {
    const trigger = { id: 1, parentId: -1, type: 'trigger', position: { x: 0, y: 0 } }
    const comment = { id: 'aaa111', parentId: -1, type: 'addComment', position: { x: 0, y: 0 } }
    const { queryClient, moveNodes, connectNodes } = setup([trigger, comment])

    await moveNodes.mutateAsync([{ id: 'aaa111', position: { x: 640, y: 320 } }])
    await connectNodes.mutateAsync({ source: '1', target: 'aaa111' })

    const moved = queryClient.getQueryData(queryKeys.flow).find((item) => item.id === 'aaa111')
    expect(moved).toMatchObject({ parentId: 1, position: { x: 640, y: 320 } })
  })
})

describe('useFlowMutations › history', () => {
  const trigger = { id: 1, parentId: -1, type: 'trigger', data: {}, position: { x: 0, y: 0 } }
  const comment = {
    id: 'aaa111',
    parentId: 1,
    type: 'addComment',
    name: 'Note',
    data: { comment: '' },
    position: { x: 0, y: 200 },
  }

  it('records the flow as it was before each change', async () => {
    const initial = [trigger, comment]
    const { history, updateNode, deleteNode } = setup(initial)

    await updateNode.mutateAsync({ id: 'aaa111', patch: { name: 'Renamed' } })
    await deleteNode.mutateAsync('aaa111')

    expect(history.past).toHaveLength(2)
    expect(history.past[0]).toBe(initial)
    expect(history.past[1].find((item) => item.id === 'aaa111').name).toBe('Renamed')
  })

  it('does not record a drag that ends where it started', async () => {
    const { history, moveNodes } = setup([trigger, comment])

    await moveNodes.mutateAsync([{ id: 'aaa111', position: { x: 0, y: 200 } }])

    expect(history.canUndo).toBe(false)
  })

  it('does not record rejected connections', async () => {
    const { history, connectNodes } = setup([trigger, comment])

    await expect(connectNodes.mutateAsync({ source: 'aaa111', target: '1' })).rejects.toThrow(
      'The trigger must stay at the start of the flow',
    )

    expect(history.canUndo).toBe(false)
  })

  it('clears redo when a new change is made', async () => {
    const { history, updateNode } = setup([trigger, comment])
    history.future = [[trigger]]

    await updateNode.mutateAsync({ id: 'aaa111', patch: { name: 'Again' } })

    expect(history.canRedo).toBe(false)
  })
})

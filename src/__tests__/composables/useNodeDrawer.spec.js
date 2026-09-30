import { afterEach, describe, expect, it } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'

import { useNodeDrawer } from '@/composables/useNodeDrawer'

const flow = [
  { id: 1, parentId: -1, type: 'trigger' },
  { id: 'd09c08', parentId: 1, type: 'businessHours' },
  { id: '161f52', parentId: 'd09c08', type: 'dateTimeConnector' },
]

let wrapper

async function setup(path = '/', items = flow) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', name: 'canvas', component: defineComponent(() => () => h('div')) }],
  })
  router.push(path)
  await router.isReady()

  const data = ref(items)
  let drawer
  wrapper = mount(
    defineComponent({
      setup() {
        drawer = useNodeDrawer(data)
        return () => null
      },
    }),
    { global: { plugins: [router] } },
  )
  await flushPromises()
  return { router, data, drawer }
}

afterEach(() => wrapper?.unmount())

describe('useNodeDrawer', () => {
  it('is closed without a node in the URL', async () => {
    const { drawer } = await setup('/')
    expect(drawer.isOpen.value).toBe(false)
    expect(drawer.openItem.value).toBeNull()
  })

  it('opens the node named in the URL, matching numeric ids as strings', async () => {
    const { drawer } = await setup('/?node=1')
    expect(drawer.openItem.value).toEqual(flow[0])
    expect(drawer.nodeId.value).toBe('1')
  })

  it('open() and close() update the URL and keep other query params', async () => {
    const { router, drawer } = await setup('/?zoom=2')

    await drawer.open('d09c08')
    expect(router.currentRoute.value.query).toEqual({ zoom: '2', node: 'd09c08' })
    expect(drawer.isOpen.value).toBe(true)

    await drawer.close()
    expect(router.currentRoute.value.query).toEqual({ zoom: '2' })
  })

  it('toggle() closes the node that is already open', async () => {
    const { router, drawer } = await setup('/?node=d09c08')
    await drawer.toggle('d09c08')
    expect(router.currentRoute.value.query.node).toBeUndefined()

    await drawer.toggle('d09c08')
    expect(router.currentRoute.value.query.node).toBe('d09c08')
  })

  it('pushes history entries so Back closes the drawer', async () => {
    const { router, drawer } = await setup('/')
    await drawer.open('d09c08')
    router.back()
    await flushPromises()
    await nextTick()
    expect(drawer.isOpen.value).toBe(false)
  })

  it.each([
    ['unknown ids', 'nope'],
    ['Success/Failure connectors', '161f52'],
  ])('drops %s from the URL', async (_, id) => {
    const { router, drawer } = await setup(`/?node=${id}`)
    expect(router.currentRoute.value.query.node).toBeUndefined()
    expect(drawer.isOpen.value).toBe(false)
  })

  it('waits for the data before judging the id', async () => {
    const { router, data, drawer } = await setup('/?node=d09c08', null)
    expect(router.currentRoute.value.query.node).toBe('d09c08')

    data.value = flow
    await flushPromises()
    expect(drawer.openItem.value).toEqual(flow[1])
  })

  it('closes when the open node is deleted', async () => {
    const { router, data } = await setup('/?node=d09c08')
    data.value = flow.filter((item) => item.id !== 'd09c08')
    await flushPromises()
    expect(router.currentRoute.value.query.node).toBeUndefined()
  })
})

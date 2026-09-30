import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import ConnectorNode from '@/components/flow/ConnectorNode.vue'
import { HandleStub } from '../helpers'

const mountConnector = (connectorType, name) =>
  mount(ConnectorNode, {
    props: {
      data: { node: { id: 'c', type: 'dateTimeConnector', name, data: { connectorType } } },
    },
    global: { stubs: { Handle: HandleStub } },
  })

describe('ConnectorNode', () => {
  it.each([
    ['success', 'Success', 'jl-badge--success'],
    ['failure', 'Failure', 'jl-badge--danger'],
  ])('renders a %s pill', (connectorType, name, colorClass) => {
    const badge = mountConnector(connectorType, name).find('.jl-badge')
    expect(badge.text()).toBe(name)
    expect(badge.classes()).toContain(colorClass)
    expect(badge.find('.jl-badge__dot').exists()).toBe(true)
  })

  it('falls back to neutral for unknown connector types', () => {
    expect(mountConnector('other', 'Other').find('.jl-badge').classes()).toContain(
      'jl-badge--neutral',
    )
  })

  it('only lets connections start from its outgoing handle', () => {
    const handles = mountConnector('success', 'Success')
      .findAll('.handle-stub')
      .map((h) => [h.attributes('data-type'), h.attributes('data-connectable')])
    expect(handles).toEqual([
      ['target', 'false'],
      ['source', 'true'],
    ])
  })
})

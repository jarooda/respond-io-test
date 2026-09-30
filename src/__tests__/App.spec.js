import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'

import App from '../App.vue'

describe('App', () => {
  it('renders the current route and the toaster', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', component: defineComponent(() => () => h('p', 'Canvas page')) }],
    })
    router.push('/')
    await router.isReady()

    const wrapper = mount(App, { global: { plugins: [router] } })

    expect(wrapper.text()).toContain('Canvas page')
    expect(wrapper.find('.jl-toaster').exists()).toBe(true)
  })
})

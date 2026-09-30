import { defineComponent, h } from 'vue'

/** Iconify fetches icons over the network; tests only need to know which icon was asked for. */
export const IconStub = defineComponent({
  name: 'IconStub',
  props: { icon: { type: String, default: '' } },
  setup: (props) => () => h('i', { 'data-icon': props.icon }),
})

/** Vue Flow's Handle needs a surrounding <VueFlow>; the stub records its props instead. */
export const HandleStub = defineComponent({
  name: 'HandleStub',
  props: {
    type: { type: String, default: '' },
    position: { type: String, default: '' },
    connectable: { type: Boolean, default: true },
    isValidConnection: { type: Function, default: undefined },
  },
  setup: (props) => () =>
    h('div', {
      class: 'handle-stub',
      'data-type': props.type,
      'data-connectable': String(props.connectable),
    }),
})

export const findButton = (wrapper, text) =>
  wrapper.findAll('button').find((button) => button.text().trim() === text)

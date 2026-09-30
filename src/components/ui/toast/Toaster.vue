<script lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'

export type ToastTone = 'success' | 'warning' | 'danger' | 'info' | 'loading'

export interface ToastOptions {
  title?: string
  description?: string
  tone?: ToastTone
  duration?: number
  action?: { label: string; onClick?: () => void }
  id?: number
}

export interface ToastRecord extends ToastOptions {
  id: number
}

let _id = 0
export const toasts = ref<ToastRecord[]>([])

function add(opts: ToastOptions): number {
  const id = opts.id ?? ++_id
  toasts.value = [...toasts.value.filter((t) => t.id !== id), { ...opts, id }]
  return id
}

export function removeToast(id: number) {
  toasts.value = toasts.value.filter((t) => t.id !== id)
}

export const toast = Object.assign(
  (opts: ToastOptions | string) => add(typeof opts === 'string' ? { description: opts } : opts),
  {
    success: (description: string, opts?: ToastOptions) =>
      add({ tone: 'success', description, ...opts }),
    warning: (description: string, opts?: ToastOptions) =>
      add({ tone: 'warning', description, ...opts }),
    danger: (description: string, opts?: ToastOptions) =>
      add({ tone: 'danger', description, ...opts }),
    info: (description: string, opts?: ToastOptions) => add({ tone: 'info', description, ...opts }),
    loading: (description: string, opts?: ToastOptions) =>
      add({ tone: 'loading', description, duration: Infinity, ...opts }),
    promise: <T,>(
      promise: Promise<T> | (() => Promise<T>),
      msgs: {
        loading?: string
        success?: string | ((data: T) => string)
        error?: string | ((err: unknown) => string)
      } = {},
    ) => {
      const id = add({
        tone: 'loading',
        description: msgs.loading ?? 'Loading…',
        duration: Infinity,
      })
      const p = typeof promise === 'function' ? promise() : promise
      Promise.resolve(p)
        .then((data) => {
          const m = typeof msgs.success === 'function' ? msgs.success(data) : msgs.success
          add({ id, tone: 'success', description: m ?? 'Done', duration: 4500 })
        })
        .catch((err) => {
          const m = typeof msgs.error === 'function' ? msgs.error(err) : msgs.error
          add({ id, tone: 'danger', description: m ?? 'Something went wrong', duration: 4500 })
        })
      return id
    },
    dismiss: (id: number) => removeToast(id),
  },
)
</script>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'top-center'
  }>(),
  { position: 'bottom-right' },
)

const leaving = ref<Set<number>>(new Set())
const scheduled = new Set<number>()
const timers = new Map<number, ReturnType<typeof setTimeout>>()

function dismiss(id: number) {
  const next = new Set(leaving.value)
  next.add(id)
  leaving.value = next
  setTimeout(() => {
    removeToast(id)
    scheduled.delete(id)
    timers.delete(id)
  }, 180)
}
function onAction(t: ToastRecord) {
  t.action?.onClick?.()
  dismiss(t.id)
}

watch(
  toasts,
  (list) => {
    list.forEach((t) => {
      if (scheduled.has(t.id)) return
      scheduled.add(t.id)
      if (t.duration === Infinity || t.duration === 0) return
      timers.set(
        t.id,
        setTimeout(() => dismiss(t.id), t.duration ?? 4500),
      )
    })
  },
  { deep: true, immediate: true },
)
onBeforeUnmount(() => timers.forEach((tm) => clearTimeout(tm)))

const ordered = computed(() =>
  props.position.startsWith('top') ? [...toasts.value].reverse() : toasts.value,
)
</script>

<template>
  <div class="jl-toaster" :data-pos="position">
    <div
      v-for="t in ordered"
      :key="t.id"
      class="jl-toast"
      :class="t.tone ? `jl-toast--${t.tone}` : ''"
      role="status"
      :data-leaving="leaving.has(t.id) || undefined"
    >
      <span v-if="t.tone === 'loading'" class="jl-toast__icon">
        <span class="jl-toast__spin" aria-hidden="true" />
      </span>
      <span v-else-if="t.tone" class="jl-toast__icon">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6" opacity="0.35" />
          <template v-if="t.tone === 'success'">
            <path
              d="M8 12.5l2.5 2.5 5.5-6"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
          </template>
          <template v-else-if="t.tone === 'warning'">
            <path d="M12 8.5v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
            <circle cx="12" cy="16" r="0.6" fill="currentColor" stroke="none" />
          </template>
          <template v-else-if="t.tone === 'danger'">
            <path d="M12 8v4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
            <circle cx="12" cy="16" r="0.6" fill="currentColor" stroke="none" />
          </template>
          <template v-else>
            <path d="M12 11v5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" />
            <circle cx="12" cy="8" r="0.7" fill="currentColor" stroke="none" />
          </template>
        </svg>
      </span>
      <div class="jl-toast__body">
        <div v-if="t.title" class="jl-toast__title">{{ t.title }}</div>
        <div v-if="t.description" class="jl-toast__desc">{{ t.description }}</div>
        <button v-if="t.action" type="button" class="jl-toast__action" @click="onAction(t)">
          {{ t.action.label }}
        </button>
      </div>
      <button type="button" class="jl-toast__close" aria-label="Dismiss" @click="dismiss(t.id)">
        <svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true">
          <path
            d="M4 4l8 8M12 4l-8 8"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
          />
        </svg>
      </button>
    </div>
  </div>
</template>

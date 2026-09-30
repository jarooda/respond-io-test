import { vi } from 'vitest'

// Iconify loads icon data over the network; swap in a stub that just records the icon name.
vi.mock('@iconify/vue', async () => ({ Icon: (await import('./helpers')).IconStub }))

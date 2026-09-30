export const NODE_TYPES = {
  trigger: {
    label: 'Trigger',
    icon: 'material-symbols:electric-bolt',
    tone: 'warning',
  },
  sendMessage: {
    label: 'Send Message',
    icon: 'material-symbols:chat',
    tone: 'brand',
  },
  addComment: {
    label: 'Add Comment',
    icon: 'material-symbols:comment',
    tone: 'info',
  },
  businessHours: {
    label: 'Business Hours',
    icon: 'material-symbols:nest-clock-farsight-analog-outline-rounded',
    tone: 'neutral',
  },
}

export const CONNECTOR_TYPE = 'dateTimeConnector'

export const CONNECTOR_TONES = {
  success: 'success',
  failure: 'danger',
}

export const TONE_COLORS = {
  warning: 'var(--warning)',
  brand: 'var(--accent)',
  info: 'var(--info)',
  neutral: 'var(--text-tertiary)',
  success: 'var(--success)',
  danger: 'var(--danger)',
}

export function getNodeTone(item) {
  if (item.type === CONNECTOR_TYPE) return CONNECTOR_TONES[item.data?.connectorType] ?? 'neutral'
  return NODE_TYPES[item.type]?.tone ?? 'neutral'
}

export const CREATABLE_NODE_TYPES = ['sendMessage', 'addComment', 'businessHours']

export const LEGACY_NODE_TYPES = {
  dateTime: 'businessHours',
}

import { CONNECTOR_TYPE } from '@/constants/nodeTypes'
import { CARD_HEIGHT, H_GAP, NODE_WIDTH, V_GAP } from '@/utils/flowTransform'

export const ROOT_PARENT_ID = -1

const DEFAULT_BUSINESS_DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

export function generateNodeId(existingIds, random = Math.random) {
  const taken = new Set([...existingIds].map(String))
  let id
  do {
    id = Math.floor(random() * 0xffffff)
      .toString(16)
      .padStart(6, '0')
  } while (taken.has(id))
  return id
}

const DEFAULT_DATA = {
  sendMessage: () => ({ payload: [] }),
  addComment: () => ({ comment: '' }),
  businessHours: () => ({
    times: DEFAULT_BUSINESS_DAYS.map((day) => ({ day, startTime: '09:00', endTime: '17:00' })),
    connectors: [],
    timezone: 'UTC',
    action: 'businessHours',
  }),
}

export function buildNewNodes(
  { title, description, type },
  existingIds,
  { parentId = ROOT_PARENT_ID, position, random } = {},
) {
  const ids = new Set([...existingIds].map(String))
  const nextId = () => {
    const id = generateNodeId(ids, random)
    ids.add(id)
    return id
  }

  const node = {
    id: nextId(),
    parentId,
    type,
    name: title,
    ...(description && { description }),
    ...(position && { position }),
    data: DEFAULT_DATA[type](),
  }

  if (type !== 'businessHours') return [node]

  const branchOffset = (NODE_WIDTH + H_GAP) / 2
  const connectors = ['success', 'failure'].map((connectorType, i) => ({
    id: nextId(),
    parentId: node.id,
    type: CONNECTOR_TYPE,
    name: connectorType === 'success' ? 'Success' : 'Failure',
    ...(position && {
      position: {
        x: position.x + (i === 0 ? -branchOffset : branchOffset),
        y: position.y + CARD_HEIGHT + V_GAP,
      },
    }),
    data: { connectorType },
  }))
  node.data.connectors = connectors.map((connector) => connector.id)

  return [node, ...connectors]
}

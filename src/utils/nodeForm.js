import { CREATABLE_NODE_TYPES } from '@/constants/nodeTypes'

export const TITLE_MAX_LENGTH = 60
export const DESCRIPTION_MAX_LENGTH = 200

export const emptyNodeForm = () => ({ title: '', description: '', type: '' })

export function validateNodeForm({ title = '', description = '', type = '' }) {
  const errors = {}
  const trimmedTitle = title.trim()

  if (!trimmedTitle) errors.title = 'Title is required'
  else if (trimmedTitle.length > TITLE_MAX_LENGTH)
    errors.title = `Title must be ${TITLE_MAX_LENGTH} characters or fewer`

  if (description.trim().length > DESCRIPTION_MAX_LENGTH)
    errors.description = `Description must be ${DESCRIPTION_MAX_LENGTH} characters or fewer`

  if (!type) errors.type = 'Select a node type'
  else if (!CREATABLE_NODE_TYPES.includes(type)) errors.type = 'Unsupported node type'

  return errors
}

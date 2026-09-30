import payload from '../../payload.json'
import { normalizeFlow } from '@/utils/flowNormalize'

export async function fetchFlow() {
  return normalizeFlow(structuredClone(payload))
}

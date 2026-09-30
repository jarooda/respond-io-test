import { useQuery } from '@tanstack/vue-query'

import { fetchFlow } from '@/api/flow'
import { queryKeys } from '@/config/query'
import { applyLayout } from '@/utils/flowTransform'

export function useFlowQuery() {
  return useQuery({
    queryKey: queryKeys.flow,
    // Positions are client-owned: laid out once here, then only changed by drags.
    queryFn: async () => applyLayout(await fetchFlow()),
  })
}

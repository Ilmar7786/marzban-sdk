import type { RequestConfig, ResponseErrorConfig } from '../../../core/http/client.ts'
import fetch from '../../../core/http/client.ts'
import type {
  ActiveNextPlan401,
  ActiveNextPlan403,
  ActiveNextPlan404,
  ActiveNextPlan422,
  ActiveNextPlanMutationResponse,
  ActiveNextPlanPathParams,
} from '../../models/UserModel/ActiveNextPlan.ts'
import { activeNextPlanMutationResponseSchema } from '../../schemas/UserSchema/activeNextPlanSchema.ts'

function getActiveNextPlanUrl(username: ActiveNextPlanPathParams['username']) {
  const res = { method: 'POST', url: `/api/user/${username}/active-next` as const }
  return res
}

/**
 * @description Reset user by next plan
 * @summary Active Next Plan
 * {@link /api/user/:username/active-next}
 */
export async function activeNextPlan(
  username: ActiveNextPlanPathParams['username'],
  config: Partial<RequestConfig> & { client?: typeof fetch } = {}
) {
  const { client: request = fetch, ...requestConfig } = config

  const res = await request<
    ActiveNextPlanMutationResponse,
    ResponseErrorConfig<ActiveNextPlan401 | ActiveNextPlan403 | ActiveNextPlan404 | ActiveNextPlan422>,
    unknown
  >({ method: 'POST', url: getActiveNextPlanUrl(username).url.toString(), ...requestConfig })
  return activeNextPlanMutationResponseSchema.parse(res.data)
}

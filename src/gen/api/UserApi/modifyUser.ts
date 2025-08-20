import type { RequestConfig, ResponseErrorConfig } from '../../../core/http/client.ts'
import fetch from '../../../core/http/client.ts'
import type {
  ModifyUser400,
  ModifyUser401,
  ModifyUser403,
  ModifyUser404,
  ModifyUser422,
  ModifyUserMutationRequest,
  ModifyUserMutationResponse,
  ModifyUserPathParams,
} from '../../models/UserModel/ModifyUser.ts'
import {
  modifyUserMutationRequestSchema,
  modifyUserMutationResponseSchema,
} from '../../schemas/UserSchema/modifyUserSchema.ts'

function getModifyUserUrl(username: ModifyUserPathParams['username']) {
  const res = {
    method: 'PUT',
    url: `/api/user/${username}` as const,
  }
  return res
}

/**
 * @description Modify an existing user- **username**: Cannot be changed. Used to identify the user.- **status**: User's new status. Can be 'active', 'disabled', 'on_hold', 'limited', or 'expired'.- **expire**: UTC timestamp for new account expiration. Set to `0` for unlimited, `null` for no change.- **data_limit**: New max data usage in bytes (e.g., `1073741824` for 1GB). Set to `0` for unlimited, `null` for no change.- **data_limit_reset_strategy**: New strategy for data limit reset. Options include 'daily', 'weekly', 'monthly', or 'no_reset'.- **proxies**: Dictionary of new protocol settings (e.g., `vmess`, `vless`). Empty dictionary means no change.- **inbounds**: Dictionary of new protocol tags to specify inbound connections. Empty dictionary means no change.- **note**: New optional text for additional user information or notes. `null` means no change.- **on_hold_timeout**: New UTC timestamp for when `on_hold` status should start or end. Only applicable if status is changed to 'on_hold'.- **on_hold_expire_duration**: New duration (in seconds) for how long the user should stay in `on_hold` status. Only applicable if status is changed to 'on_hold'.- **next_plan**: Next user plan (resets after use).Note: Fields set to `null` or omitted will not be modified.
 * @summary Modify User
 * {@link /api/user/:username}
 */
export async function modifyUser(
  username: ModifyUserPathParams['username'],
  data?: ModifyUserMutationRequest,
  config: Partial<RequestConfig<ModifyUserMutationRequest>> & { client?: typeof fetch } = {}
) {
  const { client: request = fetch, ...requestConfig } = config

  const requestData = modifyUserMutationRequestSchema.parse(data)
  const res = await request<
    ModifyUserMutationResponse,
    ResponseErrorConfig<ModifyUser400 | ModifyUser401 | ModifyUser403 | ModifyUser404 | ModifyUser422>,
    ModifyUserMutationRequest
  >({ method: 'PUT', url: getModifyUserUrl(username).url.toString(), data: requestData, ...requestConfig })
  return modifyUserMutationResponseSchema.parse(res.data)
}

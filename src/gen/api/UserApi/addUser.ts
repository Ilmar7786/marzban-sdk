import type { RequestConfig, ResponseErrorConfig } from '../../../core/http/client.ts'
import fetch from '../../../core/http/client.ts'
import type {
  AddUser400,
  AddUser401,
  AddUser409,
  AddUser422,
  AddUserMutationRequest,
  AddUserMutationResponse,
} from '../../models/UserModel/AddUser.ts'
import { addUserMutationRequestSchema, addUserMutationResponseSchema } from '../../schemas/UserSchema/addUserSchema.ts'

function getAddUserUrl() {
  const res = {
    method: 'POST',
    url: `/api/user` as const,
  }
  return res
}

/**
 * @description Add a new user- **username**: 3 to 32 characters, can include a-z, 0-9, and underscores.- **status**: User's status, defaults to `active`. Special rules if `on_hold`.- **expire**: UTC timestamp for account expiration. Use `0` for unlimited.- **data_limit**: Max data usage in bytes (e.g., `1073741824` for 1GB). `0` means unlimited.- **data_limit_reset_strategy**: Defines how/if data limit resets. `no_reset` means it never resets.- **proxies**: Dictionary of protocol settings (e.g., `vmess`, `vless`).- **inbounds**: Dictionary of protocol tags to specify inbound connections.- **note**: Optional text field for additional user information or notes.- **on_hold_timeout**: UTC timestamp when `on_hold` status should start or end.- **on_hold_expire_duration**: Duration (in seconds) for how long the user should stay in `on_hold` status.- **next_plan**: Next user plan (resets after use).
 * @summary Add User
 * {@link /api/user}
 */
export async function addUser(
  data: AddUserMutationRequest,
  config: Partial<RequestConfig<AddUserMutationRequest>> & { client?: typeof fetch } = {}
) {
  const { client: request = fetch, ...requestConfig } = config

  const requestData = addUserMutationRequestSchema.parse(data)
  const res = await request<
    AddUserMutationResponse,
    ResponseErrorConfig<AddUser400 | AddUser401 | AddUser409 | AddUser422>,
    AddUserMutationRequest
  >({
    method: 'POST',
    url: getAddUserUrl().url.toString(),
    data: requestData,
    ...requestConfig,
  })
  return addUserMutationResponseSchema.parse(res.data)
}

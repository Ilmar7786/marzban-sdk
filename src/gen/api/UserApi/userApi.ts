import type { RequestConfig, ResponseErrorConfig } from '@/core/http/client.ts'
import fetch from '@/core/http/client.ts'

import type {
  ActiveNextPlan401,
  ActiveNextPlan403,
  ActiveNextPlan404,
  ActiveNextPlan422,
  ActiveNextPlanMutationResponse,
  ActiveNextPlanPathParams,
} from '../../models/UserModel/ActiveNextPlan.ts'
import type {
  AddUser400,
  AddUser401,
  AddUser409,
  AddUser422,
  AddUserMutationRequest,
  AddUserMutationResponse,
} from '../../models/UserModel/AddUser.ts'
import type {
  DeleteExpiredUsers401,
  DeleteExpiredUsers422,
  DeleteExpiredUsersMutationResponse,
  DeleteExpiredUsersQueryParams,
} from '../../models/UserModel/DeleteExpiredUsers.ts'
import type {
  GetExpiredUsers401,
  GetExpiredUsers422,
  GetExpiredUsersQueryParams,
  GetExpiredUsersQueryResponse,
} from '../../models/UserModel/GetExpiredUsers.ts'
import type {
  GetUser401,
  GetUser403,
  GetUser404,
  GetUser422,
  GetUserPathParams,
  GetUserQueryResponse,
} from '../../models/UserModel/GetUser.ts'
import type {
  GetUsers400,
  GetUsers401,
  GetUsers403,
  GetUsers404,
  GetUsers422,
  GetUsersQueryParams,
  GetUsersQueryResponse,
} from '../../models/UserModel/GetUsers.ts'
import type {
  GetUsersUsage401,
  GetUsersUsage422,
  GetUsersUsageQueryParams,
  GetUsersUsageQueryResponse,
} from '../../models/UserModel/GetUsersUsage.ts'
import type {
  GetUserUsage401,
  GetUserUsage403,
  GetUserUsage404,
  GetUserUsage422,
  GetUserUsagePathParams,
  GetUserUsageQueryParams,
  GetUserUsageQueryResponse,
} from '../../models/UserModel/GetUserUsage.ts'
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
import type {
  RemoveUser401,
  RemoveUser403,
  RemoveUser404,
  RemoveUser422,
  RemoveUserMutationResponse,
  RemoveUserPathParams,
} from '../../models/UserModel/RemoveUser.ts'
import type {
  ResetUserDataUsage401,
  ResetUserDataUsage403,
  ResetUserDataUsage404,
  ResetUserDataUsage422,
  ResetUserDataUsageMutationResponse,
  ResetUserDataUsagePathParams,
} from '../../models/UserModel/ResetUserDataUsage.ts'
import type {
  ResetUsersDataUsage401,
  ResetUsersDataUsage403,
  ResetUsersDataUsage404,
  ResetUsersDataUsageMutationResponse,
} from '../../models/UserModel/ResetUsersDataUsage.ts'
import type {
  RevokeUserSubscription401,
  RevokeUserSubscription403,
  RevokeUserSubscription404,
  RevokeUserSubscription422,
  RevokeUserSubscriptionMutationResponse,
  RevokeUserSubscriptionPathParams,
} from '../../models/UserModel/RevokeUserSubscription.ts'
import type {
  SetOwner401,
  SetOwner422,
  SetOwnerMutationResponse,
  SetOwnerPathParams,
  SetOwnerQueryParams,
} from '../../models/UserModel/SetOwner.ts'
import { activeNextPlanMutationResponseSchema } from '../../schemas/UserSchema/activeNextPlanSchema.ts'
import { addUserMutationRequestSchema, addUserMutationResponseSchema } from '../../schemas/UserSchema/addUserSchema.ts'
import { deleteExpiredUsersMutationResponseSchema } from '../../schemas/UserSchema/deleteExpiredUsersSchema.ts'
import { getExpiredUsersQueryResponseSchema } from '../../schemas/UserSchema/getExpiredUsersSchema.ts'
import { getUserQueryResponseSchema } from '../../schemas/UserSchema/getUserSchema.ts'
import { getUsersQueryResponseSchema } from '../../schemas/UserSchema/getUsersSchema.ts'
import { getUsersUsageQueryResponseSchema } from '../../schemas/UserSchema/getUsersUsageSchema.ts'
import { getUserUsageQueryResponseSchema } from '../../schemas/UserSchema/getUserUsageSchema.ts'
import {
  modifyUserMutationRequestSchema,
  modifyUserMutationResponseSchema,
} from '../../schemas/UserSchema/modifyUserSchema.ts'
import { removeUserMutationResponseSchema } from '../../schemas/UserSchema/removeUserSchema.ts'
import { resetUserDataUsageMutationResponseSchema } from '../../schemas/UserSchema/resetUserDataUsageSchema.ts'
import { resetUsersDataUsageMutationResponseSchema } from '../../schemas/UserSchema/resetUsersDataUsageSchema.ts'
import { revokeUserSubscriptionMutationResponseSchema } from '../../schemas/UserSchema/revokeUserSubscriptionSchema.ts'
import { setOwnerMutationResponseSchema } from '../../schemas/UserSchema/setOwnerSchema.ts'

export class userApi {
  #client: typeof fetch

  constructor(config: Partial<RequestConfig> & { client?: typeof fetch } = {}) {
    this.#client = config.client || fetch
  }

  /**
   * @description Add a new user- **username**: 3 to 32 characters, can include a-z, 0-9, and underscores.- **status**: User's status, defaults to `active`. Special rules if `on_hold`.- **expire**: UTC timestamp for account expiration. Use `0` for unlimited.- **data_limit**: Max data usage in bytes (e.g., `1073741824` for 1GB). `0` means unlimited.- **data_limit_reset_strategy**: Defines how/if data limit resets. `no_reset` means it never resets.- **proxies**: Dictionary of protocol settings (e.g., `vmess`, `vless`).- **inbounds**: Dictionary of protocol tags to specify inbound connections.- **note**: Optional text field for additional user information or notes.- **on_hold_timeout**: UTC timestamp when `on_hold` status should start or end.- **on_hold_expire_duration**: Duration (in seconds) for how long the user should stay in `on_hold` status.- **next_plan**: Next user plan (resets after use).
   * @summary Add User
   * {@link /api/user}
   */
  async addUser(
    data: AddUserMutationRequest,
    config: Partial<RequestConfig<AddUserMutationRequest>> & { client?: typeof fetch } = {}
  ) {
    const { client: request = this.#client, ...requestConfig } = config
    const requestData = addUserMutationRequestSchema.parse(data)
    const res = await request<
      AddUserMutationResponse,
      ResponseErrorConfig<AddUser400 | AddUser401 | AddUser409 | AddUser422>,
      AddUserMutationRequest
    >({ method: 'POST', url: `/api/user`, data: requestData, ...requestConfig })
    return addUserMutationResponseSchema.parse(res.data)
  }

  /**
   * @description Get user information
   * @summary Get User
   * {@link /api/user/:username}
   */
  async getUser(
    username: GetUserPathParams['username'],
    config: Partial<RequestConfig> & { client?: typeof fetch } = {}
  ) {
    const { client: request = this.#client, ...requestConfig } = config
    const res = await request<
      GetUserQueryResponse,
      ResponseErrorConfig<GetUser401 | GetUser403 | GetUser404 | GetUser422>,
      unknown
    >({ method: 'GET', url: `/api/user/${username}`, ...requestConfig })
    return getUserQueryResponseSchema.parse(res.data)
  }

  /**
   * @description Modify an existing user- **username**: Cannot be changed. Used to identify the user.- **status**: User's new status. Can be 'active', 'disabled', 'on_hold', 'limited', or 'expired'.- **expire**: UTC timestamp for new account expiration. Set to `0` for unlimited, `null` for no change.- **data_limit**: New max data usage in bytes (e.g., `1073741824` for 1GB). Set to `0` for unlimited, `null` for no change.- **data_limit_reset_strategy**: New strategy for data limit reset. Options include 'daily', 'weekly', 'monthly', or 'no_reset'.- **proxies**: Dictionary of new protocol settings (e.g., `vmess`, `vless`). Empty dictionary means no change.- **inbounds**: Dictionary of new protocol tags to specify inbound connections. Empty dictionary means no change.- **note**: New optional text for additional user information or notes. `null` means no change.- **on_hold_timeout**: New UTC timestamp for when `on_hold` status should start or end. Only applicable if status is changed to 'on_hold'.- **on_hold_expire_duration**: New duration (in seconds) for how long the user should stay in `on_hold` status. Only applicable if status is changed to 'on_hold'.- **next_plan**: Next user plan (resets after use).Note: Fields set to `null` or omitted will not be modified.
   * @summary Modify User
   * {@link /api/user/:username}
   */
  async modifyUser(
    username: ModifyUserPathParams['username'],
    data?: ModifyUserMutationRequest,
    config: Partial<RequestConfig<ModifyUserMutationRequest>> & { client?: typeof fetch } = {}
  ) {
    const { client: request = this.#client, ...requestConfig } = config
    const requestData = modifyUserMutationRequestSchema.parse(data)
    const res = await request<
      ModifyUserMutationResponse,
      ResponseErrorConfig<ModifyUser400 | ModifyUser401 | ModifyUser403 | ModifyUser404 | ModifyUser422>,
      ModifyUserMutationRequest
    >({ method: 'PUT', url: `/api/user/${username}`, data: requestData, ...requestConfig })
    return modifyUserMutationResponseSchema.parse(res.data)
  }

  /**
   * @description Remove a user
   * @summary Remove User
   * {@link /api/user/:username}
   */
  async removeUser(
    username: RemoveUserPathParams['username'],
    config: Partial<RequestConfig> & { client?: typeof fetch } = {}
  ) {
    const { client: request = this.#client, ...requestConfig } = config
    const res = await request<
      RemoveUserMutationResponse,
      ResponseErrorConfig<RemoveUser401 | RemoveUser403 | RemoveUser404 | RemoveUser422>,
      unknown
    >({ method: 'DELETE', url: `/api/user/${username}`, ...requestConfig })
    return removeUserMutationResponseSchema.parse(res.data)
  }

  /**
   * @description Reset user data usage
   * @summary Reset User Data Usage
   * {@link /api/user/:username/reset}
   */
  async resetUserDataUsage(
    username: ResetUserDataUsagePathParams['username'],
    config: Partial<RequestConfig> & { client?: typeof fetch } = {}
  ) {
    const { client: request = this.#client, ...requestConfig } = config
    const res = await request<
      ResetUserDataUsageMutationResponse,
      ResponseErrorConfig<
        ResetUserDataUsage401 | ResetUserDataUsage403 | ResetUserDataUsage404 | ResetUserDataUsage422
      >,
      unknown
    >({ method: 'POST', url: `/api/user/${username}/reset`, ...requestConfig })
    return resetUserDataUsageMutationResponseSchema.parse(res.data)
  }

  /**
   * @description Revoke users subscription (Subscription link and proxies)
   * @summary Revoke User Subscription
   * {@link /api/user/:username/revoke_sub}
   */
  async revokeUserSubscription(
    username: RevokeUserSubscriptionPathParams['username'],
    config: Partial<RequestConfig> & { client?: typeof fetch } = {}
  ) {
    const { client: request = this.#client, ...requestConfig } = config
    const res = await request<
      RevokeUserSubscriptionMutationResponse,
      ResponseErrorConfig<
        RevokeUserSubscription401 | RevokeUserSubscription403 | RevokeUserSubscription404 | RevokeUserSubscription422
      >,
      unknown
    >({ method: 'POST', url: `/api/user/${username}/revoke_sub`, ...requestConfig })
    return revokeUserSubscriptionMutationResponseSchema.parse(res.data)
  }

  /**
   * @description Get all users
   * @summary Get Users
   * {@link /api/users}
   */
  async getUsers(params?: GetUsersQueryParams, config: Partial<RequestConfig> & { client?: typeof fetch } = {}) {
    const { client: request = this.#client, ...requestConfig } = config
    const res = await request<
      GetUsersQueryResponse,
      ResponseErrorConfig<GetUsers400 | GetUsers401 | GetUsers403 | GetUsers404 | GetUsers422>,
      unknown
    >({ method: 'GET', url: `/api/users`, params, ...requestConfig })
    return getUsersQueryResponseSchema.parse(res.data)
  }

  /**
   * @description Reset all users data usage
   * @summary Reset Users Data Usage
   * {@link /api/users/reset}
   */
  async resetUsersDataUsage(config: Partial<RequestConfig> & { client?: typeof fetch } = {}) {
    const { client: request = this.#client, ...requestConfig } = config
    const res = await request<
      ResetUsersDataUsageMutationResponse,
      ResponseErrorConfig<ResetUsersDataUsage401 | ResetUsersDataUsage403 | ResetUsersDataUsage404>,
      unknown
    >({ method: 'POST', url: `/api/users/reset`, ...requestConfig })
    return resetUsersDataUsageMutationResponseSchema.parse(res.data)
  }

  /**
   * @description Get users usage
   * @summary Get User Usage
   * {@link /api/user/:username/usage}
   */
  async getUserUsage(
    username: GetUserUsagePathParams['username'],
    params?: GetUserUsageQueryParams,
    config: Partial<RequestConfig> & { client?: typeof fetch } = {}
  ) {
    const { client: request = this.#client, ...requestConfig } = config
    const res = await request<
      GetUserUsageQueryResponse,
      ResponseErrorConfig<GetUserUsage401 | GetUserUsage403 | GetUserUsage404 | GetUserUsage422>,
      unknown
    >({ method: 'GET', url: `/api/user/${username}/usage`, params, ...requestConfig })
    return getUserUsageQueryResponseSchema.parse(res.data)
  }

  /**
   * @description Reset user by next plan
   * @summary Active Next Plan
   * {@link /api/user/:username/active-next}
   */
  async activeNextPlan(
    username: ActiveNextPlanPathParams['username'],
    config: Partial<RequestConfig> & { client?: typeof fetch } = {}
  ) {
    const { client: request = this.#client, ...requestConfig } = config
    const res = await request<
      ActiveNextPlanMutationResponse,
      ResponseErrorConfig<ActiveNextPlan401 | ActiveNextPlan403 | ActiveNextPlan404 | ActiveNextPlan422>,
      unknown
    >({ method: 'POST', url: `/api/user/${username}/active-next`, ...requestConfig })
    return activeNextPlanMutationResponseSchema.parse(res.data)
  }

  /**
   * @description Get all users usage
   * @summary Get Users Usage
   * {@link /api/users/usage}
   */
  async getUsersUsage(
    params?: GetUsersUsageQueryParams,
    config: Partial<RequestConfig> & { client?: typeof fetch } = {}
  ) {
    const { client: request = this.#client, ...requestConfig } = config
    const res = await request<
      GetUsersUsageQueryResponse,
      ResponseErrorConfig<GetUsersUsage401 | GetUsersUsage422>,
      unknown
    >({ method: 'GET', url: `/api/users/usage`, params, ...requestConfig })
    return getUsersUsageQueryResponseSchema.parse(res.data)
  }

  /**
   * @description Set a new owner (admin) for a user.
   * @summary Set Owner
   * {@link /api/user/:username/set-owner}
   */
  async setOwner(
    username: SetOwnerPathParams['username'],
    params: SetOwnerQueryParams,
    config: Partial<RequestConfig> & { client?: typeof fetch } = {}
  ) {
    const { client: request = this.#client, ...requestConfig } = config
    const res = await request<SetOwnerMutationResponse, ResponseErrorConfig<SetOwner401 | SetOwner422>, unknown>({
      method: 'PUT',
      url: `/api/user/${username}/set-owner`,
      params,
      ...requestConfig,
    })
    return setOwnerMutationResponseSchema.parse(res.data)
  }

  /**
   * @description Get users who have expired within the specified date range.- **expired_after** UTC datetime (optional)- **expired_before** UTC datetime (optional)- At least one of expired_after or expired_before must be provided for filtering- If both are omitted, returns all expired users
   * @summary Get Expired Users
   * {@link /api/users/expired}
   */
  async getExpiredUsers(
    params?: GetExpiredUsersQueryParams,
    config: Partial<RequestConfig> & { client?: typeof fetch } = {}
  ) {
    const { client: request = this.#client, ...requestConfig } = config
    const res = await request<
      GetExpiredUsersQueryResponse,
      ResponseErrorConfig<GetExpiredUsers401 | GetExpiredUsers422>,
      unknown
    >({ method: 'GET', url: `/api/users/expired`, params, ...requestConfig })
    return getExpiredUsersQueryResponseSchema.parse(res.data)
  }

  /**
   * @description Delete users who have expired within the specified date range.- **expired_after** UTC datetime (optional)- **expired_before** UTC datetime (optional)- At least one of expired_after or expired_before must be provided
   * @summary Delete Expired Users
   * {@link /api/users/expired}
   */
  async deleteExpiredUsers(
    params?: DeleteExpiredUsersQueryParams,
    config: Partial<RequestConfig> & { client?: typeof fetch } = {}
  ) {
    const { client: request = this.#client, ...requestConfig } = config
    const res = await request<
      DeleteExpiredUsersMutationResponse,
      ResponseErrorConfig<DeleteExpiredUsers401 | DeleteExpiredUsers422>,
      unknown
    >({ method: 'DELETE', url: `/api/users/expired`, params, ...requestConfig })
    return deleteExpiredUsersMutationResponseSchema.parse(res.data)
  }
}

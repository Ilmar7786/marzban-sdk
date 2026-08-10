import type { Client, RequestConfig, ResponseErrorConfig } from '@kubb/plugin-client/clients/axios'
import fetch from '@kubb/plugin-client/clients/axios'
import { mergeConfig } from '@kubb/plugin-client/clients/axios'

import type {
  ActivateAllDisabledUsers401,
  ActivateAllDisabledUsers403,
  ActivateAllDisabledUsers404,
  ActivateAllDisabledUsers422,
  ActivateAllDisabledUsersMutationResponse,
  ActivateAllDisabledUsersPathParams,
} from '../../models/AdminModel/ActivateAllDisabledUsers.ts'
import type {
  AdminToken401,
  AdminToken422,
  AdminTokenMutationRequest,
  AdminTokenMutationResponse,
} from '../../models/AdminModel/AdminToken.ts'
import type {
  CreateAdmin401,
  CreateAdmin403,
  CreateAdmin409,
  CreateAdmin422,
  CreateAdminMutationRequest,
  CreateAdminMutationResponse,
} from '../../models/AdminModel/CreateAdmin.ts'
import type {
  DisableAllActiveUsers401,
  DisableAllActiveUsers403,
  DisableAllActiveUsers404,
  DisableAllActiveUsers422,
  DisableAllActiveUsersMutationResponse,
  DisableAllActiveUsersPathParams,
} from '../../models/AdminModel/DisableAllActiveUsers.ts'
import type {
  GetAdmins401,
  GetAdmins403,
  GetAdmins422,
  GetAdminsQueryParams,
  GetAdminsQueryResponse,
} from '../../models/AdminModel/GetAdmins.ts'
import type {
  GetAdminUsage401,
  GetAdminUsage403,
  GetAdminUsage422,
  GetAdminUsagePathParams,
  GetAdminUsageQueryResponse,
} from '../../models/AdminModel/GetAdminUsage.ts'
import type { GetCurrentAdmin401, GetCurrentAdminQueryResponse } from '../../models/AdminModel/GetCurrentAdmin.ts'
import type {
  ModifyAdmin401,
  ModifyAdmin403,
  ModifyAdmin422,
  ModifyAdminMutationRequest,
  ModifyAdminMutationResponse,
  ModifyAdminPathParams,
} from '../../models/AdminModel/ModifyAdmin.ts'
import type {
  RemoveAdmin401,
  RemoveAdmin403,
  RemoveAdmin422,
  RemoveAdminMutationResponse,
  RemoveAdminPathParams,
} from '../../models/AdminModel/RemoveAdmin.ts'
import type {
  ResetAdminUsage401,
  ResetAdminUsage403,
  ResetAdminUsage422,
  ResetAdminUsageMutationResponse,
  ResetAdminUsagePathParams,
} from '../../models/AdminModel/ResetAdminUsage.ts'
import { activateAllDisabledUsersMutationResponseSchema } from '../../schemas/AdminSchema/activateAllDisabledUsersSchema.ts'
import {
  adminTokenMutationRequestSchema,
  adminTokenMutationResponseSchema,
} from '../../schemas/AdminSchema/adminTokenSchema.ts'
import {
  createAdminMutationRequestSchema,
  createAdminMutationResponseSchema,
} from '../../schemas/AdminSchema/createAdminSchema.ts'
import { disableAllActiveUsersMutationResponseSchema } from '../../schemas/AdminSchema/disableAllActiveUsersSchema.ts'
import { getAdminsQueryResponseSchema } from '../../schemas/AdminSchema/getAdminsSchema.ts'
import { getAdminUsageQueryResponseSchema } from '../../schemas/AdminSchema/getAdminUsageSchema.ts'
import { getCurrentAdminQueryResponseSchema } from '../../schemas/AdminSchema/getCurrentAdminSchema.ts'
import {
  modifyAdminMutationRequestSchema,
  modifyAdminMutationResponseSchema,
} from '../../schemas/AdminSchema/modifyAdminSchema.ts'
import { removeAdminMutationResponseSchema } from '../../schemas/AdminSchema/removeAdminSchema.ts'
import { resetAdminUsageMutationResponseSchema } from '../../schemas/AdminSchema/resetAdminUsageSchema.ts'

export class adminApi {
  #config: Partial<RequestConfig> & { client?: Client }

  constructor(config: Partial<RequestConfig> & { client?: Client } = {}) {
    this.#config = config
  }

  /**
   * @description Authenticate an admin and issue a token.
   * @summary Admin Token
   * {@link /api/admin/token}
   */
  async adminToken(
    data: AdminTokenMutationRequest,
    config: Partial<RequestConfig<AdminTokenMutationRequest>> & { client?: Client } = {}
  ) {
    const { client: request = fetch, ...requestConfig } = mergeConfig(this.#config, config)
    const requestData = adminTokenMutationRequestSchema.parse(data)
    const res = await request<
      AdminTokenMutationResponse,
      ResponseErrorConfig<AdminToken401 | AdminToken422>,
      AdminTokenMutationRequest
    >({
      ...requestConfig,
      method: 'POST',
      url: `/api/admin/token`,
      data: requestData,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...requestConfig.headers },
    })
    return adminTokenMutationResponseSchema.parse(res.data)
  }

  /**
   * @description Retrieve the current authenticated admin.
   * @summary Get Current Admin
   * {@link /api/admin}
   */
  async getCurrentAdmin(config: Partial<RequestConfig> & { client?: Client } = {}) {
    const { client: request = fetch, ...requestConfig } = mergeConfig(this.#config, config)
    const res = await request<GetCurrentAdminQueryResponse, ResponseErrorConfig<GetCurrentAdmin401>, unknown>({
      ...requestConfig,
      method: 'GET',
      url: `/api/admin`,
    })
    return getCurrentAdminQueryResponseSchema.parse(res.data)
  }

  /**
   * @description Create a new admin if the current admin has sudo privileges.
   * @summary Create Admin
   * {@link /api/admin}
   */
  async createAdmin(
    data: CreateAdminMutationRequest,
    config: Partial<RequestConfig<CreateAdminMutationRequest>> & { client?: Client } = {}
  ) {
    const { client: request = fetch, ...requestConfig } = mergeConfig(this.#config, config)
    const requestData = createAdminMutationRequestSchema.parse(data)
    const res = await request<
      CreateAdminMutationResponse,
      ResponseErrorConfig<CreateAdmin401 | CreateAdmin403 | CreateAdmin409 | CreateAdmin422>,
      CreateAdminMutationRequest
    >({ ...requestConfig, method: 'POST', url: `/api/admin`, data: requestData })
    return createAdminMutationResponseSchema.parse(res.data)
  }

  /**
   * @description Modify an existing admin's details.
   * @summary Modify Admin
   * {@link /api/admin/:username}
   */
  async modifyAdmin(
    username: ModifyAdminPathParams['username'],
    data: ModifyAdminMutationRequest,
    config: Partial<RequestConfig<ModifyAdminMutationRequest>> & { client?: Client } = {}
  ) {
    const { client: request = fetch, ...requestConfig } = mergeConfig(this.#config, config)
    const requestData = modifyAdminMutationRequestSchema.parse(data)
    const res = await request<
      ModifyAdminMutationResponse,
      ResponseErrorConfig<ModifyAdmin401 | ModifyAdmin403 | ModifyAdmin422>,
      ModifyAdminMutationRequest
    >({ ...requestConfig, method: 'PUT', url: `/api/admin/${username}`, data: requestData })
    return modifyAdminMutationResponseSchema.parse(res.data)
  }

  /**
   * @description Remove an admin from the database.
   * @summary Remove Admin
   * {@link /api/admin/:username}
   */
  async removeAdmin(
    username: RemoveAdminPathParams['username'],
    config: Partial<RequestConfig> & { client?: Client } = {}
  ) {
    const { client: request = fetch, ...requestConfig } = mergeConfig(this.#config, config)
    const res = await request<
      RemoveAdminMutationResponse,
      ResponseErrorConfig<RemoveAdmin401 | RemoveAdmin403 | RemoveAdmin422>,
      unknown
    >({ ...requestConfig, method: 'DELETE', url: `/api/admin/${username}` })
    return removeAdminMutationResponseSchema.parse(res.data)
  }

  /**
   * @description Fetch a list of admins with optional filters for pagination and username.
   * @summary Get Admins
   * {@link /api/admins}
   */
  async getAdmins(params?: GetAdminsQueryParams, config: Partial<RequestConfig> & { client?: Client } = {}) {
    const { client: request = fetch, ...requestConfig } = mergeConfig(this.#config, config)
    const res = await request<
      GetAdminsQueryResponse,
      ResponseErrorConfig<GetAdmins401 | GetAdmins403 | GetAdmins422>,
      unknown
    >({ ...requestConfig, method: 'GET', url: `/api/admins`, params })
    return getAdminsQueryResponseSchema.parse(res.data)
  }

  /**
   * @description Disable all active users under a specific admin
   * @summary Disable All Active Users
   * {@link /api/admin/:username/users/disable}
   */
  async disableAllActiveUsers(
    username: DisableAllActiveUsersPathParams['username'],
    config: Partial<RequestConfig> & { client?: Client } = {}
  ) {
    const { client: request = fetch, ...requestConfig } = mergeConfig(this.#config, config)
    const res = await request<
      DisableAllActiveUsersMutationResponse,
      ResponseErrorConfig<
        DisableAllActiveUsers401 | DisableAllActiveUsers403 | DisableAllActiveUsers404 | DisableAllActiveUsers422
      >,
      unknown
    >({ ...requestConfig, method: 'POST', url: `/api/admin/${username}/users/disable` })
    return disableAllActiveUsersMutationResponseSchema.parse(res.data)
  }

  /**
   * @description Activate all disabled users under a specific admin
   * @summary Activate All Disabled Users
   * {@link /api/admin/:username/users/activate}
   */
  async activateAllDisabledUsers(
    username: ActivateAllDisabledUsersPathParams['username'],
    config: Partial<RequestConfig> & { client?: Client } = {}
  ) {
    const { client: request = fetch, ...requestConfig } = mergeConfig(this.#config, config)
    const res = await request<
      ActivateAllDisabledUsersMutationResponse,
      ResponseErrorConfig<
        | ActivateAllDisabledUsers401
        | ActivateAllDisabledUsers403
        | ActivateAllDisabledUsers404
        | ActivateAllDisabledUsers422
      >,
      unknown
    >({ ...requestConfig, method: 'POST', url: `/api/admin/${username}/users/activate` })
    return activateAllDisabledUsersMutationResponseSchema.parse(res.data)
  }

  /**
   * @description Resets usage of admin.
   * @summary Reset Admin Usage
   * {@link /api/admin/usage/reset/:username}
   */
  async resetAdminUsage(
    username: ResetAdminUsagePathParams['username'],
    config: Partial<RequestConfig> & { client?: Client } = {}
  ) {
    const { client: request = fetch, ...requestConfig } = mergeConfig(this.#config, config)
    const res = await request<
      ResetAdminUsageMutationResponse,
      ResponseErrorConfig<ResetAdminUsage401 | ResetAdminUsage403 | ResetAdminUsage422>,
      unknown
    >({ ...requestConfig, method: 'POST', url: `/api/admin/usage/reset/${username}` })
    return resetAdminUsageMutationResponseSchema.parse(res.data)
  }

  /**
   * @description Retrieve the usage of given admin.
   * @summary Get Admin Usage
   * {@link /api/admin/usage/:username}
   */
  async getAdminUsage(
    username: GetAdminUsagePathParams['username'],
    config: Partial<RequestConfig> & { client?: Client } = {}
  ) {
    const { client: request = fetch, ...requestConfig } = mergeConfig(this.#config, config)
    const res = await request<
      GetAdminUsageQueryResponse,
      ResponseErrorConfig<GetAdminUsage401 | GetAdminUsage403 | GetAdminUsage422>,
      unknown
    >({ ...requestConfig, method: 'GET', url: `/api/admin/usage/${username}` })
    return getAdminUsageQueryResponseSchema.parse(res.data)
  }
}

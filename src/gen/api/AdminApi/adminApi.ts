import type { RequestConfig, ResponseErrorConfig } from '@/core/http/client.ts'
import fetch from '@/core/http/client.ts'

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
  #client: typeof fetch

  constructor(config: Partial<RequestConfig> & { client?: typeof fetch } = {}) {
    this.#client = config.client || fetch
  }

  /**
   * @description Authenticate an admin and issue a token.
   * @summary Admin Token
   * {@link /api/admin/token}
   */
  async adminToken(
    data: AdminTokenMutationRequest,
    config: Partial<RequestConfig<AdminTokenMutationRequest>> & { client?: typeof fetch } = {}
  ) {
    const { client: request = this.#client, ...requestConfig } = config
    const requestData = adminTokenMutationRequestSchema.parse(data)
    const res = await request<
      AdminTokenMutationResponse,
      ResponseErrorConfig<AdminToken401 | AdminToken422>,
      AdminTokenMutationRequest
    >({
      method: 'POST',
      url: `/api/admin/token`,
      data: requestData,
      ...requestConfig,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', ...requestConfig.headers },
    })
    return adminTokenMutationResponseSchema.parse(res.data)
  }

  /**
   * @description Retrieve the current authenticated admin.
   * @summary Get Current Admin
   * {@link /api/admin}
   */
  async getCurrentAdmin(config: Partial<RequestConfig> & { client?: typeof fetch } = {}) {
    const { client: request = this.#client, ...requestConfig } = config
    const res = await request<GetCurrentAdminQueryResponse, ResponseErrorConfig<GetCurrentAdmin401>, unknown>({
      method: 'GET',
      url: `/api/admin`,
      ...requestConfig,
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
    config: Partial<RequestConfig<CreateAdminMutationRequest>> & { client?: typeof fetch } = {}
  ) {
    const { client: request = this.#client, ...requestConfig } = config
    const requestData = createAdminMutationRequestSchema.parse(data)
    const res = await request<
      CreateAdminMutationResponse,
      ResponseErrorConfig<CreateAdmin401 | CreateAdmin403 | CreateAdmin409 | CreateAdmin422>,
      CreateAdminMutationRequest
    >({ method: 'POST', url: `/api/admin`, data: requestData, ...requestConfig })
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
    config: Partial<RequestConfig<ModifyAdminMutationRequest>> & { client?: typeof fetch } = {}
  ) {
    const { client: request = this.#client, ...requestConfig } = config
    const requestData = modifyAdminMutationRequestSchema.parse(data)
    const res = await request<
      ModifyAdminMutationResponse,
      ResponseErrorConfig<ModifyAdmin401 | ModifyAdmin403 | ModifyAdmin422>,
      ModifyAdminMutationRequest
    >({ method: 'PUT', url: `/api/admin/${username}`, data: requestData, ...requestConfig })
    return modifyAdminMutationResponseSchema.parse(res.data)
  }

  /**
   * @description Remove an admin from the database.
   * @summary Remove Admin
   * {@link /api/admin/:username}
   */
  async removeAdmin(
    username: RemoveAdminPathParams['username'],
    config: Partial<RequestConfig> & { client?: typeof fetch } = {}
  ) {
    const { client: request = this.#client, ...requestConfig } = config
    const res = await request<
      RemoveAdminMutationResponse,
      ResponseErrorConfig<RemoveAdmin401 | RemoveAdmin403 | RemoveAdmin422>,
      unknown
    >({ method: 'DELETE', url: `/api/admin/${username}`, ...requestConfig })
    return removeAdminMutationResponseSchema.parse(res.data)
  }

  /**
   * @description Fetch a list of admins with optional filters for pagination and username.
   * @summary Get Admins
   * {@link /api/admins}
   */
  async getAdmins(params?: GetAdminsQueryParams, config: Partial<RequestConfig> & { client?: typeof fetch } = {}) {
    const { client: request = this.#client, ...requestConfig } = config
    const res = await request<
      GetAdminsQueryResponse,
      ResponseErrorConfig<GetAdmins401 | GetAdmins403 | GetAdmins422>,
      unknown
    >({ method: 'GET', url: `/api/admins`, params, ...requestConfig })
    return getAdminsQueryResponseSchema.parse(res.data)
  }

  /**
   * @description Disable all active users under a specific admin
   * @summary Disable All Active Users
   * {@link /api/admin/:username/users/disable}
   */
  async disableAllActiveUsers(
    username: DisableAllActiveUsersPathParams['username'],
    config: Partial<RequestConfig> & { client?: typeof fetch } = {}
  ) {
    const { client: request = this.#client, ...requestConfig } = config
    const res = await request<
      DisableAllActiveUsersMutationResponse,
      ResponseErrorConfig<
        DisableAllActiveUsers401 | DisableAllActiveUsers403 | DisableAllActiveUsers404 | DisableAllActiveUsers422
      >,
      unknown
    >({ method: 'POST', url: `/api/admin/${username}/users/disable`, ...requestConfig })
    return disableAllActiveUsersMutationResponseSchema.parse(res.data)
  }

  /**
   * @description Activate all disabled users under a specific admin
   * @summary Activate All Disabled Users
   * {@link /api/admin/:username/users/activate}
   */
  async activateAllDisabledUsers(
    username: ActivateAllDisabledUsersPathParams['username'],
    config: Partial<RequestConfig> & { client?: typeof fetch } = {}
  ) {
    const { client: request = this.#client, ...requestConfig } = config
    const res = await request<
      ActivateAllDisabledUsersMutationResponse,
      ResponseErrorConfig<
        | ActivateAllDisabledUsers401
        | ActivateAllDisabledUsers403
        | ActivateAllDisabledUsers404
        | ActivateAllDisabledUsers422
      >,
      unknown
    >({ method: 'POST', url: `/api/admin/${username}/users/activate`, ...requestConfig })
    return activateAllDisabledUsersMutationResponseSchema.parse(res.data)
  }

  /**
   * @description Resets usage of admin.
   * @summary Reset Admin Usage
   * {@link /api/admin/usage/reset/:username}
   */
  async resetAdminUsage(
    username: ResetAdminUsagePathParams['username'],
    config: Partial<RequestConfig> & { client?: typeof fetch } = {}
  ) {
    const { client: request = this.#client, ...requestConfig } = config
    const res = await request<
      ResetAdminUsageMutationResponse,
      ResponseErrorConfig<ResetAdminUsage401 | ResetAdminUsage403 | ResetAdminUsage422>,
      unknown
    >({ method: 'POST', url: `/api/admin/usage/reset/${username}`, ...requestConfig })
    return resetAdminUsageMutationResponseSchema.parse(res.data)
  }

  /**
   * @description Retrieve the usage of given admin.
   * @summary Get Admin Usage
   * {@link /api/admin/usage/:username}
   */
  async getAdminUsage(
    username: GetAdminUsagePathParams['username'],
    config: Partial<RequestConfig> & { client?: typeof fetch } = {}
  ) {
    const { client: request = this.#client, ...requestConfig } = config
    const res = await request<
      GetAdminUsageQueryResponse,
      ResponseErrorConfig<GetAdminUsage401 | GetAdminUsage403 | GetAdminUsage422>,
      unknown
    >({ method: 'GET', url: `/api/admin/usage/${username}`, ...requestConfig })
    return getAdminUsageQueryResponseSchema.parse(res.data)
  }
}

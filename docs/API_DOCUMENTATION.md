# API Documentation 🚀

Welcome to the API documentation. This document describes the available API
endpoints grouped by namespace, their signatures, and how to call them.

All requests and responses are validated with **Zod schemas** at runtime. For
more information about validation, see the [Validation Guide](./VALIDATION.md).

## Calling Convention

API methods are accessed through namespaces on the SDK instance — `sdk.admin`,
`sdk.core`, `sdk.node`, `sdk.user`, `sdk.system`, `sdk.subscription`, and
`sdk.userTemplate`:

```typescript
const sdk = await createMarzbanSDK({ baseUrl, username, password })

const user = await sdk.user.getUser('john')
const users = await sdk.user.getUsers({ limit: 20, status: 'active' })
```

Every method follows the same shape:

- **Path parameters** come first as positional arguments (e.g. `username`, `nodeId`).
- **Request bodies** are passed as a single typed `data` object (e.g. `UserCreate`).
- **Query parameters** are passed as a single typed `params` object (e.g. `GetUsersQueryParams`).
- The **last argument is always an optional `config`** of type
  `Partial<RequestConfig> & { client?: Client }`. It lets you override Axios
  options per request; the SDK injects the authenticated `client` automatically,
  so you normally omit it.

Each method returns a **Promise resolving to the parsed, fully-typed response**.
On failure it throws an [`HttpError`](./ERRORS.md#httperror) (see the
[Error Handling Guide](./ERRORS.md)). All payload/response types are exported
from the package, so you get full IntelliSense for the `data`/`params` objects.

> In the signatures below, the trailing `config?` argument is omitted for brevity
> but is accepted by every method.

## Table of Contents

- [AdminApi](#-adminapi) (`sdk.admin`)
- [CoreApi](#-coreapi) (`sdk.core`)
- [NodeApi](#-nodeapi) (`sdk.node`)
- [SubscriptionApi](#-subscriptionapi) (`sdk.subscription`)
- [SystemApi](#-systemapi) (`sdk.system`)
- [UserApi](#-userapi) (`sdk.user`)
- [UserTemplateApi](#-usertemplateapi) (`sdk.userTemplate`)

---

## 🏢 AdminApi

Accessed via `sdk.admin`.

### 🛠 adminToken

Authenticate an admin and issue a token. The SDK calls this internally during
`authorize()` — you rarely need it directly.

```typescript
sdk.admin.adminToken(data: BodyAdminTokenApiAdminTokenPost)
// data: { username, password, grant_type?, scope?, client_id?, client_secret? }
```

### 🛠 getCurrentAdmin

Retrieve the current authenticated admin.

```typescript
sdk.admin.getCurrentAdmin()
```

### 🛠 createAdmin

Create a new admin (requires sudo privileges).

```typescript
sdk.admin.createAdmin(data: AdminCreate)
```

### 🛠 modifyAdmin

Modify an existing admin's details.

```typescript
sdk.admin.modifyAdmin(username: string, data: AdminModify)
```

### 🛠 removeAdmin

Remove an admin from the database.

```typescript
sdk.admin.removeAdmin(username: string)
```

### 🛠 getAdmins

Fetch a list of admins with optional pagination and username filter.

```typescript
sdk.admin.getAdmins(params?: GetAdminsQueryParams)
// params: { offset?, limit?, username? }
```

### 🛠 disableAllActiveUsers

Disable all active users under a specific admin.

```typescript
sdk.admin.disableAllActiveUsers(username: string)
```

### 🛠 activateAllDisabledUsers

Activate all disabled users under a specific admin.

```typescript
sdk.admin.activateAllDisabledUsers(username: string)
```

### 🛠 resetAdminUsage

Reset the usage counters of an admin.

```typescript
sdk.admin.resetAdminUsage(username: string)
```

### 🛠 getAdminUsage

Retrieve the usage of a given admin.

```typescript
sdk.admin.getAdminUsage(username: string)
```

---

## 🏢 CoreApi

Accessed via `sdk.core`.

### 🛠 getCoreStats

Retrieve core statistics such as version and uptime.

```typescript
sdk.core.getCoreStats()
```

### 🛠 getCoreConfig

Get the current core configuration.

```typescript
sdk.core.getCoreConfig()
```

### 🛠 modifyCoreConfig

Modify the core configuration and restart the core.

```typescript
sdk.core.modifyCoreConfig(data: object) // core config JSON
```

### 🛠 restartCore

Restart the core and all connected nodes.

```typescript
sdk.core.restartCore()
```

---

## 🏢 NodeApi

Accessed via `sdk.node`.

### 🛠 getNodes

Retrieve a list of all nodes (sudo admins only).

```typescript
sdk.node.getNodes()
```

### 🛠 getNode

Retrieve details of a specific node by its ID.

```typescript
sdk.node.getNode(nodeId: number)
```

### 🛠 addNode

Add a new node and optionally register it as a host.

```typescript
sdk.node.addNode(data: NodeCreate)
```

### 🛠 modifyNode

Update a node's details (sudo admins only).

```typescript
sdk.node.modifyNode(nodeId: number, data: NodeModify)
```

### 🛠 removeNode

Delete a node and remove it from xray in the background.

```typescript
sdk.node.removeNode(nodeId: number)
```

### 🛠 reconnectNode

Trigger a reconnection for the specified node (sudo admins only).

```typescript
sdk.node.reconnectNode(nodeId: number)
```

### 🛠 getNodeSettings

Retrieve the current node settings, including the TLS certificate.

```typescript
sdk.node.getNodeSettings()
```

### 🛠 getUsage

Retrieve usage statistics for nodes within a date range.

```typescript
sdk.node.getUsage(params?: GetUsageQueryParams) // { start?, end? }
```

---

## 🏢 SubscriptionApi

Accessed via `sdk.subscription`.

### 🛠 userSubscription

Provide a subscription link based on the user agent (Clash, V2Ray, etc.).

```typescript
sdk.subscription.userSubscription(token: string, headers?: UserSubscriptionHeaderParams)
```

### 🛠 userSubscriptionWithClientType

Provide a subscription link for a specific client type (e.g. `clash`, `v2ray`).

```typescript
sdk.subscription.userSubscriptionWithClientType(
  clientType: string,
  token: string,
  headers?: UserSubscriptionWithClientTypeHeaderParams,
)
```

### 🛠 userSubscriptionInfo

Retrieve detailed information about a user's subscription.

```typescript
sdk.subscription.userSubscriptionInfo(token: string)
```

### 🛠 userGetUsage

Fetch the usage statistics for a user within a date range.

```typescript
sdk.subscription.userGetUsage(token: string, params?: UserGetUsageQueryParams)
// params: { start?, end? }
```

---

## 🏢 SystemApi

Accessed via `sdk.system`.

### 🛠 getSystemStats

Fetch system stats including memory, CPU, and user metrics.

```typescript
sdk.system.getSystemStats()
```

### 🛠 getInbounds

Retrieve inbound configurations grouped by protocol.

```typescript
sdk.system.getInbounds()
```

### 🛠 getHosts

Get a list of proxy hosts grouped by inbound tag.

```typescript
sdk.system.getHosts()
```

### 🛠 modifyHosts

Modify proxy hosts and update the configuration.

```typescript
sdk.system.modifyHosts(data: ModifyHostsMutationRequest)
// data: a record of inbound tag → array of proxy host definitions
```

---

## 🏢 UserApi

Accessed via `sdk.user`.

### 🛠 addUser

Add a new user. Notable `UserCreate` fields: `username` (3–32 chars, `a-z`,
`0-9`, `_`), `status` (defaults to `active`; special rules for `on_hold`),
`expire` (UTC timestamp, `0` = unlimited), `data_limit` (bytes, `0` = unlimited),
`data_limit_reset_strategy`, `proxies`, `inbounds`, `note`, `on_hold_timeout`,
`on_hold_expire_duration`, `next_plan`.

```typescript
sdk.user.addUser(data: UserCreate)
```

### 🛠 getUser

Get user information.

```typescript
sdk.user.getUser(username: string)
```

### 🛠 modifyUser

Modify an existing user. Fields set to `null` or omitted are not changed;
`username` cannot be changed.

```typescript
sdk.user.modifyUser(username: string, data: UserModify)
```

### 🛠 removeUser

Remove a user.

```typescript
sdk.user.removeUser(username: string)
```

### 🛠 getUsers

Get all users with optional filtering and pagination.

```typescript
sdk.user.getUsers(params?: GetUsersQueryParams)
// params: { offset?, limit?, username?: string[], search?, admin?: string[], status?: UserStatus, sort? }
```

### 🛠 resetUserDataUsage

Reset a single user's data usage.

```typescript
sdk.user.resetUserDataUsage(username: string)
```

### 🛠 resetUsersDataUsage

Reset data usage for all users.

```typescript
sdk.user.resetUsersDataUsage()
```

### 🛠 revokeUserSubscription

Revoke a user's subscription (regenerates the subscription link and proxies).

```typescript
sdk.user.revokeUserSubscription(username: string)
```

### 🛠 activeNextPlan

Reset a user by their next plan.

```typescript
sdk.user.activeNextPlan(username: string)
```

### 🛠 setOwner

Set a new owner (admin) for a user. `admin_username` is required.

```typescript
sdk.user.setOwner(username: string, params: SetOwnerQueryParams)
// params: { admin_username }
```

### 🛠 getUserUsage

Get a single user's usage within a date range.

```typescript
sdk.user.getUserUsage(username: string, params?: GetUserUsageQueryParams)
// params: { start?, end? }
```

### 🛠 getUsersUsage

Get usage for all users within a date range.

```typescript
sdk.user.getUsersUsage(params?: GetUsersUsageQueryParams)
// params: { start?, end?, admin?: string[] }
```

### 🛠 getExpiredUsers

Get users who expired within a date range. At least one of `expired_after` /
`expired_before` is used for filtering; omitting both returns all expired users.

```typescript
sdk.user.getExpiredUsers(params?: GetExpiredUsersQueryParams)
// params: { expired_after?, expired_before? }
```

### 🛠 deleteExpiredUsers

Delete users who expired within a date range. At least one of `expired_after` /
`expired_before` must be provided.

```typescript
sdk.user.deleteExpiredUsers(params?: DeleteExpiredUsersQueryParams)
// params: { expired_after?, expired_before? }
```

---

## 🏢 UserTemplateApi

Accessed via `sdk.userTemplate`.

### 🛠 getUserTemplates

Get a list of user templates with optional pagination.

```typescript
sdk.userTemplate.getUserTemplates(params?: GetUserTemplatesQueryParams)
// params: { offset?, limit? }
```

### 🛠 getUserTemplateEndpoint

Get a single user template by ID.

```typescript
sdk.userTemplate.getUserTemplateEndpoint(templateId: number)
```

### 🛠 addUserTemplate

Add a new user template. Notable fields: `name` (≤ 64 chars), `data_limit`
(bytes, ≥ 0), `expire_duration` (seconds, ≥ 0), `inbounds` (protocol → inbound
tags; empty means all inbounds).

```typescript
sdk.userTemplate.addUserTemplate(data: UserTemplateCreate)
```

### 🛠 modifyUserTemplate

Modify a user template.

```typescript
sdk.userTemplate.modifyUserTemplate(templateId: number, data: UserTemplateModify)
```

### 🛠 removeUserTemplate

Remove a user template by its ID.

```typescript
sdk.userTemplate.removeUserTemplate(templateId: number)
```

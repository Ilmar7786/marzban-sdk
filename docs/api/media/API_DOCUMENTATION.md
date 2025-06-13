# API Documentation 🚀

Welcome to the API documentation. This document describes the available API endpoints, their parameters, and how to use them effectively.

## Table of Contents

- [AdminApi](#adminapi)
- [CoreApi](#coreapi)
- [DefaultApi](#defaultapi)
- [NodeApi](#nodeapi)
- [SubscriptionApi](#subscriptionapi)
- [SystemApi](#systemapi)
- [UserApi](#userapi)
- [UserTemplateApi](#usertemplateapi)

---

## 🏢 AdminApi

---

Description of the **AdminApi** class.

### 🛠 activateAllDisabledUsers

Activate all disabled users under a specific admin

**Parameters:**

- `username` (_string_) – Description here.
- `options?` (_RawAxiosRequestConfig_) – Description here.

### 🛠 adminToken

Authenticate an admin and issue a token.

**Parameters:**

- `username` (_string_) – Description here.
- `password` (_string_) – Description here.
- `grantType?` (_string | null_) – Description here.
- `scope?` (_string_) – Description here.
- `clientId?` (_string | null_) – Description here.
- `clientSecret?` (_string | null_) – Description here.
- `options?` (_RawAxiosRequestConfig_) – Description here.

### 🛠 createAdmin

Create a new admin if the current admin has sudo privileges.

**Parameters:**

- `adminCreate` (_AdminCreate_) – Description here.
- `options?` (_RawAxiosRequestConfig_) – Description here.

### 🛠 disableAllActiveUsers

Disable all active users under a specific admin

**Parameters:**

- `username` (_string_) – Description here.
- `options?` (_RawAxiosRequestConfig_) – Description here.

### 🛠 getAdminUsage

Retrieve the usage of given admin.

**Parameters:**

- `username` (_string_) – Description here.
- `options?` (_RawAxiosRequestConfig_) – Description here.

### 🛠 getAdmins

Fetch a list of admins with optional filters for pagination and username.

**Parameters:**

- `offset?` (_number | null_) – Description here.
- `limit?` (_number | null_) – Description here.
- `username?` (_string | null_) – Description here.
- `options?` (_RawAxiosRequestConfig_) – Description here.

### 🛠 getCurrentAdmin

Retrieve the current authenticated admin.

**Parameters:**

- `options?` (_RawAxiosRequestConfig_) – Description here.

### 🛠 modifyAdmin

Modify an existing admin\'s details.

**Parameters:**

- `username` (_string_) – Description here.
- `adminModify` (_AdminModify_) – Description here.
- `options?` (_RawAxiosRequestConfig_) – Description here.

### 🛠 removeAdmin

Remove an admin from the database.

**Parameters:**

- `username` (_string_) – Description here.
- `options?` (_RawAxiosRequestConfig_) – Description here.

### 🛠 resetAdminUsage

Resets usage of admin.

**Parameters:**

- `username` (_string_) – Description here.
- `options?` (_RawAxiosRequestConfig_) – Description here.

---

## 🏢 CoreApi

---

Description of the **CoreApi** class.

### 🛠 getCoreConfig

Get the current core configuration.

**Parameters:**

- `options?` (_RawAxiosRequestConfig_) – Description here.

### 🛠 getCoreStats

Retrieve core statistics such as version and uptime.

**Parameters:**

- `options?` (_RawAxiosRequestConfig_) – Description here.

### 🛠 modifyCoreConfig

Modify the core configuration and restart the core.

**Parameters:**

- `body` (_object_) – Description here.
- `options?` (_RawAxiosRequestConfig_) – Description here.

### 🛠 restartCore

Restart the core and all connected nodes.

**Parameters:**

- `options?` (_RawAxiosRequestConfig_) – Description here.

---

## 🏢 DefaultApi

---

Description of the **DefaultApi** class.

### 🛠 base

**Parameters:**

- `options?` (_RawAxiosRequestConfig_) – Description here.

---

## 🏢 NodeApi

---

Description of the **NodeApi** class.

### 🛠 addNode

Add a new node to the database and optionally add it as a host.

**Parameters:**

- `nodeCreate` (_NodeCreate_) – Description here.
- `options?` (_RawAxiosRequestConfig_) – Description here.

### 🛠 getNode

Retrieve details of a specific node by its ID.

**Parameters:**

- `nodeId` (_number_) – Description here.
- `options?` (_RawAxiosRequestConfig_) – Description here.

### 🛠 getNodeSettings

Retrieve the current node settings, including TLS certificate.

**Parameters:**

- `options?` (_RawAxiosRequestConfig_) – Description here.

### 🛠 getNodes

Retrieve a list of all nodes. Accessible only to sudo admins.

**Parameters:**

- `options?` (_RawAxiosRequestConfig_) – Description here.

### 🛠 getUsage

Retrieve usage statistics for nodes within a specified date range.

**Parameters:**

- `start?` (_string_) – Description here.
- `end?` (_string_) – Description here.
- `options?` (_RawAxiosRequestConfig_) – Description here.

### 🛠 modifyNode

Update a node\'s details. Only accessible to sudo admins.

**Parameters:**

- `nodeId` (_number_) – Description here.
- `nodeModify` (_NodeModify_) – Description here.
- `options?` (_RawAxiosRequestConfig_) – Description here.

### 🛠 reconnectNode

Trigger a reconnection for the specified node. Only accessible to sudo admins.

**Parameters:**

- `nodeId` (_number_) – Description here.
- `options?` (_RawAxiosRequestConfig_) – Description here.

### 🛠 removeNode

Delete a node and remove it from xray in the background.

**Parameters:**

- `nodeId` (_number_) – Description here.
- `options?` (_RawAxiosRequestConfig_) – Description here.

---

## 🏢 SubscriptionApi

---

Description of the **SubscriptionApi** class.

### 🛠 userGetUsage

Fetches the usage statistics for the user within a specified date range.

**Parameters:**

- `token` (_string_) – Description here.
- `start?` (_string_) – Description here.
- `end?` (_string_) – Description here.
- `options?` (_RawAxiosRequestConfig_) – Description here.

### 🛠 userSubscription

Provides a subscription link based on the user agent (Clash, V2Ray, etc.).

**Parameters:**

- `token` (_string_) – Description here.
- `userAgent?` (_string_) – Description here.
- `options?` (_RawAxiosRequestConfig_) – Description here.

### 🛠 userSubscriptionInfo

Retrieves detailed information about the user\'s subscription.

**Parameters:**

- `token` (_string_) – Description here.
- `options?` (_RawAxiosRequestConfig_) – Description here.

### 🛠 userSubscriptionWithClientType

Provides a subscription link based on the specified client type (e.g., Clash, V2Ray).

**Parameters:**

- `clientType` (_string_) – Description here.
- `token` (_string_) – Description here.
- `userAgent?` (_string_) – Description here.
- `options?` (_RawAxiosRequestConfig_) – Description here.

---

## 🏢 SystemApi

---

Description of the **SystemApi** class.

### 🛠 getHosts

Get a list of proxy hosts grouped by inbound tag.

**Parameters:**

- `options?` (_RawAxiosRequestConfig_) – Description here.

### 🛠 getInbounds

Retrieve inbound configurations grouped by protocol.

**Parameters:**

- `options?` (_RawAxiosRequestConfig_) – Description here.

### 🛠 getSystemStats

Fetch system stats including memory, CPU, and user metrics.

**Parameters:**

- `options?` (_RawAxiosRequestConfig_) – Description here.

### 🛠 modifyHosts

Modify proxy hosts and update the configuration.

**Parameters:**

- `requestBody` (_{ [key_) – Description here.
- `options?` (_RawAxiosRequestConfig_) – Description here.

---

## 🏢 UserApi

---

Description of the **UserApi** class.

### 🛠 activeNextPlan

Reset user by next plan

**Parameters:**

- `username` (_string_) – Description here.
- `options?` (_RawAxiosRequestConfig_) – Description here.

### 🛠 addUser

Add a new user - **username**: 3 to 32 characters, can include a-z, 0-9, and underscores. - **status**: User\'s status, defaults to `active`. Special rules if `on_hold`. - **expire**: UTC timestamp for account expiration. Use `0` for unlimited. - **data_limit**: Max data usage in bytes (e.g., `1073741824` for 1GB). `0` means unlimited. - **data_limit_reset_strategy**: Defines how/if data limit resets. `no_reset` means it never resets. - **proxies**: Dictionary of protocol settings (e.g., `vmess`, `vless`). - **inbounds**: Dictionary of protocol tags to specify inbound connections. - **note**: Optional text field for additional user information or notes. - **on_hold_timeout**: UTC timestamp when `on_hold` status should start or end. - **on_hold_expire_duration**: Duration (in seconds) for how long the user should stay in `on_hold` status. - **next_plan**: Next user plan (resets after use).

**Parameters:**

- `userCreate` (_UserCreate_) – Description here.
- `options?` (_RawAxiosRequestConfig_) – Description here.

### 🛠 deleteExpiredUsers

Delete users who have expired within the specified date range. - **expired_after** UTC datetime (optional) - **expired_before** UTC datetime (optional) - At least one of expired_after or expired_before must be provided

**Parameters:**

- `expiredAfter?` (_string | null_) – Description here.
- `expiredBefore?` (_string | null_) – Description here.
- `options?` (_RawAxiosRequestConfig_) – Description here.

### 🛠 getExpiredUsers

Get users who have expired within the specified date range. - **expired_after** UTC datetime (optional) - **expired_before** UTC datetime (optional) - At least one of expired_after or expired_before must be provided for filtering - If both are omitted, returns all expired users

**Parameters:**

- `expiredAfter?` (_string | null_) – Description here.
- `expiredBefore?` (_string | null_) – Description here.
- `options?` (_RawAxiosRequestConfig_) – Description here.

### 🛠 getUser

Get user information

**Parameters:**

- `username` (_string_) – Description here.
- `options?` (_RawAxiosRequestConfig_) – Description here.

### 🛠 getUserUsage

Get users usage

**Parameters:**

- `username` (_string_) – Description here.
- `start?` (_string_) – Description here.
- `end?` (_string_) – Description here.
- `options?` (_RawAxiosRequestConfig_) – Description here.

### 🛠 getUsers

Get all users

**Parameters:**

- `offset?` (_number_) – Description here.
- `limit?` (_number_) – Description here.
- `username?` (_Array<string>_) – Description here.
- `search?` (_string | null_) – Description here.
- `admin?` (_Array<string> | null_) – Description here.
- `status?` (_UserStatus_) – Description here.
- `sort?` (_string_) – Description here.
- `options?` (_RawAxiosRequestConfig_) – Description here.

### 🛠 getUsersUsage

Get all users usage

**Parameters:**

- `start?` (_string_) – Description here.
- `end?` (_string_) – Description here.
- `admin?` (_Array<string> | null_) – Description here.
- `options?` (_RawAxiosRequestConfig_) – Description here.

### 🛠 modifyUser

Modify an existing user - **username**: Cannot be changed. Used to identify the user. - **status**: User\'s new status. Can be \'active\', \'disabled\', \'on_hold\', \'limited\', or \'expired\'. - **expire**: UTC timestamp for new account expiration. Set to `0` for unlimited, `null` for no change. - **data_limit**: New max data usage in bytes (e.g., `1073741824` for 1GB). Set to `0` for unlimited, `null` for no change. - **data_limit_reset_strategy**: New strategy for data limit reset. Options include \'daily\', \'weekly\', \'monthly\', or \'no_reset\'. - **proxies**: Dictionary of new protocol settings (e.g., `vmess`, `vless`). Empty dictionary means no change. - **inbounds**: Dictionary of new protocol tags to specify inbound connections. Empty dictionary means no change. - **note**: New optional text for additional user information or notes. `null` means no change. - **on_hold_timeout**: New UTC timestamp for when `on_hold` status should start or end. Only applicable if status is changed to \'on_hold\'. - **on_hold_expire_duration**: New duration (in seconds) for how long the user should stay in `on_hold` status. Only applicable if status is changed to \'on_hold\'. - **next_plan**: Next user plan (resets after use). Note: Fields set to `null` or omitted will not be modified.

**Parameters:**

- `username` (_string_) – Description here.
- `userModify` (_UserModify_) – Description here.
- `options?` (_RawAxiosRequestConfig_) – Description here.

### 🛠 removeUser

Remove a user

**Parameters:**

- `username` (_string_) – Description here.
- `options?` (_RawAxiosRequestConfig_) – Description here.

### 🛠 resetUserDataUsage

Reset user data usage

**Parameters:**

- `username` (_string_) – Description here.
- `options?` (_RawAxiosRequestConfig_) – Description here.

### 🛠 resetUsersDataUsage

Reset all users data usage

**Parameters:**

- `options?` (_RawAxiosRequestConfig_) – Description here.

### 🛠 revokeUserSubscription

Revoke users subscription (Subscription link and proxies)

**Parameters:**

- `username` (_string_) – Description here.
- `options?` (_RawAxiosRequestConfig_) – Description here.

### 🛠 setOwner

Set a new owner (admin) for a user.

**Parameters:**

- `username` (_string_) – Description here.
- `adminUsername` (_string_) – Description here.
- `options?` (_RawAxiosRequestConfig_) – Description here.

---

## 🏢 UserTemplateApi

---

Description of the **UserTemplateApi** class.

### 🛠 addUserTemplate

Add a new user template - **name** can be up to 64 characters - **data_limit** must be in bytes and larger or equal to 0 - **expire_duration** must be in seconds and larger or equat to 0 - **inbounds** dictionary of protocol:inbound_tags, empty means all inbounds

**Parameters:**

- `userTemplateCreate` (_UserTemplateCreate_) – Description here.
- `options?` (_RawAxiosRequestConfig_) – Description here.

### 🛠 getUserTemplateEndpoint

Get User Template information with id

**Parameters:**

- `templateId` (_number_) – Description here.
- `options?` (_RawAxiosRequestConfig_) – Description here.

### 🛠 getUserTemplates

Get a list of User Templates with optional pagination

**Parameters:**

- `offset?` (_number_) – Description here.
- `limit?` (_number_) – Description here.
- `options?` (_RawAxiosRequestConfig_) – Description here.

### 🛠 modifyUserTemplate

Modify User Template - **name** can be up to 64 characters - **data_limit** must be in bytes and larger or equal to 0 - **expire_duration** must be in seconds and larger or equat to 0 - **inbounds** dictionary of protocol:inbound_tags, empty means all inbounds

**Parameters:**

- `templateId` (_number_) – Description here.
- `userTemplateModify` (_UserTemplateModify_) – Description here.
- `options?` (_RawAxiosRequestConfig_) – Description here.

### 🛠 removeUserTemplate

Remove a User Template by its ID

**Parameters:**

- `templateId` (_number_) – Description here.
- `options?` (_RawAxiosRequestConfig_) – Description here.

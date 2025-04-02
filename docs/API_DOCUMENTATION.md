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
- `username` (*string*) – Description here.
- `options?` (*RawAxiosRequestConfig*) – Description here.

### 🛠 adminToken
Authenticate an admin and issue a token.

**Parameters:**
- `username` (*string*) – Description here.
- `password` (*string*) – Description here.
- `grantType?` (*string | null*) – Description here.
- `scope?` (*string*) – Description here.
- `clientId?` (*string | null*) – Description here.
- `clientSecret?` (*string | null*) – Description here.
- `options?` (*RawAxiosRequestConfig*) – Description here.

### 🛠 createAdmin
Create a new admin if the current admin has sudo privileges.

**Parameters:**
- `adminCreate` (*AdminCreate*) – Description here.
- `options?` (*RawAxiosRequestConfig*) – Description here.

### 🛠 disableAllActiveUsers
Disable all active users under a specific admin

**Parameters:**
- `username` (*string*) – Description here.
- `options?` (*RawAxiosRequestConfig*) – Description here.

### 🛠 getAdminUsage
Retrieve the usage of given admin.

**Parameters:**
- `username` (*string*) – Description here.
- `options?` (*RawAxiosRequestConfig*) – Description here.

### 🛠 getAdmins
Fetch a list of admins with optional filters for pagination and username.

**Parameters:**
- `offset?` (*number | null*) – Description here.
- `limit?` (*number | null*) – Description here.
- `username?` (*string | null*) – Description here.
- `options?` (*RawAxiosRequestConfig*) – Description here.

### 🛠 getCurrentAdmin
Retrieve the current authenticated admin.

**Parameters:**
- `options?` (*RawAxiosRequestConfig*) – Description here.

### 🛠 modifyAdmin
Modify an existing admin\'s details.

**Parameters:**
- `username` (*string*) – Description here.
- `adminModify` (*AdminModify*) – Description here.
- `options?` (*RawAxiosRequestConfig*) – Description here.

### 🛠 removeAdmin
Remove an admin from the database.

**Parameters:**
- `username` (*string*) – Description here.
- `options?` (*RawAxiosRequestConfig*) – Description here.

### 🛠 resetAdminUsage
Resets usage of admin.

**Parameters:**
- `username` (*string*) – Description here.
- `options?` (*RawAxiosRequestConfig*) – Description here.


---
## 🏢 CoreApi
---
Description of the **CoreApi** class.

### 🛠 getCoreConfig
Get the current core configuration.

**Parameters:**
- `options?` (*RawAxiosRequestConfig*) – Description here.

### 🛠 getCoreStats
Retrieve core statistics such as version and uptime.

**Parameters:**
- `options?` (*RawAxiosRequestConfig*) – Description here.

### 🛠 modifyCoreConfig
Modify the core configuration and restart the core.

**Parameters:**
- `body` (*object*) – Description here.
- `options?` (*RawAxiosRequestConfig*) – Description here.

### 🛠 restartCore
Restart the core and all connected nodes.

**Parameters:**
- `options?` (*RawAxiosRequestConfig*) – Description here.


---
## 🏢 DefaultApi
---
Description of the **DefaultApi** class.

### 🛠 base


**Parameters:**
- `options?` (*RawAxiosRequestConfig*) – Description here.


---
## 🏢 NodeApi
---
Description of the **NodeApi** class.

### 🛠 addNode
Add a new node to the database and optionally add it as a host.

**Parameters:**
- `nodeCreate` (*NodeCreate*) – Description here.
- `options?` (*RawAxiosRequestConfig*) – Description here.

### 🛠 getNode
Retrieve details of a specific node by its ID.

**Parameters:**
- `nodeId` (*number*) – Description here.
- `options?` (*RawAxiosRequestConfig*) – Description here.

### 🛠 getNodeSettings
Retrieve the current node settings, including TLS certificate.

**Parameters:**
- `options?` (*RawAxiosRequestConfig*) – Description here.

### 🛠 getNodes
Retrieve a list of all nodes. Accessible only to sudo admins.

**Parameters:**
- `options?` (*RawAxiosRequestConfig*) – Description here.

### 🛠 getUsage
Retrieve usage statistics for nodes within a specified date range.

**Parameters:**
- `start?` (*string*) – Description here.
- `end?` (*string*) – Description here.
- `options?` (*RawAxiosRequestConfig*) – Description here.

### 🛠 modifyNode
Update a node\'s details. Only accessible to sudo admins.

**Parameters:**
- `nodeId` (*number*) – Description here.
- `nodeModify` (*NodeModify*) – Description here.
- `options?` (*RawAxiosRequestConfig*) – Description here.

### 🛠 reconnectNode
Trigger a reconnection for the specified node. Only accessible to sudo admins.

**Parameters:**
- `nodeId` (*number*) – Description here.
- `options?` (*RawAxiosRequestConfig*) – Description here.

### 🛠 removeNode
Delete a node and remove it from xray in the background.

**Parameters:**
- `nodeId` (*number*) – Description here.
- `options?` (*RawAxiosRequestConfig*) – Description here.


---
## 🏢 SubscriptionApi
---
Description of the **SubscriptionApi** class.

### 🛠 userGetUsage
Fetches the usage statistics for the user within a specified date range.

**Parameters:**
- `token` (*string*) – Description here.
- `start?` (*string*) – Description here.
- `end?` (*string*) – Description here.
- `options?` (*RawAxiosRequestConfig*) – Description here.

### 🛠 userSubscription
Provides a subscription link based on the user agent (Clash, V2Ray, etc.).

**Parameters:**
- `token` (*string*) – Description here.
- `userAgent?` (*string*) – Description here.
- `options?` (*RawAxiosRequestConfig*) – Description here.

### 🛠 userSubscriptionInfo
Retrieves detailed information about the user\'s subscription.

**Parameters:**
- `token` (*string*) – Description here.
- `options?` (*RawAxiosRequestConfig*) – Description here.

### 🛠 userSubscriptionWithClientType
Provides a subscription link based on the specified client type (e.g., Clash, V2Ray).

**Parameters:**
- `clientType` (*string*) – Description here.
- `token` (*string*) – Description here.
- `userAgent?` (*string*) – Description here.
- `options?` (*RawAxiosRequestConfig*) – Description here.


---
## 🏢 SystemApi
---
Description of the **SystemApi** class.

### 🛠 getHosts
Get a list of proxy hosts grouped by inbound tag.

**Parameters:**
- `options?` (*RawAxiosRequestConfig*) – Description here.

### 🛠 getInbounds
Retrieve inbound configurations grouped by protocol.

**Parameters:**
- `options?` (*RawAxiosRequestConfig*) – Description here.

### 🛠 getSystemStats
Fetch system stats including memory, CPU, and user metrics.

**Parameters:**
- `options?` (*RawAxiosRequestConfig*) – Description here.

### 🛠 modifyHosts
Modify proxy hosts and update the configuration.

**Parameters:**
- `requestBody` (*{ [key*) – Description here.
- `options?` (*RawAxiosRequestConfig*) – Description here.


---
## 🏢 UserApi
---
Description of the **UserApi** class.

### 🛠 activeNextPlan
Reset user by next plan

**Parameters:**
- `username` (*string*) – Description here.
- `options?` (*RawAxiosRequestConfig*) – Description here.

### 🛠 addUser
Add a new user  - **username**: 3 to 32 characters, can include a-z, 0-9, and underscores. - **status**: User\'s status, defaults to `active`. Special rules if `on_hold`. - **expire**: UTC timestamp for account expiration. Use `0` for unlimited. - **data_limit**: Max data usage in bytes (e.g., `1073741824` for 1GB). `0` means unlimited. - **data_limit_reset_strategy**: Defines how/if data limit resets. `no_reset` means it never resets. - **proxies**: Dictionary of protocol settings (e.g., `vmess`, `vless`). - **inbounds**: Dictionary of protocol tags to specify inbound connections. - **note**: Optional text field for additional user information or notes. - **on_hold_timeout**: UTC timestamp when `on_hold` status should start or end. - **on_hold_expire_duration**: Duration (in seconds) for how long the user should stay in `on_hold` status. - **next_plan**: Next user plan (resets after use).

**Parameters:**
- `userCreate` (*UserCreate*) – Description here.
- `options?` (*RawAxiosRequestConfig*) – Description here.

### 🛠 deleteExpiredUsers
Delete users who have expired within the specified date range.  - **expired_after** UTC datetime (optional) - **expired_before** UTC datetime (optional) - At least one of expired_after or expired_before must be provided

**Parameters:**
- `expiredAfter?` (*string | null*) – Description here.
- `expiredBefore?` (*string | null*) – Description here.
- `options?` (*RawAxiosRequestConfig*) – Description here.

### 🛠 getExpiredUsers
Get users who have expired within the specified date range.  - **expired_after** UTC datetime (optional) - **expired_before** UTC datetime (optional) - At least one of expired_after or expired_before must be provided for filtering - If both are omitted, returns all expired users

**Parameters:**
- `expiredAfter?` (*string | null*) – Description here.
- `expiredBefore?` (*string | null*) – Description here.
- `options?` (*RawAxiosRequestConfig*) – Description here.

### 🛠 getUser
Get user information

**Parameters:**
- `username` (*string*) – Description here.
- `options?` (*RawAxiosRequestConfig*) – Description here.

### 🛠 getUserUsage
Get users usage

**Parameters:**
- `username` (*string*) – Description here.
- `start?` (*string*) – Description here.
- `end?` (*string*) – Description here.
- `options?` (*RawAxiosRequestConfig*) – Description here.

### 🛠 getUsers
Get all users

**Parameters:**
- `offset?` (*number*) – Description here.
- `limit?` (*number*) – Description here.
- `username?` (*Array<string>*) – Description here.
- `search?` (*string | null*) – Description here.
- `admin?` (*Array<string> | null*) – Description here.
- `status?` (*UserStatus*) – Description here.
- `sort?` (*string*) – Description here.
- `options?` (*RawAxiosRequestConfig*) – Description here.

### 🛠 getUsersUsage
Get all users usage

**Parameters:**
- `start?` (*string*) – Description here.
- `end?` (*string*) – Description here.
- `admin?` (*Array<string> | null*) – Description here.
- `options?` (*RawAxiosRequestConfig*) – Description here.

### 🛠 modifyUser
Modify an existing user  - **username**: Cannot be changed. Used to identify the user. - **status**: User\'s new status. Can be \'active\', \'disabled\', \'on_hold\', \'limited\', or \'expired\'. - **expire**: UTC timestamp for new account expiration. Set to `0` for unlimited, `null` for no change. - **data_limit**: New max data usage in bytes (e.g., `1073741824` for 1GB). Set to `0` for unlimited, `null` for no change. - **data_limit_reset_strategy**: New strategy for data limit reset. Options include \'daily\', \'weekly\', \'monthly\', or \'no_reset\'. - **proxies**: Dictionary of new protocol settings (e.g., `vmess`, `vless`). Empty dictionary means no change. - **inbounds**: Dictionary of new protocol tags to specify inbound connections. Empty dictionary means no change. - **note**: New optional text for additional user information or notes. `null` means no change. - **on_hold_timeout**: New UTC timestamp for when `on_hold` status should start or end. Only applicable if status is changed to \'on_hold\'. - **on_hold_expire_duration**: New duration (in seconds) for how long the user should stay in `on_hold` status. Only applicable if status is changed to \'on_hold\'. - **next_plan**: Next user plan (resets after use).  Note: Fields set to `null` or omitted will not be modified.

**Parameters:**
- `username` (*string*) – Description here.
- `userModify` (*UserModify*) – Description here.
- `options?` (*RawAxiosRequestConfig*) – Description here.

### 🛠 removeUser
Remove a user

**Parameters:**
- `username` (*string*) – Description here.
- `options?` (*RawAxiosRequestConfig*) – Description here.

### 🛠 resetUserDataUsage
Reset user data usage

**Parameters:**
- `username` (*string*) – Description here.
- `options?` (*RawAxiosRequestConfig*) – Description here.

### 🛠 resetUsersDataUsage
Reset all users data usage

**Parameters:**
- `options?` (*RawAxiosRequestConfig*) – Description here.

### 🛠 revokeUserSubscription
Revoke users subscription (Subscription link and proxies)

**Parameters:**
- `username` (*string*) – Description here.
- `options?` (*RawAxiosRequestConfig*) – Description here.

### 🛠 setOwner
Set a new owner (admin) for a user.

**Parameters:**
- `username` (*string*) – Description here.
- `adminUsername` (*string*) – Description here.
- `options?` (*RawAxiosRequestConfig*) – Description here.


---
## 🏢 UserTemplateApi
---
Description of the **UserTemplateApi** class.

### 🛠 addUserTemplate
Add a new user template  - **name** can be up to 64 characters - **data_limit** must be in bytes and larger or equal to 0 - **expire_duration** must be in seconds and larger or equat to 0 - **inbounds** dictionary of protocol:inbound_tags, empty means all inbounds

**Parameters:**
- `userTemplateCreate` (*UserTemplateCreate*) – Description here.
- `options?` (*RawAxiosRequestConfig*) – Description here.

### 🛠 getUserTemplateEndpoint
Get User Template information with id

**Parameters:**
- `templateId` (*number*) – Description here.
- `options?` (*RawAxiosRequestConfig*) – Description here.

### 🛠 getUserTemplates
Get a list of User Templates with optional pagination

**Parameters:**
- `offset?` (*number*) – Description here.
- `limit?` (*number*) – Description here.
- `options?` (*RawAxiosRequestConfig*) – Description here.

### 🛠 modifyUserTemplate
Modify User Template  - **name** can be up to 64 characters - **data_limit** must be in bytes and larger or equal to 0 - **expire_duration** must be in seconds and larger or equat to 0 - **inbounds** dictionary of protocol:inbound_tags, empty means all inbounds

**Parameters:**
- `templateId` (*number*) – Description here.
- `userTemplateModify` (*UserTemplateModify*) – Description here.
- `options?` (*RawAxiosRequestConfig*) – Description here.

### 🛠 removeUserTemplate
Remove a User Template by its ID

**Parameters:**
- `templateId` (*number*) – Description here.
- `options?` (*RawAxiosRequestConfig*) – Description here.


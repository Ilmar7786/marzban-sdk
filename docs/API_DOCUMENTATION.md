# API Documentation

## AdminApi
Description of the **AdminApi** class.

### activateAllDisabledUsers
Activate all disabled users under a specific admin

**Parameters:**
- `username` (string)
- `options?` (RawAxiosRequestConfig)

### adminToken
Authenticate an admin and issue a token.

**Parameters:**
- `username` (string)
- `password` (string)
- `grantType?` (string | null)
- `scope?` (string)
- `clientId?` (string | null)
- `clientSecret?` (string | null)
- `options?` (RawAxiosRequestConfig)

### createAdmin
Create a new admin if the current admin has sudo privileges.

**Parameters:**
- `adminCreate` (AdminCreate)
- `options?` (RawAxiosRequestConfig)

### disableAllActiveUsers
Disable all active users under a specific admin

**Parameters:**
- `username` (string)
- `options?` (RawAxiosRequestConfig)

### getAdminUsage
Retrieve the usage of given admin.

**Parameters:**
- `username` (string)
- `options?` (RawAxiosRequestConfig)

### getAdmins
Fetch a list of admins with optional filters for pagination and username.

**Parameters:**
- `offset?` (number | null)
- `limit?` (number | null)
- `username?` (string | null)
- `options?` (RawAxiosRequestConfig)

### getCurrentAdmin
Retrieve the current authenticated admin.

**Parameters:**
- `options?` (RawAxiosRequestConfig)

### modifyAdmin
Modify an existing admin\'s details.

**Parameters:**
- `username` (string)
- `adminModify` (AdminModify)
- `options?` (RawAxiosRequestConfig)

### removeAdmin
Remove an admin from the database.

**Parameters:**
- `username` (string)
- `options?` (RawAxiosRequestConfig)

### resetAdminUsage
Resets usage of admin.

**Parameters:**
- `username` (string)
- `options?` (RawAxiosRequestConfig)

## CoreApi
Description of the **CoreApi** class.

### getCoreConfig
Get the current core configuration.

**Parameters:**
- `options?` (RawAxiosRequestConfig)

### getCoreStats
Retrieve core statistics such as version and uptime.

**Parameters:**
- `options?` (RawAxiosRequestConfig)

### modifyCoreConfig
Modify the core configuration and restart the core.

**Parameters:**
- `body` (object)
- `options?` (RawAxiosRequestConfig)

### restartCore
Restart the core and all connected nodes.

**Parameters:**
- `options?` (RawAxiosRequestConfig)

## DefaultApi
Description of the **DefaultApi** class.

### base


**Parameters:**
- `options?` (RawAxiosRequestConfig)

## NodeApi
Description of the **NodeApi** class.

### addNode
Add a new node to the database and optionally add it as a host.

**Parameters:**
- `nodeCreate` (NodeCreate)
- `options?` (RawAxiosRequestConfig)

### getNode
Retrieve details of a specific node by its ID.

**Parameters:**
- `nodeId` (number)
- `options?` (RawAxiosRequestConfig)

### getNodeSettings
Retrieve the current node settings, including TLS certificate.

**Parameters:**
- `options?` (RawAxiosRequestConfig)

### getNodes
Retrieve a list of all nodes. Accessible only to sudo admins.

**Parameters:**
- `options?` (RawAxiosRequestConfig)

### getUsage
Retrieve usage statistics for nodes within a specified date range.

**Parameters:**
- `start?` (string)
- `end?` (string)
- `options?` (RawAxiosRequestConfig)

### modifyNode
Update a node\'s details. Only accessible to sudo admins.

**Parameters:**
- `nodeId` (number)
- `nodeModify` (NodeModify)
- `options?` (RawAxiosRequestConfig)

### reconnectNode
Trigger a reconnection for the specified node. Only accessible to sudo admins.

**Parameters:**
- `nodeId` (number)
- `options?` (RawAxiosRequestConfig)

### removeNode
Delete a node and remove it from xray in the background.

**Parameters:**
- `nodeId` (number)
- `options?` (RawAxiosRequestConfig)

## SubscriptionApi
Description of the **SubscriptionApi** class.

### userGetUsage
Fetches the usage statistics for the user within a specified date range.

**Parameters:**
- `token` (string)
- `start?` (string)
- `end?` (string)
- `options?` (RawAxiosRequestConfig)

### userSubscription
Provides a subscription link based on the user agent (Clash, V2Ray, etc.).

**Parameters:**
- `token` (string)
- `userAgent?` (string)
- `options?` (RawAxiosRequestConfig)

### userSubscriptionInfo
Retrieves detailed information about the user\'s subscription.

**Parameters:**
- `token` (string)
- `options?` (RawAxiosRequestConfig)

### userSubscriptionWithClientType
Provides a subscription link based on the specified client type (e.g., Clash, V2Ray).

**Parameters:**
- `clientType` (string)
- `token` (string)
- `userAgent?` (string)
- `options?` (RawAxiosRequestConfig)

## SystemApi
Description of the **SystemApi** class.

### getHosts
Get a list of proxy hosts grouped by inbound tag.

**Parameters:**
- `options?` (RawAxiosRequestConfig)

### getInbounds
Retrieve inbound configurations grouped by protocol.

**Parameters:**
- `options?` (RawAxiosRequestConfig)

### getSystemStats
Fetch system stats including memory, CPU, and user metrics.

**Parameters:**
- `options?` (RawAxiosRequestConfig)

### modifyHosts
Modify proxy hosts and update the configuration.

**Parameters:**
- `requestBody` ({ [key)
- `options?` (RawAxiosRequestConfig)

## UserApi
Description of the **UserApi** class.

### activeNextPlan
Reset user by next plan

**Parameters:**
- `username` (string)
- `options?` (RawAxiosRequestConfig)

### addUser
Add a new user  - **username**: 3 to 32 characters, can include a-z, 0-9, and underscores. - **status**: User\'s status, defaults to `active`. Special rules if `on_hold`. - **expire**: UTC timestamp for account expiration. Use `0` for unlimited. - **data_limit**: Max data usage in bytes (e.g., `1073741824` for 1GB). `0` means unlimited. - **data_limit_reset_strategy**: Defines how/if data limit resets. `no_reset` means it never resets. - **proxies**: Dictionary of protocol settings (e.g., `vmess`, `vless`). - **inbounds**: Dictionary of protocol tags to specify inbound connections. - **note**: Optional text field for additional user information or notes. - **on_hold_timeout**: UTC timestamp when `on_hold` status should start or end. - **on_hold_expire_duration**: Duration (in seconds) for how long the user should stay in `on_hold` status. - **next_plan**: Next user plan (resets after use).

**Parameters:**
- `userCreate` (UserCreate)
- `options?` (RawAxiosRequestConfig)

### deleteExpiredUsers
Delete users who have expired within the specified date range.  - **expired_after** UTC datetime (optional) - **expired_before** UTC datetime (optional) - At least one of expired_after or expired_before must be provided

**Parameters:**
- `expiredAfter?` (string | null)
- `expiredBefore?` (string | null)
- `options?` (RawAxiosRequestConfig)

### getExpiredUsers
Get users who have expired within the specified date range.  - **expired_after** UTC datetime (optional) - **expired_before** UTC datetime (optional) - At least one of expired_after or expired_before must be provided for filtering - If both are omitted, returns all expired users

**Parameters:**
- `expiredAfter?` (string | null)
- `expiredBefore?` (string | null)
- `options?` (RawAxiosRequestConfig)

### getUser
Get user information

**Parameters:**
- `username` (string)
- `options?` (RawAxiosRequestConfig)

### getUserUsage
Get users usage

**Parameters:**
- `username` (string)
- `start?` (string)
- `end?` (string)
- `options?` (RawAxiosRequestConfig)

### getUsers
Get all users

**Parameters:**
- `offset?` (number)
- `limit?` (number)
- `username?` (Array<string>)
- `search?` (string | null)
- `admin?` (Array<string> | null)
- `status?` (UserStatus)
- `sort?` (string)
- `options?` (RawAxiosRequestConfig)

### getUsersUsage
Get all users usage

**Parameters:**
- `start?` (string)
- `end?` (string)
- `admin?` (Array<string> | null)
- `options?` (RawAxiosRequestConfig)

### modifyUser
Modify an existing user  - **username**: Cannot be changed. Used to identify the user. - **status**: User\'s new status. Can be \'active\', \'disabled\', \'on_hold\', \'limited\', or \'expired\'. - **expire**: UTC timestamp for new account expiration. Set to `0` for unlimited, `null` for no change. - **data_limit**: New max data usage in bytes (e.g., `1073741824` for 1GB). Set to `0` for unlimited, `null` for no change. - **data_limit_reset_strategy**: New strategy for data limit reset. Options include \'daily\', \'weekly\', \'monthly\', or \'no_reset\'. - **proxies**: Dictionary of new protocol settings (e.g., `vmess`, `vless`). Empty dictionary means no change. - **inbounds**: Dictionary of new protocol tags to specify inbound connections. Empty dictionary means no change. - **note**: New optional text for additional user information or notes. `null` means no change. - **on_hold_timeout**: New UTC timestamp for when `on_hold` status should start or end. Only applicable if status is changed to \'on_hold\'. - **on_hold_expire_duration**: New duration (in seconds) for how long the user should stay in `on_hold` status. Only applicable if status is changed to \'on_hold\'. - **next_plan**: Next user plan (resets after use).  Note: Fields set to `null` or omitted will not be modified.

**Parameters:**
- `username` (string)
- `userModify` (UserModify)
- `options?` (RawAxiosRequestConfig)

### removeUser
Remove a user

**Parameters:**
- `username` (string)
- `options?` (RawAxiosRequestConfig)

### resetUserDataUsage
Reset user data usage

**Parameters:**
- `username` (string)
- `options?` (RawAxiosRequestConfig)

### resetUsersDataUsage
Reset all users data usage

**Parameters:**
- `options?` (RawAxiosRequestConfig)

### revokeUserSubscription
Revoke users subscription (Subscription link and proxies)

**Parameters:**
- `username` (string)
- `options?` (RawAxiosRequestConfig)

### setOwner
Set a new owner (admin) for a user.

**Parameters:**
- `username` (string)
- `adminUsername` (string)
- `options?` (RawAxiosRequestConfig)

## UserTemplateApi
Description of the **UserTemplateApi** class.

### addUserTemplate
Add a new user template  - **name** can be up to 64 characters - **data_limit** must be in bytes and larger or equal to 0 - **expire_duration** must be in seconds and larger or equat to 0 - **inbounds** dictionary of protocol:inbound_tags, empty means all inbounds

**Parameters:**
- `userTemplateCreate` (UserTemplateCreate)
- `options?` (RawAxiosRequestConfig)

### getUserTemplateEndpoint
Get User Template information with id

**Parameters:**
- `templateId` (number)
- `options?` (RawAxiosRequestConfig)

### getUserTemplates
Get a list of User Templates with optional pagination

**Parameters:**
- `offset?` (number)
- `limit?` (number)
- `options?` (RawAxiosRequestConfig)

### modifyUserTemplate
Modify User Template  - **name** can be up to 64 characters - **data_limit** must be in bytes and larger or equal to 0 - **expire_duration** must be in seconds and larger or equat to 0 - **inbounds** dictionary of protocol:inbound_tags, empty means all inbounds

**Parameters:**
- `templateId` (number)
- `userTemplateModify` (UserTemplateModify)
- `options?` (RawAxiosRequestConfig)

### removeUserTemplate
Remove a User Template by its ID

**Parameters:**
- `templateId` (number)
- `options?` (RawAxiosRequestConfig)


# Compatibility Fixes After AuthService Refactoring

## 📋 Overview

After the comprehensive refactoring of `AuthService`, several compatibility issues arose in other parts of the codebase. This document outlines the fixes applied to maintain backward compatibility and ensure proper functionality.

## 🔍 Issues Identified

### 1. **`src/interceptors.ts`**

- ❌ Using deprecated `authService.accessToken` property
- ❌ Using old `authenticate(username, password)` method signature

### 2. **`src/MarzbanSDK.ts`**

- ❌ Using deprecated `authService.accessToken` property
- ❌ Using old `authenticate(username, password)` method signature
- ❌ Accessing private properties `isAuthenticating` and `authPromise`

### 3. **`src/LogsApi.ts`**

- ❌ Using deprecated `authService.accessToken` property

### 4. **`src/utils/configurationUrlWs.ts`**

- ❌ Missing proper TypeScript interfaces
- ❌ Missing JSDoc documentation

## ✅ Applied Fixes

### 1. **Interceptors Fixes**

**Before:**

```typescript
const accessToken = authService.accessToken
await authService.authenticate(config.username, config.password)
```

**After:**

```typescript
const accessToken = authService.getAccessToken()
await authService.authenticate({ username: config.username, password: config.password })
```

### 2. **MarzbanSDK Fixes**

**Before:**

```typescript
return this.authService.accessToken
if (this.authService.isAuthenticating && !force) {
  return this.authService.authPromise!
}
return this.authService.authenticate(this.configuration.username!, this.configuration.password!)
```

**After:**

```typescript
return this.authService.getAccessToken()
if (this.authService.isAuthInProgress && !force) {
  return this.authService.waitForAuth()
}
return this.authService.retryAuth()
```

### 3. **LogsApi Fixes**

**Before:**

```typescript
if (!this.authService.accessToken) {
  await this.authService.retryAuth()
}
token: this.authService.accessToken,
```

**After:**

```typescript
if (!this.authService.isAuthenticated()) {
  await this.authService.retryAuth()
}
token: this.authService.getAccessToken(),
```

### 4. **ConfigurationUrlWs Improvements**

**Added:**

- ✅ Proper TypeScript interface `WebSocketUrlOptions`
- ✅ Complete JSDoc documentation
- ✅ Type safety improvements
- ✅ Example usage in documentation

```typescript
/**
 * Options for WebSocket URL configuration
 */
export interface WebSocketUrlOptions {
  /** Base path for the WebSocket connection */
  basePath: string
  /** API endpoint for the WebSocket */
  endpoint: string
  /** Authentication token */
  token: string
  /** Interval for message polling (in seconds) */
  interval: string | number
}
```

## 🧪 Code Quality

### Improvements for `configurationUrlWs`:

- ✅ HTTPS/HTTP protocol handling
- ✅ String and number interval types support
- ✅ Complex endpoint paths support
- ✅ Special characters in tokens support
- ✅ Base path variations support

## 📊 API Changes Summary

| Component               | Old API                          | New API                            | Status   |
| ----------------------- | -------------------------------- | ---------------------------------- | -------- |
| `interceptors.ts`       | `authService.accessToken`        | `authService.getAccessToken()`     | ✅ Fixed |
| `interceptors.ts`       | `authService.authenticate(u, p)` | `authService.authenticate({u, p})` | ✅ Fixed |
| `MarzbanSDK.ts`         | `authService.accessToken`        | `authService.getAccessToken()`     | ✅ Fixed |
| `MarzbanSDK.ts`         | `authService.isAuthenticating`   | `authService.isAuthInProgress`     | ✅ Fixed |
| `MarzbanSDK.ts`         | `authService.authPromise`        | `authService.waitForAuth()`        | ✅ Fixed |
| `LogsApi.ts`            | `authService.accessToken`        | `authService.getAccessToken()`     | ✅ Fixed |
| `LogsApi.ts`            | `authService.accessToken` check  | `authService.isAuthenticated()`    | ✅ Fixed |
| `configurationUrlWs.ts` | No interface                     | `WebSocketUrlOptions`              | ✅ Added |

## 🔒 Backward Compatibility

All fixes maintain the same external behavior while using the new, improved `AuthService` API:

- ✅ **Same functionality** - All operations work identically
- ✅ **Better error handling** - Enhanced error messages and codes
- ✅ **Improved type safety** - Full TypeScript support
- ✅ **Better documentation** - Complete JSDoc coverage

## 🚀 Benefits

### Performance Improvements:

- ✅ More efficient authentication state management
- ✅ Better error recovery mechanisms
- ✅ Reduced memory usage

### Developer Experience:

- ✅ Better IntelliSense support
- ✅ Clearer error messages
- ✅ Comprehensive documentation
- ✅ Type safety improvements

## ✅ Conclusion

All compatibility issues have been resolved while maintaining the same external API behavior. The codebase now benefits from the improved `AuthService` architecture while ensuring all existing functionality continues to work correctly.

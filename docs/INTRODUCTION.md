# Documentation Guide 📚

Welcome to MarzbanSDK documentation! This guide will help you navigate all available resources.

## Quick Navigation

### Getting Started
- **[README.md](../README.md)** – Overview, features, installation, and quick start using `createMarzbanSDK`

### Core Guides
- **[Configuration](../README.md#-configuration-options)** – SDK configuration options
- **[Authorization](../README.md#-authorization-control)** – Authentication methods

### Feature Documentation

#### Error Handling
- **[ERRORS.md](./ERRORS.md)** – Comprehensive error handling guide
  - Error codes and categories
  - Error classes and type guards
  - Error handling patterns
  - Best practices

#### Data Validation
- **[VALIDATION.md](./VALIDATION.md)** – Runtime validation with Zod
  - Configuration validation
  - Webhook validation
  - Schema inference
  - Custom validation examples

#### Webhook Support
- **[WEBHOOK.md](./WEBHOOK.md)** – Real-time event handling
  - Webhook events reference (user lifecycle, data usage, subscriptions)
  - Setup via `sdk.webhook` instance
  - Event subscription (specific, wildcard, batch)
  - Signature verification (HMAC-SHA256)
  - Custom webhook implementations with utilities and schemas

#### Utility Functions
- **[UTILITIES.md](./UTILITIES.md)** – Helper utilities
  - Bytes conversion (parseSize, formatBytes)
  - Datetime utilities (addDays, remainingTime)
  - Template variables

#### API Reference
- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** – Complete API endpoint reference
  - All available endpoints
  - Parameters and responses
  - Zod validation

#### WebSocket
- **[WEBSOCKET.md](./WEBSOCKET.md)** – Real-time log streaming
  - WebSocket connection setup
  - Log filtering
  - Event handling

### Contributing
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** – Contribution guidelines

## Common Tasks

### Task: Set up SDK with error handling
→ See [Authorization Control](../README.md#-authorization-control) and [Error Handling Guide](./ERRORS.md)

### Task: Handle webhook events
→ See [Webhook Guide](./WEBHOOK.md)

### Task: Validate user input
→ See [Validation Guide](./VALIDATION.md)

### Task: Work with data sizes
→ See [Utilities Guide](./UTILITIES.md#bytes-utilities)

### Task: Stream logs
→ See [WebSocket Guide](./WEBSOCKET.md)

## API Methods by Category

### User Management
- Get users – `sdk.user.getUsers()`
- Get user – `sdk.user.getUser(username)`
- Add user – `sdk.user.addUser(userCreate)`
- Modify user – `sdk.user.modifyUser(username, userModify)`
- Remove user – `sdk.user.removeUser(username)`
- [Full UserApi reference →](./API_DOCUMENTATION.md#-userapi)

### Admin Management
- Get admins – `sdk.admin.getAdmins()`
- Get current admin – `sdk.admin.getCurrentAdmin()`
- Create admin – `sdk.admin.createAdmin(adminCreate)`
- Modify admin – `sdk.admin.modifyAdmin(username, adminModify)`
- Remove admin – `sdk.admin.removeAdmin(username)`
- [Full AdminApi reference →](./API_DOCUMENTATION.md#-adminapi)

### Node Management
- Get nodes – `sdk.node.getNodes()`
- Get node – `sdk.node.getNode(nodeId)`
- Add node – `sdk.node.addNode(nodeCreate)`
- Modify node – `sdk.node.modifyNode(nodeId, nodeModify)`
- Remove node – `sdk.node.removeNode(nodeId)`
- [Full NodeApi reference →](./API_DOCUMENTATION.md#-nodeapi)

### System Management
- Get system stats – `sdk.system.getSystemStats()`
- Get inbounds – `sdk.system.getInbounds()`
- Get hosts – `sdk.system.getHosts()`
- [Full SystemApi reference →](./API_DOCUMENTATION.md#-systemapi)

### Core Management
- Get core stats – `sdk.core.getCoreStats()`
- Get core config – `sdk.core.getCoreConfig()`
- Modify core config – `sdk.core.modifyCoreConfig(config)`
- Restart core – `sdk.core.restartCore()`
- [Full CoreApi reference →](./API_DOCUMENTATION.md#-coreapi)

### User Subscriptions
- Get subscription – `sdk.subscription.userSubscription(token)`
- Get subscription info – `sdk.subscription.userSubscriptionInfo(token)`
- Get usage – `sdk.subscription.userGetUsage(token, dateRange)`
- [Full SubscriptionApi reference →](./API_DOCUMENTATION.md#-subscriptionapi)

### User Templates
- Get templates – `sdk.userTemplate.getUserTemplates()`
- Get template – `sdk.userTemplate.getUserTemplateEndpoint(templateId)`
- Add template – `sdk.userTemplate.addUserTemplate(templateCreate)`
- Modify template – `sdk.userTemplate.modifyUserTemplate(templateId, templateModify)`
- Remove template – `sdk.userTemplate.removeUserTemplate(templateId)`
- [Full UserTemplateApi reference →](./API_DOCUMENTATION.md#-usertemplateapi)

## Documentation Conventions

### Code Examples
- TypeScript examples with full type hints
- Comments explain non-obvious parts
- Complete, runnable examples

### Type References
- Types shown in code blocks or inline
- Links to API_DOCUMENTATION for complex types
- Zod schema definitions where applicable

### Best Practices
- Listed at the end of each guide
- Based on real-world usage patterns
- Include error handling considerations

## Version Information

This documentation covers **MarzbanSDK v2.0.0**

### What's New in v2.0.0
- 🎯 Classified error system with type guards
- 🔒 Zod-based runtime validation
- 📨 Complete webhook implementation
- 🛠️ Enhanced utility functions
- 🔄 Improved error messages and details

## Need Help?

1. **Check the relevant guide** – Each feature has dedicated documentation
2. **See examples** – Every guide includes practical examples
3. **Check API docs** – All endpoints documented in [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
4. **Review error guide** – [ERRORS.md](./ERRORS.md) has error handling patterns
5. **Open an issue** – [GitHub Issues](https://github.com/Ilmar7786/marzban-sdk/issues)

## Related Resources

- **[Official Marzban Docs](https://gozargah.github.io/marzban/)** – Marzban project documentation
- **[OpenAPI Spec](../openapi/)** – API specification
- **[GitHub Repository](https://github.com/Ilmar7786/marzban-sdk)** – Source code and issues
- **[npm Package](https://www.npmjs.com/package/marzban-sdk)** – Install latest version

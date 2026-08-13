import { configModule } from './config/config.module'
import { nodesModule } from './nodes/nodes.module'
import { subscriptionModule } from './subscription/subscription.module'
import { systemModule } from './system/system.module'
import { usersModule } from './users/users.module'

// The single point of contact for adding a new module: import its exported
// tool array and add one line here. Nothing else in the server needs to
// change — registry.ts filters/renders/registers whatever ends up in this list.
export const allTools = [...usersModule, ...configModule, ...systemModule, ...nodesModule, ...subscriptionModule]

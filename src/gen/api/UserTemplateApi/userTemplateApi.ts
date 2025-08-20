import { addUserTemplate } from './addUserTemplate.ts'
import { getUserTemplateEndpoint } from './getUserTemplateEndpoint.ts'
import { getUserTemplates } from './getUserTemplates.ts'
import { modifyUserTemplate } from './modifyUserTemplate.ts'
import { removeUserTemplate } from './removeUserTemplate.ts'

export function userTemplateApi() {
  return { addUserTemplate, getUserTemplates, getUserTemplateEndpoint, modifyUserTemplate, removeUserTemplate }
}

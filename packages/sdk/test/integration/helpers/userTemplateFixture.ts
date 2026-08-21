import { isHttpError, type MarzbanSDK } from '../../../src/index'

/** `removeUserTemplate` counterpart to {@link removeAdminTolerantly} — swallows "already gone", not a known 500 quirk here. */
export async function removeUserTemplateTolerantly(sdk: MarzbanSDK, templateId: number): Promise<void> {
  try {
    await sdk.userTemplate.removeUserTemplate(templateId)
  } catch (err) {
    if (isHttpError(err) && err.status === 404) return
    throw err
  }
}

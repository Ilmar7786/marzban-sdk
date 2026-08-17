import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'

import type { HttpError, MarzbanSDK } from '../../src/index'
import { createTestAdmin, removeAdminTolerantly } from './helpers/adminFixture'
import { createCleanupRegistry, uniqueTestName } from './helpers/cleanup'
import { createTestSdk } from './helpers/client'
import { removeUserTemplateTolerantly } from './helpers/userTemplateFixture'

describe('user template integration', () => {
  let sdk: MarzbanSDK
  const cleanup = createCleanupRegistry()

  beforeAll(async () => {
    sdk = await createTestSdk()
  })

  afterEach(async () => {
    await cleanup.runAll()
  })

  afterAll(async () => {
    await sdk.destroy()
  })

  it('creates, fetches, partially updates, and removes a template (happy path)', async () => {
    const name = uniqueTestName('template-happy')

    const created = await sdk.userTemplate.addUserTemplate({
      name,
      data_limit: 1_073_741_824,
      expire_duration: 86_400,
      username_prefix: 'px-',
      username_suffix: '-sx',
      inbounds: { shadowsocks: ['Shadowsocks TCP'] },
    })
    cleanup.register(() => removeUserTemplateTolerantly(sdk, created.id))
    expect(created.name).toBe(name)
    expect(created.inbounds).toEqual({ shadowsocks: ['Shadowsocks TCP'] })

    const fetched = await sdk.userTemplate.getUserTemplateEndpoint(created.id)
    expect(fetched).toEqual(created)

    // Partial PATCH semantics: only data_limit is sent, everything else
    // (name, expire_duration, prefixes, inbounds) must come back unchanged.
    const modified = await sdk.userTemplate.modifyUserTemplate(created.id, { data_limit: 2_147_483_648 })
    expect(modified.data_limit).toBe(2_147_483_648)
    expect(modified.name).toBe(name)
    expect(modified.expire_duration).toBe(created.expire_duration)
    expect(modified.inbounds).toEqual(created.inbounds)

    await sdk.userTemplate.removeUserTemplate(created.id)
    await expect(sdk.userTemplate.getUserTemplateEndpoint(created.id)).rejects.toMatchObject({
      status: 404,
    } satisfies Partial<HttpError>)
  })

  it('rejects creating a template without a name, even against an empty template list (verified live-panel quirk)', async () => {
    // docs/marzban-quirks.md: an omitted/null name always 409s "Template by
    // this name already exists" — not merely "on the second attempt", it
    // reproduces from a clean table with zero templates.
    await expect(sdk.userTemplate.addUserTemplate({})).rejects.toMatchObject({
      status: 409,
    } satisfies Partial<HttpError>)
  })

  it('rejects creating a template with a name that already exists', async () => {
    const name = uniqueTestName('template-dup')
    const created = await sdk.userTemplate.addUserTemplate({ name })
    cleanup.register(() => removeUserTemplateTolerantly(sdk, created.id))

    await expect(sdk.userTemplate.addUserTemplate({ name })).rejects.toMatchObject({
      status: 409,
    } satisfies Partial<HttpError>)
  })

  it('silently drops inbound tags that do not match a real inbound on the panel (verified live-panel quirk)', async () => {
    const name = uniqueTestName('template-bogus-inbound')

    const created = await sdk.userTemplate.addUserTemplate({
      name,
      inbounds: { shadowsocks: ['Shadowsocks TCP', 'sdk-it-no-such-tag'] },
    })
    cleanup.register(() => removeUserTemplateTolerantly(sdk, created.id))

    // The bogus tag is dropped, not rejected — no error, no validation
    // message, and the valid tag alongside it survives.
    expect(created.inbounds).toEqual({ shadowsocks: ['Shadowsocks TCP'] })

    const onlyBogus = await sdk.userTemplate.addUserTemplate({
      name: uniqueTestName('template-all-bogus'),
      inbounds: { shadowsocks: ['sdk-it-no-such-tag'] },
    })
    cleanup.register(() => removeUserTemplateTolerantly(sdk, onlyBogus.id))
    expect(onlyBogus.inbounds).toEqual({})
  })

  it('does not normalize data_limit=0 / expire_duration=0 to null, unlike the User module (verified live-panel quirk)', async () => {
    // docs/marzban-quirks.md documents addUser normalizing data_limit=0 /
    // expire=0 to null on the response. Templates do not share that
    // behavior — 0 comes back as 0 here.
    const name = uniqueTestName('template-zero')

    const created = await sdk.userTemplate.addUserTemplate({ name, data_limit: 0, expire_duration: 0 })
    cleanup.register(() => removeUserTemplateTolerantly(sdk, created.id))

    expect(created.data_limit).toBe(0)
    expect(created.expire_duration).toBe(0)
  })

  it('rejects fetching, modifying, and removing a template that does not exist', async () => {
    const missingId = 999_999_999

    await expect(sdk.userTemplate.getUserTemplateEndpoint(missingId)).rejects.toMatchObject({
      status: 404,
    } satisfies Partial<HttpError>)
    await expect(sdk.userTemplate.modifyUserTemplate(missingId, {})).rejects.toMatchObject({
      status: 404,
    } satisfies Partial<HttpError>)
    await expect(sdk.userTemplate.removeUserTemplate(missingId)).rejects.toMatchObject({
      status: 404,
    } satisfies Partial<HttpError>)
  })

  it('lists templates with offset/limit pagination', async () => {
    const names = [uniqueTestName('template-page-a'), uniqueTestName('template-page-b')]
    for (const name of names) {
      const created = await sdk.userTemplate.addUserTemplate({ name })
      cleanup.register(() => removeUserTemplateTolerantly(sdk, created.id))
    }

    const all = await sdk.userTemplate.getUserTemplates()
    expect(names.every(name => all.some(t => t.name === name))).toBe(true)

    const firstPage = await sdk.userTemplate.getUserTemplates({ limit: 1 })
    expect(firstPage).toHaveLength(1)
  })

  it('rejects creating/modifying/removing templates from a non-sudo admin session (reads remain allowed)', async () => {
    const { username, password } = await createTestAdmin(sdk)
    cleanup.register(() => removeAdminTolerantly(sdk, username))

    const name = uniqueTestName('template-nonsudo')
    const created = await sdk.userTemplate.addUserTemplate({ name })
    cleanup.register(() => removeUserTemplateTolerantly(sdk, created.id))

    const nonSudoSdk = await createTestSdk({ username, password })
    try {
      await expect(nonSudoSdk.userTemplate.getUserTemplates()).resolves.toEqual(expect.any(Array))
      await expect(nonSudoSdk.userTemplate.getUserTemplateEndpoint(created.id)).resolves.toMatchObject({ name })

      await expect(nonSudoSdk.userTemplate.addUserTemplate({ name: uniqueTestName('blocked') })).rejects.toMatchObject({
        status: 403,
      } satisfies Partial<HttpError>)
      await expect(nonSudoSdk.userTemplate.modifyUserTemplate(created.id, {})).rejects.toMatchObject({
        status: 403,
      } satisfies Partial<HttpError>)
      await expect(nonSudoSdk.userTemplate.removeUserTemplate(created.id)).rejects.toMatchObject({
        status: 403,
      } satisfies Partial<HttpError>)
    } finally {
      await nonSudoSdk.destroy()
    }
  })
})

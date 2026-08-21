import { proxyHostSchema } from 'marzban-sdk'
import { z } from 'zod'

import { confirmTokenSchema } from '@/shared/schemas'

// --- config_get ----------------------------------------------------------

export const configGetInputSchema = z.object({
  section: z
    .string()
    .optional()
    .describe(
      'Return this one top-level key\'s raw JSON instead of the summary (e.g. "inbounds", "routing"). Use "raw" for the entire config. Omit for a structural summary — prefer that over "raw" unless you specifically need the full JSON.'
    ),
})

const coreConfigSummarySchema = z.object({
  inbounds: z.array(
    z.object({
      tag: z.string().nullable(),
      port: z.union([z.number(), z.string()]).nullable(),
      protocol: z.string().nullable(),
    })
  ),
  outbounds: z.array(z.object({ tag: z.string().nullable(), protocol: z.string().nullable() })),
  routingRulesCount: z.number().nullable(),
  otherTopLevelKeys: z.array(z.string()),
})

export const configGetOutputSchema = z.object({
  mode: z.enum(['summary', 'section', 'raw']),
  section: z.string().nullable(),
  summary: coreConfigSummarySchema.nullable(),
  data: z.unknown().nullable(),
})

// --- config_update ---------------------------------------------------------

export const configUpdateInputSchema = z.object({
  config: z
    .record(z.string(), z.unknown())
    .refine(value => Array.isArray(value.inbounds) && Array.isArray(value.outbounds), {
      message: 'The config must include array fields "inbounds" and "outbounds".',
    })
    .describe('The full core (Xray) config to write — this replaces the entire config, not a partial patch.'),
  dryRun: z
    .boolean()
    .optional()
    .describe('If true, return the diff against the current config without writing or restarting anything.'),
  confirmToken: confirmTokenSchema,
})

const keyDiffSchema = z.object({
  addedKeys: z.array(z.string()),
  removedKeys: z.array(z.string()),
  changedKeys: z.array(z.string()),
})

export const configUpdateOutputSchema = z.object({
  applied: z.boolean(),
  restarted: z.boolean(),
  diff: keyDiffSchema,
  backup: z.record(z.string(), z.unknown()).nullable(),
})

// --- core_restart ------------------------------------------------------------

export const coreRestartInputSchema = z.object({
  confirmToken: confirmTokenSchema,
})

export const coreRestartOutputSchema = z.object({
  restarted: z.literal(true),
})

// --- hosts_get -----------------------------------------------------------

export const hostsGetInputSchema = z.object({})

const hostVariableWarningSchema = z.object({
  inboundTag: z.string(),
  index: z.number(),
  field: z.enum(['remark', 'address', 'host', 'sni', 'path']),
  unknownVariables: z.array(z.string()),
})

export const hostsGetOutputSchema = z.object({
  hosts: z.record(z.string(), z.array(proxyHostSchema)),
  warnings: z.array(hostVariableWarningSchema),
})

// --- hosts_update ----------------------------------------------------------

export const hostsUpdateInputSchema = z.object({
  hosts: z
    .record(z.string(), z.array(proxyHostSchema))
    .describe('The full inbound-tag -> proxy-host-list map to write — this replaces the entire host configuration.'),
  confirmToken: confirmTokenSchema,
})

export const hostsUpdateOutputSchema = z.object({
  hosts: z.record(z.string(), z.array(proxyHostSchema)),
  backup: z.record(z.string(), z.array(proxyHostSchema)),
})

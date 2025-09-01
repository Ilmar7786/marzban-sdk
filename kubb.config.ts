import { defineConfig } from '@kubb/core'
import { pluginClient } from '@kubb/plugin-client'
import { pluginOas } from '@kubb/plugin-oas'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginZod } from '@kubb/plugin-zod'

export default defineConfig(() => {
  return [
    {
      name: 'gen',
      root: '.',
      input: {
        path: './openapi/openapi.json',
      },
      output: {
        path: './src/gen',
        clean: true,
        barrelType: false,
        defaultBanner: false,
      },
      hooks: {
        done: ['npx eslint --fix ./src/gen -c eslint.config.js'],
      },
      plugins: [
        pluginOas({
          validate: true,
          discriminator: 'strict',
          generators: [],
        }),
        pluginTs({
          output: {
            path: 'models',
          },
          group: {
            type: 'tag',
            name: ({ group }) => `${group ?? 'Default'}Model`.replace(/\s+/g, ''),
          },
          enumType: 'asConst',
          enumSuffix: 'enum',
          dateType: 'string',
        }),
        pluginZod({
          output: { path: './schemas' },
          group: {
            type: 'tag',
            name: ({ group }) => `${group ?? 'Default'}Schema`.replace(/\s+/g, ''),
          },
          dateType: 'stringLocal',
          typed: true,
          version: '4',
        }),
        pluginClient({
          client: 'axios',
          output: {
            path: './api',
            barrelType: 'all',
          },
          parser: 'zod',
          group: {
            type: 'tag',
            name: ({ group }) => `${group ?? 'Default'}Api`.replace(/\s+/g, ''),
          },
          importPath: '../../../core/http/client.ts',
          dataReturnType: 'data',
          paramsCasing: 'camelcase',
        }),
      ],
    },
  ]
})

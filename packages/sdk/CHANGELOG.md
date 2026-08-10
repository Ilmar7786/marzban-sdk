# Changelog

## [3.0.1] - 2026-06-25

### <!-- 0 -->🚀 Features

- Environment-aware default + consistent logging across layers by @Ilmar7786

### <!-- 1 -->🐛 Bug Fixes

- Make webhook crypto cross-runtime and keep node:crypto out of browser bundles by @Ilmar7786
- Await webhook listeners and harden core modules by @Ilmar7786
- Harden auth, webhook and ws layers for production by @Ilmar7786

### <!-- 10 -->💼 Other

- 3.0.1 by @Ilmar7786
- Merge pull request #55 from Ilmar7786/task/web-docs by @Ilmar7786 in [#55](https://github.com/Ilmar7786/marzban-sdk/pull/55)
- 3.0.0 by @Ilmar7786
- Merge pull request #54 from Ilmar7786/fix/production-hardening by @Ilmar7786
- Merge pull request #53 from Ilmar7786/dependabot/npm_and_yarn/npm_and_yarn-650b74d069 by @Ilmar7786
- Bump form-data in the npm_and_yarn group across 1 directory by @dependabot[bot]
- Merge pull request #52 from Ilmar7786/dependabot/npm_and_yarn/npm_and_yarn-bed0206944 by @Ilmar7786
- Bump vite in the npm_and_yarn group across 1 directory by @dependabot[bot]
- Fix url repository by package.json by @Ilmar7786

### <!-- 2 -->🚜 Refactor

- Accept a single options object in the LogsStream constructor by @Ilmar7786
- Centralize SDK defaults and enforce validated config by @Ilmar7786

### <!-- 6 -->🧪 Testing

- Reach 100% coverage of hand-written code and enforce it by @Ilmar7786

### <!-- 7 -->⚙️ Miscellaneous Tasks

- Set web docs url in package.json by @Ilmar7786
- Harden lint/format enforcement and normalize line endings by @Ilmar7786
- Add auto change log setup in release by @Ilmar7786
- Add auto release github by @Ilmar7786

## [2.0.1] - 2026-06-15

### <!-- 1 -->🐛 Bug Fixes

- Generating using kubb and configuring the client for the new version by @Ilmar7786
- Fixed authorization and webhook error handling by @Ilmar7786
- Export guard http and webhook by @Ilmar7786
- Set params timeout in http client by @Ilmar7786

### <!-- 10 -->💼 Other

- 2.0.1 by @Ilmar7786
- Fixed esbuild visibility CWE-426 and CWE-494 by @Ilmar7786

### <!-- 7 -->⚙️ Miscellaneous Tasks

- Add permissions for action ci by @Ilmar7786
- Add action ci by @Ilmar7786

## [2.0.0] - 2026-05-19

### <!-- 0 -->🚀 Features

- Add colors in default logger by @Ilmar7786
- Add helpers bytes datetime and variables by @Ilmar7786
- Added processing types, guards, checks, and an event model for working with webhooks by @Ilmar7786
- Implemented the core of the plugin system by @Ilmar7786
- Add logger by @Ilmar7786
- Add guards errors by @Ilmar7786
- Add validate config sdk and add custom errors structure by @Ilmar7786
- Migrate from openapi-generate to kubb, add Zod schema and TypeScript model generation #15 by @Ilmar7786

### <!-- 1 -->🐛 Bug Fixes

- Fixed the logic of creating multi instances of the http service by @Ilmar7786
- Redefining the http client instace when creating a new sdk instace by @Ilmar7786
- Code minification has been removed due to an error in cjs by @Ilmar7786
- Dynamic loading of the ws module for node and tree-shaking improvements by @Ilmar7786
- Typing of required fields in the config by @Ilmar7786
- Remove http request logging by @Ilmar7786
- Replace any and eslint error on custom type AnyType by @Ilmar7786
- Remove property sdkVersion in plugin context by @Ilmar7786
- Type and validation conflict in plugins by @Ilmar7786
- Update comments and lazy loading plugins by @Ilmar7786
- Use to accept Postgres timestamps without Z by @Ilmar7786
- Initializing a class via the async function instead of new by @Ilmar7786
- Duplicate types have been removed and zod has been installed as a dependency #15 by @Ilmar7786

### <!-- 10 -->💼 Other

- 2.0.0 by @Ilmar7786
- Update dependencies by @Ilmar7786
- Merge pull request #46 from Ilmar7786/dev by @Ilmar7786 in [#46](https://github.com/Ilmar7786/marzban-sdk/pull/46)
- Update dependencies and fix method default client by http by @Ilmar7786
- Update dependencies by @Ilmar7786
- Merge pull request #45 from Ilmar7786/revert-43-dev by @Ilmar7786 in [#45](https://github.com/Ilmar7786/marzban-sdk/pull/45)
- Revert "Dev" by @Ilmar7786

### <!-- 2 -->🚜 Refactor

- Optimization and name changes of the error system by @Ilmar7786
- Add alias paths by @Ilmar7786
- The websocket service has been decomposed and the naming has been corrected by @Ilmar7786
- Improved readability and added checks to authorization services by @Ilmar7786
- Change AuthManager the event model has been moved to SafeEventEmitter by @Ilmar7786

### <!-- 6 -->🧪 Testing

- Fixed tests for the entry point class and for the authorization module by @Ilmar7786
- Add tests and fix logs stream, auth interceptors auth manager, safe event emitter #14 by @Ilmar7786

### <!-- 7 -->⚙️ Miscellaneous Tasks

- Remove base plugins structure by @Ilmar7786
- Update dependencies and kubb zod importing, validate by @Ilmar7786

## [1.5.5] - 2026-05-14

### <!-- 10 -->💼 Other

- 1.5.5 by @Ilmar7786
- Merge pull request #42 from Ilmar7786/dependabot/npm_and_yarn/npm_and_yarn-f1ea3e7a5d by @Ilmar7786 in [#42](https://github.com/Ilmar7786/marzban-sdk/pull/42)
- Bump the npm_and_yarn group across 1 directory with 2 updates by @dependabot[bot]
- Merge pull request #41 from Ilmar7786/dependabot/npm_and_yarn/npm_and_yarn-32e07c5719 by @Ilmar7786 in [#41](https://github.com/Ilmar7786/marzban-sdk/pull/41)
- Bump ip-address by @dependabot[bot]
- Merge pull request #40 from Ilmar7786/dependabot/npm_and_yarn/npm_and_yarn-85af2c71bb by @Ilmar7786 in [#40](https://github.com/Ilmar7786/marzban-sdk/pull/40)
- Bump follow-redirects by @dependabot[bot]

### <!-- 7 -->⚙️ Miscellaneous Tasks

- Update workflow action publish by @Ilmar7786

## [1.5.4] - 2026-04-10

### <!-- 10 -->💼 Other

- 1.5.4 by @Ilmar7786
- Update version dependency axios by @Ilmar7786
- Merge pull request #39 from Ilmar7786/dependabot/npm_and_yarn/npm_and_yarn-447f6a9e2e by @Ilmar7786 in [#39](https://github.com/Ilmar7786/marzban-sdk/pull/39)
- Bump the npm_and_yarn group across 1 directory with 3 updates by @dependabot[bot]
- Merge pull request #38 from Ilmar7786/dependabot/npm_and_yarn/npm_and_yarn-3f9ee708be by @Ilmar7786 in [#38](https://github.com/Ilmar7786/marzban-sdk/pull/38)
- Bump picomatch in the npm_and_yarn group across 1 directory by @dependabot[bot]

## [1.5.3] - 2026-03-23

### <!-- 10 -->💼 Other

- 1.5.3 by @Ilmar7786
- Update version dependencies by @Ilmar7786
- Merge pull request #37 from Ilmar7786/dependabot/npm_and_yarn/npm_and_yarn-e5a595f223 by @Ilmar7786 in [#37](https://github.com/Ilmar7786/marzban-sdk/pull/37)
- Bump flatted by @dependabot[bot]

## [1.5.2] - 2026-02-28

### <!-- 10 -->💼 Other

- 1.5.2 by @Ilmar7786
- Merge pull request #36 from Ilmar7786/dependabot/npm_and_yarn/npm_and_yarn-8a6d6a6aaf by @Ilmar7786 in [#36](https://github.com/Ilmar7786/marzban-sdk/pull/36)
- Bump the npm_and_yarn group across 1 directory with 2 updates by @dependabot[bot]
- Merge pull request #35 from Ilmar7786/dependabot/npm_and_yarn/npm_and_yarn-387f502f5a by @Ilmar7786 in [#35](https://github.com/Ilmar7786/marzban-sdk/pull/35)
- Bump basic-ftp by @dependabot[bot]

## [1.5.1] - 2026-02-13

### <!-- 10 -->💼 Other

- 1.5.1 by @Ilmar7786
- Merge pull request #34 from Ilmar7786/dependabot/npm_and_yarn/npm_and_yarn-66fcce4dc2 by @Ilmar7786 in [#34](https://github.com/Ilmar7786/marzban-sdk/pull/34)
- Bump axios in the npm_and_yarn group across 1 directory by @dependabot[bot]

### <!-- 7 -->⚙️ Miscellaneous Tasks

- Update dependencies to fix security vulnerabilities by @Ilmar7786

## [1.5.0] - 2026-01-25

### <!-- 0 -->🚀 Features

- Add manual and forced authentication control #23 by @Ilmar7786
- Added the use of a token for authorization #4 by @Ilmar7786
- Update README and virsion lib by @Ilmar7786
- Added streaming of master server logs and nodes using websocket #5 by @Ilmar7786
- Add retry and configuration request #6 by @Ilmar7786
- Updated folder structure by @Ilmar7786
- Redesigned getting values from methods instead of getting axios metadata by @Ilmar7786
- Add configuration file by github publish npm by @Ilmar7786
- Implementation of working with methods and authorization is configured by @Ilmar7786

### <!-- 1 -->🐛 Bug Fixes

- Update README and change wait promise auth by @Ilmar7786
- Update version for npm by @Ilmar7786
- The stages of creating an implementation on the github pages in actions have been removed by @Ilmar7786
- Ensure all requests wait for authentication before execution by @Ilmar7786
- Github action publish in npm by @Ilmar7786
- Change the paths to the executable files in package.json by @Ilmar7786
- Prefixes have been removed from the names of properties in the class instance by @Ilmar7786
- Optimizing the distribution by @Ilmar7786

### <!-- 10 -->💼 Other

- 1.5.0 by @Ilmar7786
- Update version dependencies by @Ilmar7786
- Merge pull request #33 from Ilmar7786/dependabot/npm_and_yarn/npm_and_yarn-f3562b46b9 by @Ilmar7786 in [#33](https://github.com/Ilmar7786/marzban-sdk/pull/33)
- Bump lodash by @dependabot[bot]
- 1.4.4 by @Ilmar7786
- Merge pull request #32 from Ilmar7786/dependabot/npm_and_yarn/npm_and_yarn-12cb0b0c21 by @Ilmar7786 in [#32](https://github.com/Ilmar7786/marzban-sdk/pull/32)
- Bump the npm_and_yarn group across 1 directory with 1 update by @dependabot[bot]
- Merge pull request #31 from Ilmar7786/dependabot/npm_and_yarn/npm_and_yarn-3c67cbb9cd by @Ilmar7786 in [#31](https://github.com/Ilmar7786/marzban-sdk/pull/31)
- Bump js-yaml by @dependabot[bot]
- Update release notes for Marzban SDK 2.0.0 by @Ilmar7786
- 1.4.3 by @Ilmar7786
- Merge pull request #29 from Ilmar7786/dependabot/npm_and_yarn/npm_and_yarn-2ea0fb2c37 by @Ilmar7786 in [#29](https://github.com/Ilmar7786/marzban-sdk/pull/29)
- Bump the npm_and_yarn group across 1 directory with 2 updates by @dependabot[bot]
- 1.4.1 by @Ilmar7786
- Merge pull request #25 from Ilmar7786/dependabot/npm_and_yarn/npm_and_yarn-e04d5d616f by @Ilmar7786 in [#25](https://github.com/Ilmar7786/marzban-sdk/pull/25)
- Bump form-data in the npm_and_yarn group across 1 directory by @dependabot[bot]
- 1.4.0 by @Ilmar7786
- Create CODE_OF_CONDUCT.md by @Ilmar7786
- Rename authService.ts to AuthService.ts by @Ilmar7786
- Create LICENSE by @Ilmar7786
- Client generation parameters are included in config and added to sourceMap build by @Ilmar7786
- Remove lib for windows by @Ilmar7786
- Merge pull request #22 from Ilmar7786/task/linting_and_code_style by @Ilmar7786 in [#22](https://github.com/Ilmar7786/marzban-sdk/pull/22)
- Merge pull request #20 from Ilmar7786/task/update-deps by @Ilmar7786 in [#20](https://github.com/Ilmar7786/marzban-sdk/pull/20)
- Fixing vulnerabilities by updating libraries by @Ilmar7786
- Merge pull request #19 from Ilmar7786/dependabot/npm_and_yarn/npm_and_yarn-8bcfda83f8 by @Ilmar7786 in [#19](https://github.com/Ilmar7786/marzban-sdk/pull/19)
- Bump the npm_and_yarn group across 1 directory with 2 updates by @dependabot[bot]
- Merge pull request #18 from Ilmar7786/dependabot/npm_and_yarn/npm_and_yarn-50d8c8c048 by @Ilmar7786 in [#18](https://github.com/Ilmar7786/marzban-sdk/pull/18)
- Bump the npm_and_yarn group across 1 directory with 2 updates by @dependabot[bot]
- Merge pull request #16 from Ilmar7786/task/authorization-token by @Ilmar7786 in [#16](https://github.com/Ilmar7786/marzban-sdk/pull/16)
- Update README.md by @Ilmar7786
- Merge pull request #12 from Ilmar7786/task/webscoket-logs by @Ilmar7786 in [#12](https://github.com/Ilmar7786/marzban-sdk/pull/12)
- Update github action by @Ilmar7786
- Merge pull request #11 from Ilmar7786/feature/docs by @Ilmar7786 in [#11](https://github.com/Ilmar7786/marzban-sdk/pull/11)
- Merge pull request #10 from Ilmar7786/task/request-retry by @Ilmar7786 in [#10](https://github.com/Ilmar7786/marzban-sdk/pull/10)
- Merge pull request #9 from Ilmar7786/refactore/improving_code_base by @Ilmar7786 in [#9](https://github.com/Ilmar7786/marzban-sdk/pull/9)
- Merge pull request #3 from Ilmar7786/fix/requests-wait-for-authentication by @Ilmar7786 in [#3](https://github.com/Ilmar7786/marzban-sdk/pull/3)
- Merge pull request #2 from Ilmar7786/feat/custom-template-client by @Ilmar7786 in [#2](https://github.com/Ilmar7786/marzban-sdk/pull/2)
- 1.0.0 by @Ilmar7786
- Merge pull request #1 from Ilmar7786/feat/github-actions-publish-npm by @Ilmar7786
- 0.2.1 by @Ilmar7786
- 0.2.0 by @Ilmar7786
- 0.1.1 by @Ilmar7786

### <!-- 2 -->🚜 Refactor

- Decomposition of the main class into areas of responsibility by @Ilmar7786

### <!-- 5 -->🎨 Styling

- Format code according to linting rules by @Ilmar7786

### <!-- 7 -->⚙️ Miscellaneous Tasks

- Release v1.4.2 by @Ilmar7786
- Update dependencies by @Ilmar7786

### New Contributors

- @dependabot[bot] made their first contribution

[3.0.1]: https://github.com/Ilmar7786/marzban-sdk/compare/v2.0.1...v3.0.1
[2.0.1]: https://github.com/Ilmar7786/marzban-sdk/compare/v2.0.0...v2.0.1
[2.0.0]: https://github.com/Ilmar7786/marzban-sdk/compare/v1.5.5...v2.0.0
[1.5.5]: https://github.com/Ilmar7786/marzban-sdk/compare/v1.5.4...v1.5.5
[1.5.4]: https://github.com/Ilmar7786/marzban-sdk/compare/v1.5.3...v1.5.4
[1.5.3]: https://github.com/Ilmar7786/marzban-sdk/compare/v1.5.2...v1.5.3
[1.5.2]: https://github.com/Ilmar7786/marzban-sdk/compare/v1.5.1...v1.5.2
[1.5.1]: https://github.com/Ilmar7786/marzban-sdk/compare/v1.5.0...v1.5.1

<!-- generated by git-cliff -->

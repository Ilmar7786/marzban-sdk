# syntax=docker/dockerfile:1

# marzban-mcp talks stdio only — this image has nothing to serve over the
# network, so the runtime stage never needs the target platform's own
# toolchain. Building once on the host arch and only swapping the runtime
# base image per platform keeps arm64 builds fast (no QEMU-emulated tsup/esbuild).
FROM --platform=$BUILDPLATFORM node:24-alpine AS builder
RUN corepack enable
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile --filter=marzban-mcp...
RUN pnpm turbo run build --filter=marzban-mcp
# pnpm 10+'s non-legacy `deploy` needs inject-workspace-packages=true in
# .npmrc, which would change install semantics for the whole workspace.
# --legacy produces the same self-contained output without that.
RUN pnpm --filter=marzban-mcp deploy --prod --legacy /out

FROM node:24-alpine AS runtime

# Static image metadata, including the MCP Registry ownership annotation.
# The release workflow adds dynamic OCI metadata such as version, revision
# and creation timestamp via docker/metadata-action.
LABEL org.opencontainers.image.title="marzban-mcp" \
      org.opencontainers.image.description="MCP server for the Marzban API, built on marzban-sdk" \
      io.modelcontextprotocol.server.name="io.github.ilmar7786/marzban-mcp" \
      org.opencontainers.image.source="https://github.com/Ilmar7786/marzban-sdk" \
      org.opencontainers.image.url="https://github.com/Ilmar7786/marzban-sdk/tree/main/packages/mcp" \
      org.opencontainers.image.documentation="https://ilmar7786.github.io/marzban-sdk/docs/mcp-server/overview" \
      org.opencontainers.image.licenses="MIT"

ENV NODE_ENV=production
WORKDIR /app
COPY --from=builder /out .
USER node
ENTRYPOINT ["node", "dist/index.js"]

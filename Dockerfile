FROM rust:1.94.0-slim AS constitution-builder
WORKDIR /app
COPY native/constitution-fs ./native/constitution-fs
RUN cargo build --locked --release --manifest-path native/constitution-fs/Cargo.toml

FROM node:20-slim AS builder
WORKDIR /app

# Install bun
RUN npm install -g bun

# Install all dependencies (including devDeps for build)
COPY package.json bun.lock ./
COPY patches/ ./patches/
RUN bun install --ignore-scripts

# Copy source
COPY . .

# Stage the exact Linux helper before esbuild compiles its digest authority into
# the standalone bundle. The runtime image receives only those bound bytes.
COPY --from=constitution-builder /app/native/constitution-fs/target/release/wayland-constitution-fs /tmp/wayland-constitution-fs
RUN CONSTITUTION_FS_PREBUILT_BINARY=/tmp/wayland-constitution-fs node scripts/prepareConstitutionFs.js

# Build renderer (no Electron needed) and server bundle
RUN bun run build:renderer:web
RUN node scripts/build-server.mjs

# ---- Runtime image ----
FROM oven/bun:latest AS runtime
WORKDIR /app

# Copy only build artifacts and production deps
COPY --from=builder /app/dist-server ./dist-server
COPY --from=builder /app/out/renderer ./out/renderer
COPY --from=builder /app/resources/bundled-constitution-fs ./resources/bundled-constitution-fs
COPY package.json bun.lock ./
COPY patches/ ./patches/
RUN bun install --production --ignore-scripts

ENV PORT=3000
ENV NODE_ENV=production
ENV DATA_DIR=/data

# Remote (non-localhost) access is OFF by default. Opt in explicitly only when
# the server is fronted by auth/TLS, e.g. `docker run -e ALLOW_REMOTE=true ...`.

# SQLite data volume - mount with: -v $(pwd)/data:/data
VOLUME ["/data"]
EXPOSE 3000

CMD ["bun", "dist-server/server.mjs"]

FROM node:22-bookworm

# Install Bun (required for build scripts)
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"

RUN corepack enable

WORKDIR /app

ARG OPENCLAW_DOCKER_APT_PACKAGES="python3-pip python-is-python3 python3-requests python3-bs4 fonts-noto-cjk gcalcli"
RUN if [ -n "$OPENCLAW_DOCKER_APT_PACKAGES" ]; then \
  apt-get update && \
  DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends $OPENCLAW_DOCKER_APT_PACKAGES && \
  apt-get clean && \
  rm -rf /var/lib/apt/lists/* /var/cache/apt/archives/*; \
  fi

# Install Google Workspace CLI globally so OpenClaw Agent can invoke `gws`
RUN npm install -g @googleworkspace/cli

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY ui/package.json ./ui/package.json
COPY patches ./patches
COPY scripts ./scripts

RUN pnpm install --frozen-lockfile

COPY . .
RUN OPENCLAW_A2UI_SKIP_MISSING=1 pnpm build
# Force pnpm for UI build (Bun may fail on ARM/Synology architectures)
ENV OPENCLAW_PREFER_PNPM=1
RUN pnpm ui:build

ENV NODE_ENV=production

# Allow non-root user to write temp files during runtime/tests.
RUN chown -R node:node /app

# Pre-create the directory for volumes to prevent permission denied errors when mounting
RUN mkdir -p /home/node/.openclaw && chown -R node:node /home/node/.openclaw

# Security / Zeabur Volume Compatibility: 
# The Zeabur brain volume was mounted at /root/.openclaw by the user. 
# We need to ensure the `node` user has permission to access it.
RUN mkdir -p /root/.openclaw && chown -R node:node /root/.openclaw && chmod -R 775 /root/.openclaw

# Security hardening: Run as non-root user
# The node:22-bookworm image includes a 'node' user (uid 1000)
# This reduces the attack surface by preventing container escape via root privileges
USER node

# Start gateway server with default config.
# Binds to loopback (127.0.0.1) by default for security.

# Google Workspace CLI config directory (Persisted via Zeabur volume mounted at /root/.openclaw)
ENV GOOGLE_WORKSPACE_CLI_CONFIG_DIR=/root/.openclaw/gws_auth
#
# For container platforms requiring external health checks:
#   1. Set OPENCLAW_GATEWAY_TOKEN or OPENCLAW_GATEWAY_PASSWORD env var
#   2. Override CMD: ["node","dist/index.js","gateway","--allow-unconfigured","--bind","lan"]
CMD echo "[OpenClaw] Starting Gateway..." && \
  python3 scripts/init-google-auth.py && \
  node dist/index.js config unset telegram || true && \
  node dist/index.js config set gateway.controlUi.allowInsecureAuth true && \
  node dist/index.js gateway --allow-unconfigured --bind lan --port 8080

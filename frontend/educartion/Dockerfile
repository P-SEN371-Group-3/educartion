FROM node:22-alpine

RUN corepack enable pnpm

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

ENV NODE_ENV=production

RUN pnpm build

EXPOSE 3000

CMD ["pnpm", "start"]

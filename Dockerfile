FROM node:24-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN ELECTRON_SKIP_BINARY_DOWNLOAD=1 npm ci
COPY . .
ARG VITE_GITHUB_REPO
RUN npm run build:dashboard

FROM node:24-slim
WORKDIR /app
ENV NODE_ENV=production PORT=8787 DATA_DIR=/data TRUST_PROXY=1
COPY server ./server
COPY --from=build /app/dashboard/dist ./dashboard/dist
VOLUME /data
EXPOSE 8787
CMD ["node", "--disable-warning=ExperimentalWarning", "server/src/index.ts"]

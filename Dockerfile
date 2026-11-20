# frontend/pc: the static site behind the edge (FP15). Built here with the pinned Node and pnpm; served by unprivileged
# nginx (it has /bin/sh and wget for BrickKit's health check; never scratch or distroless). No server logic: at start
# the deployment's branding goes into /config.json (deploy/40-be-config.sh).
FROM node:24.21.0-alpine@sha256:ebfe2f90462722a7a4de65e91990e97fe0d401c70e0e762c5b53302f905ec1c1 AS build
RUN npm install -g pnpm@12.3.4
WORKDIR /src
COPY . .
ARG BE_COMMIT=unknown
ENV BE_COMMIT=$BE_COMMIT
RUN pnpm install --frozen-lockfile && pnpm build

FROM nginxinc/nginx-unprivileged:1.30.6-alpine@sha256:f5116ed4606f3eb015dd4a8e28cb9b351476dc0ad4bc6e9f93b19cec130cdf03
COPY --from=build /src/dist /usr/share/nginx/html
COPY deploy/default.conf /etc/nginx/conf.d/default.conf
COPY deploy/headers.conf /etc/nginx/be-headers.conf
COPY --chmod=755 deploy/40-be-config.sh /docker-entrypoint.d/40-be-config.sh
EXPOSE 8501

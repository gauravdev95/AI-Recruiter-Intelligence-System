# Phase 1 — frontend image: Vite build, served by nginx with SPA fallback.
#
# Build context is the repository root:
#   docker build -f infra/docker/frontend.Dockerfile --build-arg VITE_API_BASE_URL=http://localhost:8000 .
ARG VITE_API_BASE_URL=http://localhost:8000

FROM node:24-alpine AS build
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
WORKDIR /app/frontend
COPY apps/frontend/package.json apps/frontend/package-lock.json* ./
RUN npm ci || npm install
COPY apps/frontend/ ./
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/frontend/dist /usr/share/nginx/html
# SPA fallback: every non-file route serves index.html so react-router works.
RUN printf 'server {\n  listen 80;\n  root /usr/share/nginx/html;\n  index index.html;\n  location / { try_files $uri $uri/ /index.html; }\n}\n' > /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

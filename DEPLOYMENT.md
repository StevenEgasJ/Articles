# Deployment Guide ✅

Concise, practical steps to deploy the Angular frontend and Express backend. Includes local production builds, Docker, and quick cloud options (Netlify / Vercel / GitHub Actions). **Everything is in English.**

---

## Prerequisites ⚙️
- Node.js (16+), npm
- Docker & Docker Compose (optional, for containerized deployment)
- GitHub account (optional, for CI/CD)

> Note: Set `CROSSREF_MAILTO` in `backend/.env` to a real contact email (Crossref requests this). Keep requests gentle and respect rate limits.

---

## Local production run (quick) 💡
1. Setup backend:

```powershell
cd backend
npm install
copy .env.example .env   # Windows PowerShell
# Edit .env and set CROSSREF_MAILTO
npm run build
npm start                # runs compiled app from dist/
```

2. Setup frontend (production build):

```powershell
cd frontend
npm install
npx ng build --configuration production
# Serve the built files from frontend/dist/frontend
# Quick option (install http-server globally or use npx):
npx http-server ./dist/frontend -p 8080
# or copy files into any static host (nginx, Netlify, Vercel)
```

Open frontend at http://localhost:8080 and ensure backend is at the configured host/port (default http://localhost:3000).

---

## Docker (recommended for simple, reproducible deployment) 🐳
Two Dockerfiles: one for backend and a multi-stage one for frontend.

### backend/Dockerfile (example)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json .
RUN npm ci --only=production
COPY . .
RUN npm run build
ENV PORT=3000
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

### frontend/Dockerfile (multi-stage, serve with nginx)

```dockerfile
# Build
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json .
RUN npm ci
COPY . .
RUN npx ng build --configuration production

# Serve
FROM nginx:stable-alpine
COPY --from=builder /app/dist/frontend /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### docker-compose.yml (example)

```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    env_file: ./backend/.env
    ports:
      - '3000:3000'
  frontend:
    build: ./frontend
    ports:
      - '80:80'
    depends_on:
      - backend
```

Run:

```bash
docker compose up --build -d
```

Then open http://localhost.

---

## Platform-as-a-Service (detailed) ☁️
This section shows step-by-step instructions to deploy **both frontend and backend** using Platform-as-a-Service (PaaS) providers. I cover **Render**, **Fly.io**, **Railway**, **DigitalOcean App Platform**, and **Vercel** (with guidance to deploy the backend as a separate service). Each provider section includes the required repository structure, build commands, service settings, environment variables, health checks, and DNS/TLS tips.

> Quick note: the simplest, most robust approach on PaaS is to deploy the **backend as a Node web service** and build the Angular frontend during the deployment process, copying the `dist` files into a `public/` folder served by Express (single-service deployment). This avoids CORS and keeps a single hostname.

---

### Common repo adjustments (recommended for PaaS)
1. Make backend serve the built frontend when in production. Add this to `backend/src/index.ts` (near the end, after other routes):

```ts
import path from 'path';

if (process.env.NODE_ENV === 'production') {
  const staticPath = path.join(__dirname, '..', '..', 'frontend', 'dist', 'frontend');
  app.use(express.static(staticPath));
  app.get('*', (_req, res) => res.sendFile(path.join(staticPath, 'index.html')));
}
```

2. Add scripts to `backend/package.json` to build the frontend during deploy and copy artifacts into `backend/public` (or depend on the above staticPath):

```json
"scripts": {
  "build:frontend": "cd ../frontend && npm ci && npm run build",
  "prepare-deploy": "npm run build:frontend && rm -rf public && cp -r ../frontend/dist/frontend public || true",
  "build": "npm run prepare-deploy && tsc -p .",
  "start": "node dist/index.js"
}
```

With this, a single backend service build will produce a production-ready full-stack app.

---

## Render (recommended: simple UI and full-stack support)
Render supports web services (Node) and static sites. For a single-service deployment: deploy the backend and include the frontend build in `prepare-deploy` (see above).

Steps (single service):
1. Connect your GitHub repo to Render.
2. Create a **Web Service**:
   - **Environment**: `Docker` or `Node` (choose `Node` for simplicity).
   - **Build Command**: `npm run build` (this runs backend `prepare-deploy` and `tsc` if you used the scripts above).
   - **Start Command**: `npm start`
   - **Environment Variables**: set `CROSSREF_MAILTO=you@example.com`, `NODE_ENV=production`, and any other secrets.
   - **Health Check**: set to `http://{service-url}/api/health` (Render will use it for health checks).
3. (Optional) Add a **Static Site** on Render for the frontend alone if you prefer separate services (set publish directory to `frontend/dist/frontend`).
4. Add a custom domain and enable automatic TLS (Render manages certs for you).

Notes:
- For separate services, set `API_URL` in the frontend build environment to the backend's URL.
- Enable automatic deploys from the branch you prefer (usually `main`).

Example `render.yaml` (optional to keep infra as code):

```yaml
services:
  - type: web
    name: research-backend
    env: node
    buildCommand: npm run build
    startCommand: npm start
    autoDeploy: true
    envVars:
      - key: CROSSREF_MAILTO
        value: you@example.com
```

---

## Fly.io (edge, containers, single binary route)
Fly deploys Dockerized apps globally. Approach: build the backend container that includes the frontend `dist` and serves it.

Steps:
1. Install `flyctl` and login: `flyctl auth login`.
2. Create an app: `flyctl launch` (follow prompts). Set the builder to `Dockerfile` or let fly create one.
3. Add `Dockerfile` for the backend that builds the frontend before starting:

```dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN cd frontend && npm ci && npm run build
RUN npm run build  # runs backend build which copies frontend dist into public

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app /app
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

4. Deploy: `flyctl deploy`.
5. Set secrets: `flyctl secrets set CROSSREF_MAILTO=you@example.com`.
6. Ensure `[[services]]` in `fly.toml` exposes port 3000 and a health check pointing to `/api/health`.

Fly will give you a hostname; add a custom domain and configure TLS via Fly or your DNS provider.

---

## Railway (quick, managed service)
Railway provides a simple UI-first flow.

Steps:
1. Push your repo to GitHub and connect Railway.
2. Create a new project and add a **Service** from your repo; Railway will attempt to detect Node apps.
3. Configure the **Build Command**: `npm run build` (backend's build copies frontend artifacts) and **Start Command**: `npm start`.
4. Add Environment Variables in Railway dashboard: `CROSSREF_MAILTO=you@example.com`, `NODE_ENV=production`.
5. Railway provides a service URL; use that for custom domains or configure your frontend `API_URL` accordingly if hosting separately.

Railway auto-deploys on push; configure branch protection and GitHub integration as needed.

---

## DigitalOcean App Platform (managed, easy for web services)
DigitalOcean App Platform can deploy via GitHub and run multiple components.

Steps:
1. Connect GitHub repo in the App Platform console.
2. Add one component (Service) for the backend:
   - **Component type**: Web Service
   - **Environment**: Node
   - **Build & Run Commands**: Build: `npm run build`, Run: `npm start`
   - **Environment Variables**: `CROSSREF_MAILTO` and others.
   - **Health Check**: `/api/health`
3. (Optional) Add a Static Site component for the frontend or let the backend serve the static files from `public/`.
4. Configure domains and automatic TLS via DigitalOcean.

---

## Vercel (serverless-first, use separate backend service)
Vercel is optimized for frontend and serverless functions. For this project you can:
- Deploy the frontend on Vercel (static site) and deploy backend as a separate Render/Fly/Railway service (recommended). Then set the frontend build `API_URL` to the backend's URL.

Quick Vercel steps for frontend:
1. Connect repo and set **Build Command**: `npm run build --prefix frontend` and **Output Directory**: `frontend/dist/frontend`.
2. Configure `API_URL` env var in Vercel to point to your backend URL (e.g., `https://api.example.com`).
3. Vercel will provide automatic TLS and CDN.

If you need to run an Express server, deploy it to Render/Fly/Railway and use it as the API provider.

---

## Common configuration checklist (for all PaaS)
- Set `CROSSREF_MAILTO` to a reachable contact email.
- Ensure `NODE_ENV=production` for production builds.
- Health check: use `/api/health` (backend) and configure the provider to probe it.
- Add a domain and enable automatic TLS.
- For single-host deployments, let Express serve the built frontend; for multi-service deployments, set `API_URL` during frontend build or use environment-based configuration in Angular.
- Monitor logs on the PaaS dashboard and set alerts if available.

---

If you want, I can add the optional changelist (server static serving snippet, backend scripts for copying frontend artifacts, a `render.yaml`, `fly.toml`, and an example `Dockerfile`) to the repo now. Which provider would you like me to prepare configs for first? (Render, Fly.io, Railway, DigitalOcean, or Vercel?)
---

## Example GitHub Actions (build + push Docker images) ⚙️
Save as `.github/workflows/docker-publish.yml` (example triggers on push):

```yaml
name: Build and Push Docker
on: [push]
jobs:
  docker:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up QEMU
        uses: docker/setup-qemu-action@v2
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}
      - name: Build and push backend
        uses: docker/build-push-action@v5
        with:
          context: ./backend
          push: true
          tags: ${{ secrets.DOCKERHUB_USERNAME }}/research-backend:latest
      - name: Build and push frontend
        uses: docker/build-push-action@v5
        with:
          context: ./frontend
          push: true
          tags: ${{ secrets.DOCKERHUB_USERNAME }}/research-frontend:latest
```

After pushing images, deploy to your cloud provider (DigitalOcean App Platform, AWS ECS, Azure Web App for Containers, etc.) using the pushed image tags.

---

## Health check & monitoring ✅
- Backend exposes `/api/health` - use it for liveness probes.
- Add logs and a process manager (PM2 or systemd) for robustness in production.

---

## Crossref etiquette 🙏
- Set `CROSSREF_MAILTO` to a valid contact email in `backend/.env`.
- Avoid aggressive polling; cache or paginate results where possible.

---

If you'd like, I can add the Dockerfiles, `docker-compose.yml`, and a GitHub Actions workflow to the repo for you—would you like me to add them now? 🔧
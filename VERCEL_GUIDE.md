# Vercel Hosting Guide

This project can run on Vercel as a Vite frontend plus an Express API served from `/api`.

## What Changed

- `vercel.json` builds the Vite app and routes `/api/*` requests to the serverless API.
- `api/index.ts` exposes the Express app to Vercel.
- `server/index.ts` now starts a local server only outside Vercel.
- `server/services/database.ts` keeps local Excel/JSON storage, and uses Vercel KV or Upstash Redis REST storage when KV environment variables are present.

## Required Vercel Settings

In Vercel, set the project root to:

```text
nexxus-crm
```

Use these build settings:

```text
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

## Environment Variables

Add these in Vercel Project Settings, then redeploy:

```text
JWT_SECRET=use-a-long-random-secret
JWT_EXPIRES_IN=7d
CLIENT_URL=https://your-project.vercel.app
```

For persistent hosted data, add either Vercel KV or Upstash Redis REST variables:

```text
KV_REST_API_URL=...
KV_REST_API_TOKEN=...
```

or:

```text
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

Without these KV variables, the app can still run on Vercel, but data written by the API is stored in temporary serverless storage and may disappear after function restarts or redeploys.

## Deploy Steps

1. Push the `nexxus-crm` folder to a GitHub repository.
2. Import the repository in Vercel.
3. Set the root directory to `nexxus-crm`.
4. Add the environment variables above.
5. Deploy.
6. Visit `/login`.

Default first login:

```text
Email: admin@nexxus.com
Password: admin123
```

Change this password immediately from the admin user management screen.

## Managing Data

Local development still uses the `database/*.xlsx` files and JSON fallback files.

Hosted Vercel deployments should use KV storage. Each CRM table is stored as one JSON value with keys like:

```text
nexxus-crm:users
nexxus-crm:leads
nexxus-crm:customers
nexxus-crm:followups
nexxus-crm:tasks
nexxus-crm:products
nexxus-crm:quotations
nexxus-crm:settings
```

Most management should be done inside the CRM UI. If you need an external backup, export or copy these KV values from the Vercel/Upstash dashboard.

## Local Commands

Install dependencies:

```bash
npm install
```

Run locally:

```bash
npm run dev
```

Build locally:

```bash
npm run build
```

Run the production server locally:

```bash
npm run serve:prod
```

# Aegis Dashboard

Aegis Dashboard is a Vite + React single-page application that visualises security scan data served by the Aegis Config API. The frontend now communicates directly with the production API (`https://config-api-mja3.onrender.com`) for authentication, tenant profile details, scan listings, and quality gate insights.

## Prerequisites

- Node.js 18+
- npm 9+

## Configuration

The dashboard targets the production Config API by default. To point the UI at a different deployment, create a `.env.local` file in the project root:

```bash
echo "VITE_CONFIG_API_URL=https://your-config-api.example.com" > .env.local
```

Environment variables prefixed with `VITE_` are injected at build time. Remove the file or update the value to switch back to the hosted API.

## Installation

Install dependencies once after cloning the repository:

```bash
npm install
```

## Running the app locally

Start the Vite development server:

```bash
npm run dev
```

The server prints a local URL (typically <http://localhost:5173>). Open it in your browser to access the dashboard.

## Building for production

Create an optimised build with:

```bash
npm run build
```

The compiled assets are emitted to the `dist/` directory.

## Authentication flow

1. Register a new tenant or sign in to an existing tenant through the login screen. Successful registration returns a JWT, which the dashboard stores in `localStorage` along with the tenant ID.
2. All authenticated requests automatically include the `Authorization: Bearer <token>` header. When the API returns a `401` the session is cleared and the user is prompted to sign in again.

## Features

- **Dashboard summary** – pulls real-time scan counts, pass rates, and repository metrics from `/v1/dashboard/summary`.
- **Repository explorer** – groups scan runs by repository using `/v1/scans` and lets you filter by health or search by name.
- **Run deep-dive** – loads scan details and tool outputs on demand from `/v1/scans/{scan_id}`.
- **Tenant settings** – surfaces the API key and quality gate configuration retrieved from `/v1/tenant/profile`, alongside the GitHub Actions snippet required to run the scanner.

## Testing the API connection

You can validate connectivity outside the UI with curl:

```bash
curl https://config-api-mja3.onrender.com/health
```

A healthy response indicates that the dashboard should be able to authenticate and fetch data.

## License

This project is provided for demonstration purposes.

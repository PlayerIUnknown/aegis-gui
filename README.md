# Aegis GUI

Aegis GUI is a Vite + React dashboard that visualises repository security posture data with polished Tailwind styling. This repository now includes a gated authentication flow so that the main experience is accessed through a dedicated sign in / sign up window.

## Getting started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Build for production:
   ```bash
   npm run build
   ```

## Authentication demo

The application launches to an authentication window that supports toggling between **Sign in** and **Sign up** modes. Account creation is intentionally disabled for this demo, but you can explore the dashboard using the provided credentials:

- **Email:** `demo@aegis.dev`
- **Password:** `secure-demo`

Submitting the sign up form displays contextual guidance that directs users to the demo account. Successful sign in persists for the browser session, and you can end the session at any time with the **Sign out** button in the header.

## Project structure

- `src/App.tsx` contains the main dashboard layout and now wires in the authentication state management.
- `src/components/AuthWindow.tsx` defines the new authentication experience with the sign in / sign up forms and demo credential messaging.

## Technology stack

- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)

## License

This project is provided for demonstration purposes.

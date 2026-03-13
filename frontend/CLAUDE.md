# Frontend — React + Arco Design Translation UI

## Quick Commands

- `npm run dev` — Start dev server (Vite, port 3000)
- `npm run build` — Type-check + production build
- `npm run lint` — ESLint check
- `npm run preview` — Preview production build

## Architecture

```
src/
├── api/          # Axios API client modules (one per backend module)
├── components/   # Reusable UI components
├── hooks/        # Custom React hooks
├── layouts/      # Page layouts (Auth, Main, ProtectedRoute)
├── locales/      # i18n (en-US, zh-CN)
├── pages/        # Page components (one directory per feature)
├── router/       # Route configuration
├── stores/       # Zustand stores
├── styles/       # Global styles + Arco theme overrides
├── types/        # TypeScript type definitions
└── utils/        # Utility functions
```

## Rules

- **TypeScript strict mode**: No `any` unless absolutely necessary
- **One API module per backend module**: `api/project.ts`, `api/chat.ts`, etc.
- **Zustand for state**: No prop drilling for cross-component state
- **i18n all user-facing text**: Use `useTranslation()` hook
- **Arco Design components**: Use Arco primitives, don't reinvent
- **WebSocket via hooks**: `useProjectWebSocket(projectId)` pattern

## Testing

- Component tests with Vitest + React Testing Library
- E2E smoke tests with Playwright

## Dependencies

- React 18, TypeScript 5.7, Vite 6
- Arco Design, Zustand, Axios, React Router v6
- See package.json for full list

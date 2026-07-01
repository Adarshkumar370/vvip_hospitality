# Repository Guidelines

## Project Structure & Module Organization

This is a Next.js App Router project for VVIP Hospitality. Route handlers and pages live in `app/`, grouped by business area such as `app/bakery/` and `app/olive-stayz/`. Shared UI belongs in `components/`, with domain-specific folders like `components/bakery/` and `components/olive-stayz/`. Cross-cutting state providers are in `context/`. Server utilities, integrations, constants, and services are in `lib/`, including database, S3, Firebase, session, invoice, and order helpers. Static images and icons live in `public/`.

## Build, Test, and Development Commands

- `npm run dev`: start the local Next.js development server.
- `npm run build`: create a production build and run Next.js compile checks.
- `npm run start`: serve the production build locally.
- `npm run lint`: run ESLint across the project.
- `npx tsc --noEmit`: run a TypeScript type check without emitting files.

Install dependencies with `npm install`; this repository uses `package-lock.json`, so keep npm as the package manager.

## Coding Style & Naming Conventions

Use TypeScript and React function components for new application code. Prefer `.tsx` for UI and route files, `.ts` for utilities and constants, and keep component filenames in PascalCase, for example `StaffPortalShell.tsx`. Route folder names should stay lowercase and URL-oriented, matching existing paths such as `bakery/order` and `olive-stayz/gallery`.

Use the `@/*` path alias from `tsconfig.json` for root-relative imports when it improves readability. Follow existing formatting: two-space indentation in JSX/TS config files and double quotes in TypeScript modules. ESLint extends Next.js core web vitals and TypeScript rules; note that `no-explicit-any` is currently disabled.

## Testing Guidelines

No test runner or coverage target is currently configured. For now, validate changes with `npm run lint`, `npx tsc --noEmit`, and `npm run build`. When adding tests, colocate them near the feature or use a clear `__tests__/` folder, and name files after the subject under test, for example `CartDrawer.test.tsx`.

## Commit & Pull Request Guidelines

Recent commits use short, imperative or past-tense summaries such as `fixed staff manual order` and `Update layout.tsx`. Keep commit messages concise and focused on one change. Pull requests should include a brief description, affected routes or modules, verification commands run, linked issues when relevant, and screenshots for visible UI changes.

## Security & Configuration Tips

Keep secrets in `.env.local`; never commit credentials, API keys, database URLs, or payment provider secrets. Review changes to `lib/db.ts`, `lib/s3.ts`, `lib/firebase/`, and payment or invoice code carefully because they affect external services and customer data.

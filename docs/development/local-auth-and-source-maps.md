# Local development authentication and source maps

## Branch

`feat/dev-auth-fixtures-and-sourcemaps`

## Commands

- `npm run dev test` starts the Vite app in **test-only UI authentication mode**. It reads `test-data/dev-users.csv` through a Vite middleware endpoint that is registered only for the `test` mode. These identities are local fixtures, not Firebase accounts; they do not create valid Firebase ID tokens and must not be used to test protected Express API endpoints.
- `npm run dev` starts the normal Firebase client-auth flow. Set the public Firebase Web App configuration in a local `.env` file copied from `.env.example`. The app logs a configuration error and remains available if the configuration is missing; Firebase sign-in will return a clear error instead of pretending to authenticate.
- `npm run dev generate_sourcemap=true` and `npm run dev generate_sourcemap=false` set the source-map preference for configured transforms/build output. Vite's development server also emits module source maps for debugging as part of its normal development behavior; this flag is not a production security boundary.

## Test CSV schema

`test-data/dev-users.csv` columns: `email,password,role,uid,displayName`. Keep this file populated only with disposable development identities. Do not reuse passwords from any real account. The fixture is not in `public/` and the Vite endpoint is enabled only in `test` mode.

## Firebase configuration and GitHub secrets

GitHub Actions secrets cannot be read back by a local process through your GitHub account credentials. GitHub intentionally does not expose secret values after they are saved. For local development, use `.env` for Firebase Web App configuration and a local service-account JSON outside the repository for trusted server-side operations; both are ignored by Git. Never put Firebase Admin credentials or GitHub tokens in `VITE_*` variables, client bundles, or committed files. In GitHub Actions, store server credentials in repository/environment Actions secrets and inject them into the workflow job at runtime. A fork does not receive the original repository's Actions secrets by default.

Firebase Web App config (including the API key) is client configuration, not an Admin credential; secure access with Firebase Authentication, Firestore Security Rules, authorized domains, and API restrictions. Role checks must be enforced by trusted server code / Firestore rules, not only by hiding UI elements.

## Missing Firebase configuration

When Firebase configuration is absent, the application logs a concise console error and remains usable for public pages. Sign-in and sign-up return an explicit configuration error. It must never silently fall back to a privileged user or grant an admin role.

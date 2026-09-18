# Using a Firebase service account from GitHub Secrets

Yes — you can store your service account JSON in GitHub Secrets and recreate the file at runtime (GitHub Actions) so your server code can read `GOOGLE_APPLICATION_CREDENTIALS`.

## Recommended approach

- **Store the JSON as a secret** (example name: `SERVICE_ACCOUNT_JSON`).
- **Do not commit the JSON file to the repo.**
- **Use Actions to write the secret to a file**, then set `GOOGLE_APPLICATION_CREDENTIALS` to that file path for subsequent steps.

## Example GitHub Actions steps

```yaml
- name: Create service account key file
  run: |
    printf '%s' "$SERVICE_ACCOUNT_JSON" > "$GITHUB_WORKSPACE/serviceAccountKey.json"
  env:
    SERVICE_ACCOUNT_JSON: ${{ secrets.SERVICE_ACCOUNT_JSON }}

- name: Expose GOOGLE_APPLICATION_CREDENTIALS
  run: echo "GOOGLE_APPLICATION_CREDENTIALS=$GITHUB_WORKSPACE/serviceAccountKey.json" >> $GITHUB_ENV
```

Notes:
- If your secret contains newlines, `printf '%s'` preserves them safely.
- Alternatively, store a base64-encoded secret and decode it in the workflow:

```yaml
- name: Decode service account
  run: echo "${{ secrets.SERVICE_ACCOUNT_JSON_B64 }}" | base64 --decode > serviceAccountKey.json
```

## Important security and runtime notes

- GitHub Secrets are available only to Actions (and certain runner environments). They are not exposed to pull requests from forks and cannot be read from client-side code.
- You cannot fetch repository secrets at runtime from client browsers or arbitrary servers; secrets are injected by the Actions runtime or environment variables on the host where the secret is configured.
- For long-running servers, consider using your hosting provider's secret manager (e.g., Cloud Run/Cloud Functions secrets, Azure Key Vault, AWS Secrets Manager) or an environment variable set in deploy time rather than embedding a file in the repository.

## Using the credentials in Node.js

If the Firebase Admin SDK expects a file path at `GOOGLE_APPLICATION_CREDENTIALS`, writing the file and setting the env var will work. Alternatively, set credentials programmatically from parsed JSON stored in a secret (safer for some deploy targets).

Example (programmatic):

```js
const admin = require('firebase-admin');
const key = JSON.parse(process.env.SERVICE_ACCOUNT_JSON);
admin.initializeApp({
  credential: admin.credential.cert(key)
});
```

---
This topic explains options for using a Firebase service account with GitHub Secrets. If you want, I can also add a short example workflow file into `.github/workflows/` in this repo.
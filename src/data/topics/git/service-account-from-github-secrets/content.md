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
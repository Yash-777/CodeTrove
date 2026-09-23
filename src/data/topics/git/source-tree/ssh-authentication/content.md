# SSH authentication in Sourcetree

Use a private key locally and upload only its public counterpart to the Git provider.

```bash
ssh-keygen -t ed25519 -C "you@example.com"
ssh -T git@github.com
```

In Sourcetree, select **Tools → Options → General → SSH Client Configuration** and choose the private key. Never commit or share the private key.

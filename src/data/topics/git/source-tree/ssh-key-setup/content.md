---
title: SSH Key Setup
description: Generate and add SSH keys for Git hosting providers.
order: 20
---

# SSH Key Setup

Use SSH keys instead of a password when you want a repeatable, secure Git authentication flow.

## Generate a key

```bash
ssh-keygen -t ed25519 -C "you@example.com"
```

This creates a private key and a public key.

## Add the public key

1. Copy the contents of `~/.ssh/id_ed25519.pub`
2. Open your Git provider settings
3. Add the key under **SSH keys**
4. Save it

## Test the connection

```bash
ssh -T git@github.com
```

> Never upload the private key. Upload only the `.pub` file.

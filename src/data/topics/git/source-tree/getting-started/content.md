---
title: Getting Started
order: 10
description: Clone a repository and configure the local working copy in Sourcetree.
---

# Getting Started

Clone a remote repository and verify the local working copy before making changes.

## Clone repository

1. Open Sourcetree.
2. Click **Clone**.
3. Paste the repository URL into **Source Path / URL**.
4. Choose your destination folder.
5. Click **Clone**.

```bash
git clone https://github.com/Yash-777/CodeTrove.git
```

## HTTPS vs SSH

- HTTPS: convenient for token-based authentication
- SSH: better for repeat use and key-based authentication

## Typical first flow

```bash
git checkout main
git pull
git checkout -b feature/my-change
```

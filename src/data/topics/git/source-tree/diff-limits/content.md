---
title: Diff Limits
description: Increase SourceTree diff limits for large files.
order: 30
---

# Diff Limits

When SourceTree does not show the whole diff for a large file, increase the file and line limits.

## Adjust settings

Go to:

**Tools → Options → Diff**

Update the following values:

- **Max Diff Line Count**
- **Size Limit (Text)**

This helps with large Java, XML, JSON, CSV, and SQL files.

## Why this matters

Large diffs often get truncated, which makes code reviews harder. Increasing the limit makes the review process clearer and safer.

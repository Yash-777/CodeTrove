# Config Server vs Vault

Configuration and secrets are related but should not be treated as the same problem.

| Concern | Config Server | Vault |
|---|---|---|
| Main purpose | Centralized application configuration | Secrets management |
| Typical data | Feature/config values | Passwords, tokens, certificates, dynamic secrets |
| Security focus | Access to configuration | Strong secret access, policies and lifecycle |
| Rotation | Application/config deployment dependent | Secret lifecycle and rotation capabilities |

<details>
<summary>Why should a database password not simply live in Config Server?</summary>

### Answer
A secret requires stronger access control, auditing, rotation, and lifecycle management than ordinary application configuration. A dedicated secrets manager such as Vault can issue or retrieve secrets according to policy. The exact integration depends on the platform and security model.

> **Note — what the interviewer is expecting:**
> Separate configuration distribution from secret management and explain least privilege.

</details>

<details>
<summary>How should services consume secrets safely?</summary>

### Answer
Use workload identity or another secure authentication mechanism to obtain only the required secrets at runtime, avoid committing secrets to Git, avoid logging them, rotate credentials, and define what happens when the secret store is temporarily unavailable.

> **Note — what the interviewer is expecting:**
> Think about the complete secret lifecycle, including access, rotation, leakage, and outage behavior.

</details>

<a href="/content/tree/distributed-systems/configuration/config-server" target="_blank" rel="noopener noreferrer">Open Config Server ↗</a>
<a href="/content/tree/distributed-systems/configuration/vault" target="_blank" rel="noopener noreferrer">Open Vault ↗</a>

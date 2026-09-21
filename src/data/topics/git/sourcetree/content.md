# Sourcetree

Sourcetree is a free Git client for Windows and Mac that simplifies repository management by providing a visual interface for branches, commits, merges, and pull requests, so you can focus on coding without needing to memorize Git commands.

## Why teams use it

- easier branch inspection
- visual commit history
- drag-and-drop merge workflows
- a friendlier way to learn Git concepts

## Common Sourcetree flow

1. Clone the repo
2. Create a feature branch
3. Commit changes
4. Push branch to remote
5. Open a pull request
6. Merge and delete the feature branch

## Direct Clone a Remote Git Repository via SourceTree UI

 1. Get the Repository URL
    * Copy the repository URL (HTTPS or SSH) from your Git hosting provider such as GitHub, Bitbucket, or GitLab.
    * Clone over HTTPS `git clone https://github.com/Yash-777/CodeTrove.git`
    * Clone over SSH `git clone git@github.com:Yash-777/CodeTrove.git`
      > SSH: Make sure your public SSH key is added to GitHub/Bitbucket/GitLab and that the corresponding SSH key is available/loaded on your local system.   

 2. Clone Using SourceTree
    1. Open Sourcetree.
    2. Click Clone at the top of the interface.
    3. Select the Clone tab, paste the repository URL into the Source Path / URL field.
    4. Select the Destination Path where you want to store the project.
    5. SourceTree will validate the repository URL and populate the local folder name
    6. Click Clone.

After cloning, SourceTree creates the local Git repository, including the `.git` folder.

----

🔑 Clone over HTTPS – Authentication

If the repository requires authentication, configure your Git hosting account in SourceTree.

SourceTree Configuration

Go to: `Tools → Options → Authentication → Add`

Configure:

| Setting            | Value                         |
| ------------------ | ----------------------------- |
| Hosting Service    | GitHub                        |
| Preferred Protocol | HTTPS                         |
| Authentication     | OAuth / Personal Access Token |
| Username           | Your GitHub username          |
| Password/Token     | OAuth token / PAT             |

<details>
  <summary>HTTPS - Clone using the web URL. <code>https://github.com/Yash-777/CodeTrove</code></summary>
  
| Git Repo- Clone - with HTTPS | SourceTree - Tools -> Options -> Authentication |
| -- | -- |
| <img width="600" height="300" alt="image" src="https://github.com/user-attachments/assets/405939ac-b699-47d4-bdcf-190f5dd20154" /> | ![image](https://github.com/Yash-777/MyWorld/assets/17373064/005e2f34-6aba-47ff-81b7-ae418d2b21f0) |


</details>

Click Refresh OAuth or configure the Personal Access Token (PAT) when prompted.


🔐 GitHub Personal Access Token

GitHub allows you to create a Personal Access Token from:

GitHub → Settings → Developer settings → Personal access tokens

GitHub Developer Settings: https://github.com/settings/developers

> Note: Use a Personal Access Token instead of your GitHub account password when Git operations require HTTPS authentication.

## 🔐 SSH Key – Generate and Add to GitHub / GitLab

SSH keys allow you to securely authenticate with Git hosting providers such as **GitHub, GitLab, and Bitbucket** without entering a username/password for every Git operation.

Example SSH repository URL:

```text
git@github.com:apache/dubbo.git
```

<details> <summary>🔐 SSH Key Setup – GitHub / GitLab / Bitbucket / SourceTree</summary>

----

1. 📌 Check Whether an SSH Key Already Exists

Before generating a new key, check your .ssh directory.

<table>
  <tr>
    <th>Windows</th>
    <th>Linux / macOS</th>
  </tr>
<tr>
<td>

```cmd
dir %USERPROFILE%\.ssh    
```

</td>
<td>

```bash
ls ~/.ssh    
```

</td>
</tr>

</table>

Look for existing public keys such as:
```
id_rsa.pub
id_ed25519.pub
yash777.pub
```
If you already have an SSH key, you can reuse it. However, SSH keys may have an expiration date or may be revoked/removed by the Git hosting provider. If the key is expired or invalid, generate a new key pair and add the new public key.



2. 🛠️ Generate a New SSH Key Pair

If you need a new key, generate one with a custom filename.

RSA – 4096-bit Key
```bash
ssh-keygen -t rsa -b 4096 -f yash777 -C "your_email@example.com"
```

Command explanation

Option | Meaning
-- | --
-t rsa | Generate an RSA key
-b 4096 | Generate a 4096-bit key
-f yash777 | Use yash777 as the key filename
-C | Add a comment to identify the key

Replace: `your_email@example.com` with your email address or another identifying comment.

Passphrase - You will be prompted:

```
Enter passphrase (empty for no passphrase):
Enter same passphrase again:
```

A passphrase is recommended because it provides additional protection for your private key.

Example:
```cmd
C:\Users\Yashwanth\.ssh>ssh-keygen -t rsa -b 4096 -f yash777 -C "your_email@example.com"

Generating public/private rsa key pair.
Enter passphrase (empty for no passphrase):
Enter same passphrase again:

Your identification has been saved in yash777
Your public key has been saved in yash777.pub
The key fingerprint is:
SHA256:XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX your_email@example.com
The key's randomart image is:
+---[RSA 4096]----+
|   . .     .oo   |
|  o . .    .+..  |
| o ++        o o.|
|  .oo       .   o|
+----[SHA256]-----+
```

3. 📂 Generated Files

The command creates two files:

File | Purpose
-- | --
`yash777` | 🔐 Private key — NEVER share this
`yash777.pub` | 🔑 Public key — add this to GitHub/GitLab/Bitbucket

Example:
```
.ssh/
  ├── yash777       ← 🔐 Private key → Keep on your computer        (Never upload or share)
  └── yash777.pub   ← 🔑 Public key  → Add to Git hosting provider  (should be added to GitHub/GitLab/Bitbucket.)
```

<table>
  <tr>
    <th>🌐 Add Public Key to GitHub</th>
    <th>🦊 Add Public Key to GitLab</th>
  </tr>
<tr>
<td>

Go to: `GitHub → Settings → SSH and GPG keys → New SSH key`

GitHub: https://github.com/settings/ssh/new

Copy the complete contents of: `yash777.pub` and paste it into the SSH key field.

Give the key a meaningful title, for example: `Work Laptop`

Then click Add SSH key.

</td>
<td>

Go to: `GitLab → Edit Profile → SSH Keys`

GitLab: https://gitlab.com/-/profile/keys

Copy the complete contents of: `yash777.pub` and paste it into the SSH key field.

Example:
```
Title: Work Laptop
Key: <contents of yash777.pub>
```

Then click Add key.

</td>
</tr>
<td colspan="2" style="text-align: center;" class="text-center">
🧪 Test the SSH Connection
</td>
</tr>
<tr>
<td>

```bash
ssh -T git@github.com
```
Company / Self-Hosted GitLab
```
ssh -T git@gitlab.your-company.com
```
> The exact SSH hostname depends on your Git hosting provider.

</td>
<td>

```bash
ssh -T git@gitlab.com
```

</td>
</tr>
</table>


5. ❌ Do NOT Add the Private Key

File | Action
-- | --
`yash777.pub` / `id_rsa.pub` | ✅ Add to GitHub/GitLab
`yash777` / `id_rsa` | ❌ Never add

If you accidentally paste the private key into GitLab, you may see an error such as:
```
The form contains the following errors:
Key type is forbidden. Must be RSA, ECDSA, ED25519, ECDSA_SK, or ED25519_SK
Key is invalid
Fingerprint sha256 cannot be generated
```
This happens because GitLab expects a valid public SSH key, not the private key.


6. 🖥️ Configure SSH Key in SourceTree

If you use SourceTree, configure the SSH client and key.

Go to: `Tools → Options → General → SSH Client Configuration`



<table>
  <tr>
    <th>OpenSSH</th>
    <th>PuTTY / Plink</th>
  </tr>
<tr>
<td>

```
SSH Client: OpenSSH
SSH Key: C:\Users\<username>\.ssh\yash777
```

</td>
<td>

```
SSH Client: PuTTY/Plink
SSH Key: <path-to-your-private-key>.ppk
```

</td>
</tr>
</table>

> The SSH key configured in SourceTree should be the private key. The .pub file is uploaded to GitHub/GitLab.

🔗 Clone Using SSH

Once the public key has been added to your Git hosting provider and SourceTree is configured, use the SSH repository URL.

<table>
  <tr>
    <th>GitHub</th>
    <th>GitLab</th>
  </tr>
<tr>
<td>

```
git clone git@github.com:Yash-777/CodeTrove.git
```

</td>
<td>

```
git clone git@gitlab.com:username/project.git
```

</td>
</tr>
</table>

SourceTree

Go to: `Clone → Source Path / URL → paste the SSH URL → Clone`


🔍 SSH Host Key Fingerprint

An SSH host key fingerprint is a short representation of the Git server's public host key.

Example: `SHA256:XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`

It helps SSH identify and verify the Git server you are connecting to.

Do not confuse an SSH host fingerprint with your SSH user key.

Concept | Purpose
-- | --
User SSH key | Authenticates you to GitHub/GitLab
Host key fingerprint | Identifies the Git server





<table>
  <tr>
    <th>🧠 Simple SSH Flow</th>
    <th>Remember</th>
  </tr>
<tr>
<td>

```
		 Your Computer
			  │
			  │
	  🔐 Private Key
			  │
			  ▼
	  Git / SourceTree
			  │
			  │ SSH
			  ▼
    ┌───────────────────────┐
    │ GitHub / GitLab       │
    │                       │
    │ 🔑 Public Key         │
    └───────────────────────┘
```

</td>
<td>

```
Generate:
    ssh-keygen -t rsa -b 4096 -f yash777 -C "your_email@example.com"

Creates:
    yash777
    yash777.pub

Keep:
    yash777       🔐 PRIVATE

Upload:
    yash777.pub   🔑 PUBLIC
```

</td>
</tr>
</table>

----

</details>


🔗 HTTPS vs SSH

| Method | Example                                     | Authentication |
| ------ | ------------------------------------------- | -------------- |
| HTTPS  | `https://github.com/Yash-777/CodeTrove.git` | OAuth / PAT    |
| SSH    | `git@github.com:Yash-777/CodeTrove.git`     | SSH Key        |

SSH is useful when you frequently work with Git repositories because authentication can be handled through your SSH key rather than repeatedly providing HTTPS credentials.

Once the repository is cloned, you can manage branches, `commits`, `pull`, `push`, `merge`, and `history` directly through SourceTree or Git commands.

## Typical Git actions in Sourcetree

```bash
git checkout main
git pull
git checkout -b feature/my-change
git add .
git commit -m "Add my change"
git push -u origin feature/my-change
```

## Git GUI vs command line

The GUI is great for:
- visualizing history
- resolving conflicts
- reviewing branches quickly

The terminal is still best for:
- scripting
- automation
- advanced git operations

----

## 🔍 SourceTree – Increase Diff Line Count and File Size Limit

When SourceTree does not show the complete changes for a **large file** or shows only part of the diff, increase the Diff limits.

This is useful for large **Java, XML, JSON, SQL, CSV, or other text files** where the number of changed lines or file size exceeds SourceTree's configured limits.

#### ⚙️ Change Diff Limits

In SourceTree, go to:

**Tools → Options → Diff**

Increase the following settings as required:

- **Max Diff Line Count** → Maximum number of diff lines SourceTree displays.
- **Size Limit (Text)** → Maximum size of a text file that SourceTree will process/display in the Diff view.

<img width="600" height="300" alt="image" src="https://github.com/user-attachments/assets/482200c0-5d24-48d5-b82f-35b287ed0f17" />


----

## Best practice

Use Sourcetree as a visual layer on top of Git, not as a replacement for understanding Git fundamentals. Branch naming, commits, rebases, and pull requests still matter the same way they do in the terminal.

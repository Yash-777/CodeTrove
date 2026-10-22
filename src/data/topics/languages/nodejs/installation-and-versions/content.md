# Installation and Version Management

Node.js installations include the `node` runtime and the npm command-line package manager. Select a release supported by the framework and project you intend to use. For new work, a supported LTS release is usually the safest default; use a different line only when a project's compatibility matrix requires it. [1]

## Install and verify Node.js

Use the official Node.js download page or a version manager. After installation, close and reopen the terminal, then check that both commands resolve:

```sh
node --version
npm --version
```

To check which executable your shell is finding on Windows, use `where.exe node` and `where.exe npm` in PowerShell or Command Prompt. On macOS or Linux, use `command -v node` and `command -v npm`. If a command is missing or points to an unexpected installation, inspect PATH before installing a second copy.

A version manager is useful when different projects require different Node.js versions. It installs multiple runtime versions and changes which one the shell finds. The Windows tool nvm-windows is a separate project from the Unix-oriented `nvm` scripts, so follow the instructions for the operating system you use.

## nvm-windows: recommended installer

The official nvm-windows project recommends its installer for most people. If Node.js was installed directly before, follow the nvm-windows guidance for removing or resolving that installation first. Two Node installations competing on PATH can make `node`, `npm`, and global commands appear to switch unpredictably. Do not delete a folder until you have confirmed which program owns it. [2]

Once nvm-windows is installed, open a new terminal and use its command prompt to inspect available releases, install a specific version, activate it, and verify the result:

```text
nvm list available
nvm install <version>
nvm use <version>
nvm list
node --version
npm --version
where.exe node
```

Replace `<version>` with a version listed by `nvm list available`. The active version is the one selected by `nvm use`; the installed versions can remain side by side. If switching fails with a permissions message, open an elevated terminal or approve the elevation prompt. nvm-windows updates a symlink when changing versions, and that operation can require administrator privileges. [2]

## Advanced: manual nvm-windows installation

Manual installation is for people who need to manage the portable archive themselves. The official project publishes a `nvm-noinstall.zip` archive. Extract it into a dedicated directory and keep the required `nvm.exe`, `elevate.vbs`, and `elevate.cmd` files together. The installer is simpler for ordinary workstation setup. [2]

For a manual setup, configure the paths consistently:

- `NVM_HOME` is the directory containing the extracted nvm-windows files.
- `NVM_SYMLINK` is the path through which the active Node.js version will be exposed. It must not be an ordinary pre-existing Node.js installation directory; nvm-windows manages this link.
- Add `%NVM_HOME%;%NVM_SYMLINK%` to the Windows PATH. If a direct Node.js installation already occupies the chosen link path, resolve that conflict before continuing.
- Create `settings.txt` in `NVM_HOME`. Its `root` value must match `NVM_HOME`; its `path` must match `NVM_SYMLINK`. Set `arch` to the architecture you need and `proxy` to `none` unless your network requires a proxy.

Example settings file (replace paths and architecture for your machine):

```text
root: C:\Users\<username>\AppData\Roaming\nvm
path: C:\Program Files\nodejs
proxy: none
arch: 64
```

Use Windows Environment Variables to set the variables and append both locations to PATH. Open a new terminal after changing environment variables. A full restart may be needed if the new shell still inherits the old PATH. [2]

## Diagnose version and PATH conflicts

Run these checks in a new PowerShell window:

```powershell
nvm list
node --version
npm --version
where.exe node
where.exe npm
$env:Path -split ';'
```

If `where.exe node` prints multiple locations, the first match is normally the one used by the shell. Confirm that it is the nvm-windows symlink target you expect. Avoid appending duplicate paths blindly; correct the conflicting installation or PATH order instead. After switching versions, verify `node --version` and `npm --version` again, because global npm tools may be installed under a different runtime's prefix.

## References

[1]: https://nodejs.org/en/download "Download Node.js"
[2]: https://github.com/coreybutler/nvm-windows/wiki "nvm-windows installation guide"

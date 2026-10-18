# Windows PATH and CLI Troubleshooting

A message such as `'ng' is not recognized as an internal or external command` means the shell could not find a command named `ng` on its PATH. It does not by itself prove that Node.js is missing. Diagnose the runtime, project-local package, and global command path separately.

## 1. Check Node.js and npm first

Open a new PowerShell or Command Prompt window after installing Node.js or changing PATH. Run:

```powershell
node --version
npm --version
where.exe node
where.exe npm
```

If PowerShell says `node` or `npm` is not recognized, confirm the intended Node installation or version manager is active and that its path is present in the environment. If multiple `where.exe` results appear, the first match is typically used; resolve outdated or conflicting installations rather than adding more duplicate entries. See [Installation and Version Management](/content/tree/languages/nodejs/installation-and-versions).

## 2. Prefer the project's local CLI

Framework tools should normally be installed in the project so the team uses a compatible, recorded version. From the folder containing the project's `package.json`, install its dependencies and run the local Angular CLI:

```powershell
npm install
npm exec -- ng version
npm exec -- ng serve
```

If the project does not already declare Angular CLI, add the appropriate version as a development dependency from that workspace:

```powershell
npm install --save-dev @angular/cli
npm exec -- ng version
```

The exact Node.js version must be supported by the Angular version used by the project. Check Angular's compatibility guidance before changing Node or Angular versions. [1]

## 3. If you intentionally installed a global CLI

Global npm packages install command shims in npm's global prefix. Check the configured prefix and look for the command:

```powershell
npm config get prefix
where.exe ng
Get-Command ng -ErrorAction SilentlyContinue
```

If `ng` is not found, confirm the CLI is installed globally with `npm list --global --depth=0`. If the global prefix directory is missing from the user PATH, add the correct prefix using Windows Environment Variables, then open a new terminal. Avoid copying a path from another account or another Node installation: version managers can change the active global package location. [2]

## 4. Check PowerShell-specific errors

A message that `npm.ps1` or another script cannot run because script execution is disabled is different from “command not found.” Try the same command in Command Prompt to isolate a PowerShell policy issue. If you need PowerShell script support, review Microsoft's policy guidance and choose the narrowest policy appropriate for your machine; do not set a machine-wide unrestricted policy just to work around one command. Angular documents a per-user `RemoteSigned` option for its CLI workflow. Understand the security effect before applying it. [1]

## Quick diagnostic flow

- `node --version` fails: fix the Node.js installation, selected nvm version, or PATH.
- `node` works but `npm` fails: check that the active Node distribution includes npm and that `where.exe npm` points to the expected installation.
- `node` and `npm` work but `ng` fails inside a project: run `npm install`, confirm `@angular/cli` is listed in the project, and use `npm exec -- ng ...`.
- A global `ng` command fails: inspect `npm config get prefix`, the global package list, and PATH; then open a fresh shell.
- A CLI starts but reports an unsupported Node version: select a Node version allowed by that project's framework compatibility matrix instead of forcing the newest runtime.

## References

[1]: https://angular.dev/tools/cli/setup-local "Angular CLI setup"
[2]: https://docs.npmjs.com/cli/v11/configuring-npm/folders "npm folders"

# npm and package.json

npm is the package manager commonly installed with Node.js. A package is a directory or published archive described by metadata, usually including a `package.json`. npm installs packages, records dependency requirements, and runs project scripts. [1]

## Create a project

Start with a directory and an npm manifest:

```sh
mkdir hello-node
cd hello-node
npm init -y
```

`package.json` is JSON, not a JavaScript object, so use double-quoted property names and do not add comments. It describes the project and may declare scripts, dependencies, module type, supported runtime versions, and package metadata. [1]

## Add and use a dependency

Install a runtime dependency from the project directory:

```sh
npm install express
```

npm downloads Express and its dependency tree into the project's `node_modules` directory, records a version range in `package.json`, and updates `package-lock.json`. A package installed with `npm install --save-dev <package>` is recorded in `devDependencies`; use that for tools needed to test, lint, build, or develop the project but not to run the deployed application.

Example `package.json` for an ES module app:

```json
{
  "name": "hello-node",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "node src/server.js",
    "dev": "node --watch src/server.js",
    "test": "node --test"
  },
  "dependencies": {
    "express": "^5.0.0"
  }
}
```

The install command selects and records the package version range. Do not copy a version number from an unrelated tutorial without checking current project requirements. Avoid `"*"` for production dependencies: an unrestricted range can make installs less predictable. [1]

## package.json and package-lock.json have different jobs

`package.json` describes acceptable dependency ranges and project commands. `package-lock.json` records the resolved package tree, including transitive packages, so installs can reproduce the same dependency graph. Keep the lockfile in source control for an application.

Use `npm install` when you are adding or intentionally updating dependencies. It can update both the manifest and lockfile. Use `npm ci` in clean CI or deployment builds: it requires the lockfile to agree with `package.json`, removes an existing `node_modules`, and installs the locked tree without rewriting those project files. [2]

```sh
# Local development install, using the current manifest and lockfile
npm install

# Reproducible clean install in CI
npm ci
```

## Run scripts and command-line tools

Scripts live under the `scripts` field. Run a named project script with `npm run <name>`; npm adds the local `node_modules/.bin` directory to PATH while running the script. This is why a project's local formatter or test runner can be used without installing it globally.

```sh
npm run
npm run test
npm run dev
```

For a package executable that is already available in the project, use `npm exec -- <command>` or `npx <command>`. Prefer a project's pinned local tool when its version should be consistent for the whole team. Use `npm install --global <package>` only when you intentionally want a command available outside one project. [1] [3]

## Common npm commands

```sh
npm install                 # install dependencies from package.json
npm install <package>       # add a runtime dependency
npm install --save-dev <package>  # add a development tool
npm uninstall <package>     # remove a dependency
npm run                     # list project scripts
npm audit                   # report known dependency vulnerabilities
npm audit fix               # apply compatible fixes; review the resulting diff
```

`npm audit` reports known advisories for the dependency tree. Review the report and test any updates. `npm audit fix --force` may move dependencies outside their declared compatibility ranges, including major versions; do not run it blindly. An audit is one part of supply-chain hygiene, not proof that a package or application is safe. [4]

## Troubleshooting installs

- If `npm install` fails, first confirm the current directory contains the intended `package.json`.
- If a command is missing, install the project's dependencies and invoke the local executable through `npm run` or `npm exec`.
- If a native package fails to build, check the package's supported Node.js versions and the native build prerequisites for your operating system.
- If the lockfile changed unexpectedly, inspect the diff and make sure the intended Node/npm versions and dependency update were used before committing it.

## References

[1]: https://docs.npmjs.com/cli/v11/configuring-npm/package-json "package.json"
[2]: https://docs.npmjs.com/cli/v11/commands/npm-install "npm install"
[3]: https://docs.npmjs.com/cli/v11/commands/npm-exec "npm exec"
[4]: https://docs.npmjs.com/cli/v11/commands/npm-audit "npm audit"

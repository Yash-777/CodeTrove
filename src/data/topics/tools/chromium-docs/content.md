# Chromium Docs

Chromium is a large, multi-platform browser project. Working effectively in its source tree requires learning where design documentation, build instructions, code ownership, tests, and debugging guidance live. Treat the repository as a set of subsystems with explicit boundaries rather than as one ordinary application.

## Find the right documentation

Start with the project contribution and build guides, then locate the subsystem documentation near the code you will change. Search for the owning component, existing tests, design notes, and recent changes before editing. A useful investigation records:

- the user-visible behavior and affected platform;
- the browser process, service, renderer, or utility boundary involved;
- the feature flag or runtime configuration;
- the nearest unit, browser, integration, or web-platform test;
- the code owner and review expectations.

Source search is more effective when you search for symbols, feature flags, metrics, test names, and protocol messages rather than only filenames.

## Build and iterate

A Chromium checkout is large, so build configuration and incremental iteration matter. Use the documented dependency/bootstrap flow for your platform, generate build files, and build only the target needed for the current change when possible. Keep generated files out of source commits unless the project explicitly requires them.

A reliable loop is: reproduce, add or identify a regression test, make the smallest change, build the affected target, run the focused test, then run broader checks before review.

## Debugging the browser

When a failure crosses process boundaries, capture which process owns the state and which IPC or service boundary carries the request. Use logs, trace events, crash reports, developer tools, and platform debuggers as appropriate. Avoid logging sensitive browsing data. A useful bug report includes the revision, platform, command-line switches, reproduction steps, expected behavior, observed behavior, and relevant logs.

## Contributing responsibly

Chromium changes often need code-owner review, style checks, unit tests, browser tests, and platform-specific validation. Keep the change narrow, explain why the existing behavior is insufficient, and update documentation when the workflow or contract changes. Do not treat a green local test as proof that every platform or configuration is covered.

> **Navigation rule:** read the subsystem's current documentation and nearby tests before designing a change; the source tree is too large for reliable guesswork.

# Compiler Editor References

| Project/reference | Purpose in the compiler editor |
|---|---|
| [Prettier browser API](https://prettier.io/docs/browser) and [Prettier plugins](https://prettier.io/docs/plugins) | In-browser JavaScript and TypeScript formatting with explicit parser plugins. |
| [Ruff WASM](https://github.com/wasm-fmt/ruff_fmt) | Python formatting using a browser-compatible WebAssembly build. |
| [Clang-format WASM](https://github.com/wasm-fmt/clang-format) | C, C++, and Java formatting using a browser-compatible WebAssembly build. |
| [Tree-sitter web binding](https://github.com/tree-sitter/tree-sitter/blob/master/lib/binding_web/README.md) | Browser-local parsing and syntax-tree error inspection. |
| [Repomix Tree-sitter WASM grammars](https://www.npmjs.com/package/@repomix/tree-sitter-wasms) | Prebuilt C, C++, Java, and Python parser grammars; the build copies only these four grammar files. |
| [VS Code for the Web](https://vscode.dev/) and [VS Code Web documentation](https://code.visualstudio.com/docs/remote/vscode-web) | Optional full-editor references linked at the bottom of the Compiler page. |

**Implementation note:** JavaScript/TypeScript use Prettier; Java/C/C++ use clang-format WASM; Python uses Ruff WASM; Java/C/C++/Python live syntax diagnostics use local Tree-sitter parsing. JavaScript uses Acorn, TypeScript uses the app's TypeScript compiler, and Kotlin live diagnostics use JetBrains' compiler service. Kotlin formatting currently normalizes indentation only: the available Kotlin Prettier plugin is marked work-in-progress and requires Prettier 1.x, while this app uses Prettier 3.x.

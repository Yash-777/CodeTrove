# BAT Files

A `.bat` or `.cmd` file is a script interpreted by Windows Command Prompt. Batch scripting is useful for small automation, build wrappers, environment setup, and repeatable command sequences, but its quoting and expansion rules deserve care.

## Variables and arguments

```bat
@echo off
set "ENVIRONMENT=%~1"
if "%ENVIRONMENT%"=="" set "ENVIRONMENT=dev"
echo Deploying to %ENVIRONMENT%
```

Use `set "NAME=value"` so trailing spaces are not included. `%1`, `%2`, and `%~1` are positional arguments. `%ERRORLEVEL%` reports the latest process status, while `%~dp0` refers to the directory containing the script.

## Control flow and commands

`if` handles conditions, `for` iterates files or command output, `call` invokes another batch file, and `goto` jumps to a label. Redirection uses `>` or `>>`; pipes use `|`; `&&` runs the next command only after success and `||` runs it after failure.

```bat
@echo off
setlocal
mkdir logs 2>nul
call build.bat
if errorlevel 1 (
  echo Build failed 1>&2
  exit /b 1
)
for %%F in (dist\*.js) do echo %%~nxF
endlocal
```

Inside a batch file, loop variables require double percent signs (`%%F`), while interactive Command Prompt uses one (`%F`).

## Expansion and safety

Ordinary `%VAR%` expansion happens when a compound command is parsed. `setlocal EnableDelayedExpansion` and `!VAR!` can read values updated inside a loop, but exclamation marks in user data then require extra care. Quote paths and never concatenate untrusted input into commands without validation.

Preserve exit codes. Use `exit /b N` for a script status, and make callers check it. Avoid swallowing errors with `2>nul` unless the absence of output is genuinely expected.

## Debugging checklist

- Print the expanded command and current directory while diagnosing.
- Use `where toolname` to find the executable on `PATH`.
- Check quoting around paths containing spaces.
- Use `setlocal` to prevent environment leakage.
- Prefer PowerShell or a general-purpose language when data structures, error handling, or cross-platform behavior becomes complex.

> **Batch principle:** make the working directory, arguments, and exit status explicit; implicit shell state is the source of most surprises.

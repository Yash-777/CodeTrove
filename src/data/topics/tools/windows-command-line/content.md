# Windows Command Line

Windows command-line work commonly uses Command Prompt (`cmd.exe`) and PowerShell. Both can launch programs, inspect files, manage processes, and automate tasks, but they have different syntax and data models.

## Command Prompt essentials

```bat
cd /d C:\work\app
 dir /a
where java
set PATH
mkdir logs
copy input.txt backup.txt
```

Use `cd /d` when changing drive and directory together. Quote paths containing spaces. `> file.txt` replaces output, `>> file.txt` appends, `2> errors.txt` redirects standard error, and `command1 && command2` chains only after success.

## PowerShell essentials

PowerShell commands return objects rather than only text:

```powershell
Get-ChildItem -Path . -Filter *.log |
  Where-Object Length -gt 1MB |
  Sort-Object Length -Descending |
  Select-Object Name, Length
```

Use `Get-Help`, `Get-Command`, and `Get-Member` to discover commands and properties. Aliases such as `ls` and `cat` are convenient interactively; scripts are clearer when they use the full cmdlet names.

## Environment and processes

Inspect environment variables with `Get-ChildItem Env:` or `set`. Set a process-local variable with `$env:NAME = 'value'`; persist configuration only when the operational need is clear. `Get-Process`, `Stop-Process`, `Get-Service`, and `Get-Location` are useful diagnostics, but administrative actions may require an elevated shell.

Do not paste secrets into commands that will remain in shell history. Prefer secret stores, secure prompts, or environment injection from the deployment system.

## Troubleshooting workflow

1. Confirm the current shell and working directory.
2. Run `where.exe tool` or `Get-Command tool` to identify the executable.
3. Print the relevant `PATH` and verify the expected version.
4. Check exit codes: `%ERRORLEVEL%` in Command Prompt and `$LASTEXITCODE` in PowerShell.
5. Reproduce with the smallest command and capture stdout and stderr separately.
6. Check permissions, execution policy, antivirus controls, and file locks before changing system settings.

> **Shell principle:** make the shell, directory, executable version, arguments, and exit status visible before debugging the application itself.

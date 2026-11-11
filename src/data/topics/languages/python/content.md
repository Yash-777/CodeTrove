# Python

Python is a dynamically typed, general-purpose language used for automation, services, data work, testing, and scripting. Its readability comes from a small syntax, predictable indentation, and a large standard library; production quality still depends on explicit environments, tests, and interfaces.

## Core syntax and data

```python
from dataclasses import dataclass

@dataclass(frozen=True)
class User:
    name: str
    roles: tuple[str, ...] = ()

users = [User("Ada", ("admin",)), User("Lin", ())]
admins = [user.name for user in users if "admin" in user.roles]
```

Use lists for ordered mutable collections, tuples for fixed records, sets for membership, and dictionaries for key/value lookup. Comprehensions are useful when the transformation remains readable; use a loop when it needs branching, logging, or error handling.

## Functions, modules, and exceptions

Keep functions small and explicit about inputs and outputs. Use modules to define a boundary and avoid import-time side effects. Raise exceptions for exceptional conditions and catch them at a boundary where the application can add context or recover.

```python
def read_config(path: str) -> dict[str, str]:
    try:
        with open(path, encoding="utf-8") as handle:
            return {
                key.strip(): value.strip()
                for line in handle
                if line.strip() and not line.lstrip().startswith("#")
                for key, value in [line.split("=", 1)]
            }
    except FileNotFoundError as error:
        raise RuntimeError(f"Missing configuration: {path}") from error
```

Context managers such as `with open(...)` guarantee cleanup. Do not catch `Exception` broadly unless you re-raise or handle the failure intentionally.

## Environments and packages

Create a virtual environment per project, pin or constrain dependencies, and keep application code separate from environment setup:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m pytest
```

Use the same interpreter to install and run (`python -m pip`, `python -m pytest`) so the active environment is unambiguous. Keep secrets outside source control.

## Testing and quality

Test behavior at the smallest useful boundary. Use type hints and a checker when the project benefits from them; format and lint consistently; measure coverage without treating coverage percentage as proof of correctness. Prefer explicit dependency injection over hidden module globals when code needs to be tested.

Python has a global interpreter lock in common CPython builds, but that does not make shared state safe. Use processes for CPU-bound parallelism when appropriate, threads or asynchronous I/O for waiting work, and synchronization around shared mutable state.

> **Python principle:** readable code is a starting point; reproducible environments, explicit errors, and tests make it dependable.

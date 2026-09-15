JSON (JavaScript Object Notation) supports exactly 6 value types:
string, number, boolean, null, object, and array. There are no dates,
no functions, no comments - if you need those, you're extending JSON
with a convention on top of it (e.g. ISO date strings).

Example:
```json
{
  "name": "Ana",
  "active": true,
  "score": 87.5,
  "tags": ["a", "b"],
  "manager": null
}
```

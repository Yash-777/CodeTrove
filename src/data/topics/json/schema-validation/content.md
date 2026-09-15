A JSON Schema is itself JSON, describing types, required fields, and
constraints for another JSON document.

Schema:
```json
{
  "type": "object",
  "required": ["id", "email"],
  "properties": {
    "id": { "type": "number" },
    "email": { "type": "string", "format": "email" }
  }
}
```
A document missing "email", or with id as a string, fails validation
against this schema - catching bad data before it reaches your code.

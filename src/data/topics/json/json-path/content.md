JSONPath lets you address nested values without writing manual
traversal code, similar to XPath for XML.

Example document: { "user": { "roles": ["admin", "editor"] } }
Path $.user.roles[0]  -> "admin"

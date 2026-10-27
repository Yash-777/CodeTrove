## – Regex: Add Indentation Before Numbered Lists

### Find and Replace expressions.

**Search Mode → Regular expression** and Click **Replace All**.

### Example

<table><tbody>
<tr>
<td>Before</td><td>Find and Replace expressions</td></td><td>After</td>
</tr>
<tr>
<td>

```text
1. Line1
2. Line2
3. Line3
```

</td>
<td>

**Find what:**
```regex
^(\h*)(\d+\.)
```

**Replace with:**
```regex
 $0
```

</td><td>

```text
 1. Line1
 2. Line2
 3. Line3
```

</td>
</tr>
</tbody>
</table>

### Description
- `^` – Matches the start of a line.
- `(\h*)` – Matches zero or more horizontal spaces/tabs.
- `(\d+\.)` – Matches the numbering, e.g., `1.`, `2.`, `10.`
- `$0` – Reuses the entire matched text.
- Four spaces before ` $0` – Adds single spaces before the original match.
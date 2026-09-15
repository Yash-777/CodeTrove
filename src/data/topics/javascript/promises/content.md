A Promise represents a value that will be available later (success)
or an error (failure). `async/await` is syntax sugar that lets you write
asynchronous code that reads like synchronous code.

Example:
```js
async function getUser(id) {
  const res = await fetch(`/api/users/${id}`);
  if (!res.ok) throw new Error('Request failed');
  return res.json();
}
```
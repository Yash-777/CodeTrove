# Promises and `async`/`await`

A promise represents the eventual result of an asynchronous operation. It is pending initially, then becomes fulfilled with a value or rejected with a reason. A settled promise does not change state again.

## Chaining results and errors

```js
function loadUser(id) {
  return fetch(`/api/users/${id}`).then((response) => {
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
    return response.json();
  });
}

loadUser('42')
  .then((user) => console.log(user.name))
  .catch((error) => console.error(error.message));
```

Returning a value from `then` fulfills the next promise. Throwing or returning a rejected promise sends control to the next rejection handler. Always return nested asynchronous work instead of creating an unobserved promise inside a callback.

## `async` and `await`

An `async` function always returns a promise. `await` pauses that function until the awaited promise settles, without blocking the JavaScript thread.

```js
async function getProfile(id) {
  const response = await fetch(`/api/profiles/${id}`);
  if (!response.ok) throw new Error('Profile request failed');
  return response.json();
}

async function showProfile(id) {
  try {
    const profile = await getProfile(id);
    console.log(profile.name);
  } catch (error) {
    console.error(error.message);
  }
}
```

Put `try`/`catch` around the operation whose failure you can handle. At an application boundary, observe the returned promise so failures do not become unhandled rejections.

## Sequential versus concurrent work

Independent operations can run together with `Promise.all`. It rejects as soon as one input rejects, so use `Promise.allSettled` when every result matters.

```js
const [settings, messages] = await Promise.all([
  fetch('/api/settings').then((response) => response.json()),
  fetch('/api/messages').then((response) => response.json()),
]);
```

Use sequential `await` when the second operation depends on the first. Add cancellation, timeouts, and bounded concurrency for production requests; a promise does not automatically cancel the underlying work.

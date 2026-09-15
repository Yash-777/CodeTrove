CommonJS (older, default in `.js` files unless configured otherwise):
```js
const fs = require('fs');
module.exports = myFunction;
```

ES Modules (modern, used when package.json has `"type": "module"`, or in `.mjs`
files - this is also what this whole React project uses):
```js
import fs from 'fs';
export default myFunction;
```

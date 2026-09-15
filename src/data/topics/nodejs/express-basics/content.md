Example:
```js
import express from 'express';
const app = express();
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.listen(3000, () => console.log('Listening on :3000'));
```

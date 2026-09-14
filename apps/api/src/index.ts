import { app } from './app.js';
import { env } from './config/env.js';

const port = env.PORT;

app.listen(port, () => {
  console.log(`SmartStudy AI API running on http://localhost:${port}`);
});

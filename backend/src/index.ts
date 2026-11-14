import dotenv from 'dotenv';
import { app } from './app.js';

dotenv.config();
const port = Number(process.env.PORT || 4002);

app.listen(port, () => {
  console.log(`Expense Tracker backend running on http://localhost:${port}`);
});
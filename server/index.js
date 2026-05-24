import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import ratesRouter from './routes/rates.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/rates', ratesRouter);

export default app;

if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`MarketMage server on :${PORT}`));
}

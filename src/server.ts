import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import tableRoutes from './routes/tableRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import menuRoutes from './routes/menuRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import publicRoutes from './routes/publicRoutes.js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 4000;

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(morgan('dev'));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/auth', authRoutes);
app.use('/public', publicRoutes);
app.use('/tables', tableRoutes);
app.use('/categories', categoryRoutes);
app.use('/menu', menuRoutes);
app.use('/orders', orderRoutes);

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`CafeOS backend listening on port ${port}`);
  });
}

export default app;

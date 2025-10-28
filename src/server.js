import express from 'express';
import cors from 'cors';
import accountRoutes from './routes/account.js';
import portfolioRoutes from './routes/portfolio.js';

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

app.use('/account', accountRoutes);
app.use('/portfolio', portfolioRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

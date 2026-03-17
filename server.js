import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'node:path';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import technicianRoutes from './routes/technicianRoutes.js';
import sparePartRoutes from './routes/sparePartRequestRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import { startStockMonitor } from './services/stockMonitor.js';
import { swaggerDocs } from './swagger/swagger.js';

dotenv.config();

// Connect Database
connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.resolve('uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/technicians', technicianRoutes);
app.use('/api/spare-requests', sparePartRoutes);
app.use('/api/notifications', notificationRoutes);

// Start Stock Monitor
startStockMonitor();

// Swagger
swaggerDocs(app);

app.get('/', (req, res) => {
  res.send('API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

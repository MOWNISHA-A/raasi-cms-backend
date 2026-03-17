import mongoose from 'mongoose';

const emiSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true },
  totalPrice: { type: Number, required: true },
  downPayment: { type: Number, required: true },
  remainingBalance: { type: Number, required: true },
  monthlyEmi: { type: Number, required: true },
  emiDueDate: { type: Date, required: true },
  status: { type: String, enum: ['Active', 'Completed', 'Defaulted'], default: 'Active' },
}, { timestamps: true });

export default mongoose.model('Emi', emiSchema);

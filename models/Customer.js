import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  address: { type: String },
  deviceHistory: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  }],
}, { timestamps: true });

export default mongoose.model('Customer', customerSchema);

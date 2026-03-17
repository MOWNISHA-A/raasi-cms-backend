import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  specialization: { type: String }, // For technicians
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  role: { type: String, enum: ['Admin', 'Technician', 'PublicUser'], default: 'Technician' },
}, { timestamps: true });

export default mongoose.model('User', userSchema);

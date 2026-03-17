import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
  serviceId: { type: String, required: true, unique: true },
  customerName: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  customerEmail: { type: String, trim: true, lowercase: true },
  deviceType: { type: String, required: true },
  brand: { type: String, required: true },
  problemDescription: { type: String, required: true },
  estimatedCost: { type: Number },
  dueDate: { type: Date },
  technicianAssigned: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  status: { 
    type: String, 
    enum: [
      'Assigned', 
      'In Progress', 
      'Waiting for Spare', 
      'Completed',
      'Delivered'
    ], 
    default: 'Assigned' 
  },
  completedAt: { type: Date },
  serviceDuration: { type: Number }, // In minutes or hours
  customerRating: { type: Number, min: 1, max: 5 },
  sparePartsUsed: [{
    part: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' },
    quantity: { type: Number }
  }],
  notes: { type: String },
}, { timestamps: true });

export default mongoose.model('Service', serviceSchema);

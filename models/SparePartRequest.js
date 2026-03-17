import mongoose from 'mongoose';

const sparePartRequestSchema = new mongoose.Schema({
  service: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Service', 
    required: true 
  },
  technician: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  part: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Inventory', 
    required: true 
  },
  quantity: { 
    type: Number, 
    required: true, 
    default: 1 
  },
  reason: { 
    type: String, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['Pending', 'Approved', 'Rejected'], 
    default: 'Pending' 
  },
}, { timestamps: true });

export default mongoose.model('SparePartRequest', sparePartRequestSchema);

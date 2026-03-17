import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  action: { 
    type: String, 
    required: true 
  },
  module: { 
    type: String, 
    required: true 
  },
  details: { 
    type: String 
  }
}, { timestamps: true });

export default mongoose.model('ActivityLog', activityLogSchema);

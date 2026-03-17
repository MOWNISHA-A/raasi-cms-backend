import mongoose from 'mongoose';

const notificationLogSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      default: 'Brevo',
    },
    channel: {
      type: String,
      enum: ['Email', 'WhatsApp'],
      required: true,
    },
    eventType: {
      type: String,
      required: true,
    },
    recipient: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
    },
    message: {
      type: String,
    },
    status: {
      type: String,
      enum: ['Sent', 'Failed', 'Skipped'],
      required: true,
    },
    referenceType: {
      type: String,
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    error: {
      type: String,
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

export default mongoose.model('NotificationLog', notificationLogSchema);

import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  customerName: { type: String, required: true },
  customerPhone: { type: String },
  customerEmail: { type: String, trim: true, lowercase: true },
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
  invoiceType: {
    type: String,
    enum: ['Service', 'Product', 'Mixed'],
    default: 'Product'
  },
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' },
      productName: { type: String, required: true },
      quantity: { type: Number, required: true, default: 1 },
      price: { type: Number, required: true },
    }
  ],
  spareParts: [
    {
      partId: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' },
      partName: { type: String, required: true },
      quantity: { type: Number, required: true, default: 1 },
      price: { type: Number, required: true },
      total: { type: Number, required: true },
    },
  ],
  serviceDescription: { type: String },
  labourCharge: { type: Number, default: 0 },
  serviceSubtotal: { type: Number, default: 0 },
  productSubtotal: { type: Number, default: 0 },
  sparePartsSubtotal: { type: Number, default: 0 },
  discountType: {
    type: String,
    enum: ['None', 'Amount', 'Percentage'],
    default: 'None',
  },
  discountValue: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  subtotal: { type: Number, required: true },
  tax: { type: Number, required: true, default: 0 },
  totalAmount: { type: Number, required: true },
  amountPaid: { type: Number, default: 0 },
  remainingBalance: { type: Number, default: 0 },
  emiPlan: {
    enabled: { type: Boolean, default: false },
    downPayment: { type: Number, default: 0 },
    remainingBalance: { type: Number, default: 0 },
    installments: { type: Number, default: 0 },
    emiStartDate: { type: Date },
  },
  paymentMethod: { 
    type: String, 
    enum: ['Cash', 'UPI', 'Card', 'EMI', 'Pending'],
    default: 'Pending'
  },
  notificationStatus: {
    invoiceCreated: {
      email: { type: String, enum: ['Sent', 'Failed', 'Skipped'], default: 'Skipped' },
      whatsapp: { type: String, enum: ['Sent', 'Failed', 'Skipped'], default: 'Skipped' },
    },
  },
  date: { type: Date, default: Date.now },
}, { timestamps: true });

invoiceSchema.virtual('phone').get(function getPhone() {
  return this.customerPhone;
});

invoiceSchema.virtual('serviceRef').get(function getServiceRef() {
  return this.serviceId;
});

invoiceSchema.virtual('gst').get(function getGst() {
  return this.tax;
});

invoiceSchema.set('toJSON', { virtuals: true });
invoiceSchema.set('toObject', { virtuals: true });

export default mongoose.model('Invoice', invoiceSchema);

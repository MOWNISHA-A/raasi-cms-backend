import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema({
  productName: { type: String, required: true },
  category: { type: String, required: true }, // Accessories or Spare Parts
  itemType: { type: String, enum: ['Product', 'Spare Part'], default: 'Product' },
  description: { type: String },
  supplier: { type: String },
  purchasePrice: { type: Number, required: true },
  sellingPrice: { type: Number, required: true },
  quantity: { type: Number, required: true, default: 0 },
  minStockLevel: { type: Number, required: true, default: 5 },
  image: { type: String }, // Cloudinary URL
}, { timestamps: true });

export default mongoose.model('Inventory', inventorySchema);

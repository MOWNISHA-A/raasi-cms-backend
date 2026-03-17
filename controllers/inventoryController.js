import Inventory from '../models/Inventory.js';
import { logActivity } from '../services/logService.js';

// @desc    Get available products for public accessories page
// @route   GET /api/inventory/public
// @access  Public
export const getPublicAvailableProducts = async (req, res) => {
  try {
    const items = await Inventory.find({
      itemType: 'Product',
      quantity: { $gt: 0 },
    }).sort({ productName: 1 });

    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all inventory items
// @route   GET /api/inventory
// @access  Private
export const getInventoryItems = async (req, res) => {
  try {
    const items = await Inventory.find({});
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create an inventory item
// @route   POST /api/inventory
// @access  Private/Admin
export const createInventoryItem = async (req, res) => {
  try {
    const { 
      productName, 
      category, 
      itemType, 
      supplier, 
      purchasePrice, 
      sellingPrice, 
      quantity, 
      minStockLevel, 
      image, 
      description 
    } = req.body;

    const existingItem = await Inventory.findOne({ productName, category, supplier });

    if (existingItem) {
      existingItem.quantity += Number(quantity || 0);
      const updatedItem = await existingItem.save();
      await logActivity(req.user._id, 'UPDATE', 'Inventory', `Increased stock for existing item: ${productName}`);
      return res.status(200).json({ 
        message: 'Item already exists. Stock has been increased.', 
        item: updatedItem,
        isDuplicate: true 
      });
    }

    const item = await Inventory.create({ 
      productName, 
      category, 
      itemType: itemType || 'Product', 
      supplier, 
      purchasePrice, 
      sellingPrice, 
      quantity, 
      minStockLevel, 
      image: image || '', 
      description: description || '' 
    });
    
    await logActivity(req.user._id, 'CREATE', 'Inventory', `Added product: ${productName}`);
    res.status(201).json(item);
  } catch (error) {
    console.error('Create Inventory Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update an inventory item
// @route   PUT /api/inventory/:id
// @access  Private/Admin
export const updateInventoryItem = async (req, res) => {
  try {
    const { 
      productName, 
      category, 
      itemType, 
      supplier, 
      purchasePrice, 
      sellingPrice, 
      quantity, 
      minStockLevel, 
      image, 
      description 
    } = req.body;

    const item = await Inventory.findById(req.params.id);
    
    if (item) {
      item.productName = productName || item.productName;
      item.category = category || item.category;
      item.itemType = itemType || item.itemType;
      item.supplier = supplier || item.supplier;
      item.purchasePrice = purchasePrice !== undefined ? purchasePrice : item.purchasePrice;
      item.sellingPrice = sellingPrice !== undefined ? sellingPrice : item.sellingPrice;
      item.quantity = quantity !== undefined ? quantity : item.quantity;
      item.minStockLevel = minStockLevel !== undefined ? minStockLevel : item.minStockLevel;
      item.image = image !== undefined ? image : item.image;
      item.description = description !== undefined ? description : item.description;

      const updatedItem = await item.save();
      await logActivity(req.user._id, 'UPDATE', 'Inventory', `Updated product: ${productName}`);
      res.json(updatedItem);
    } else {
      res.status(404).json({ message: 'Item not found' });
    }
  } catch (error) {
    console.error('Update Inventory Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete an inventory item
// @route   DELETE /api/inventory/:id
// @access  Private/Admin
export const deleteInventoryItem = async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);

    if (item) {
      const productName = item.productName;
      await item.deleteOne();
      await logActivity(req.user._id, 'DELETE', 'Inventory', `Removed product: ${productName}`);
      res.json({ message: 'Item removed' });
    } else {
      res.status(404).json({ message: 'Item not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

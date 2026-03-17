import SparePartRequest from '../models/SparePartRequest.js';
import Inventory from '../models/Inventory.js';
import Service from '../models/Service.js';
import { logActivity, createNotification } from '../services/logService.js';
import User from '../models/User.js';

// @desc    Technician requests a spare part
// @route   POST /api/spare-requests
// @access  Private/Technician
export const createSparePartRequest = async (req, res) => {
  try {
    const { service, part, quantity, reason } = req.body;

    const request = await SparePartRequest.create({
      service,
      technician: req.user._id,
      part,
      quantity,
      reason
    });

    // Update Service status to 'Waiting for Spare'
    await Service.findByIdAndUpdate(service, { status: 'Waiting for Spare' });

    await logActivity(req.user._id, 'Spare Part Requested', 'Inventory', `Technician requested ${quantity} of part ID ${part}`);

    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Admin approves/rejects request
// @route   PUT /api/spare-requests/:id/status
// @access  Private/Admin
export const updateSparePartRequestStatus = async (req, res) => {
  try {
    const { status } = req.body; // 'Approved' or 'Rejected'
    const request = await SparePartRequest.findById(req.params.id).populate('part').populate('service');

    if (request) {
      request.status = status;
      await request.save();

      if (status === 'Approved') {
        const part = await Inventory.findById(request.part._id);
        if (part) {
          if (part.quantity < request.quantity) {
            return res.status(400).json({ message: 'Insufficient stock' });
          }
          // Reduce inventory quantity
          part.quantity -= request.quantity;
          await part.save();

          // Notify Technician
          await createNotification(request.technician, 'Spare Part Request Approved', `Your request for ${request.part.productName} has been approved.`);
        }
      } else {
        // Notify Technician on Rejection
        await createNotification(request.technician, 'Spare Part Request Rejected', `Your request for ${request.part.productName} has been rejected.`);
      }

      await logActivity(req.user._id, `Spare Request ${status}`, 'Inventory', `Request for ${request.part.productName} was ${status}`);

      res.json(request);
    } else {
      res.status(404).json({ message: 'Request not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all spare part requests
// @route   GET /api/spare-requests
// @access  Private/Admin
export const getSparePartRequests = async (req, res) => {
  try {
    const requests = await SparePartRequest.find({})
      .populate('service', 'serviceId deviceType')
      .populate('technician', 'name')
      .populate('part', 'productName quantity');
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

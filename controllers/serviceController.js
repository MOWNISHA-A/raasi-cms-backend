import Service from '../models/Service.js';
import { logActivity, createNotification } from '../services/logService.js';
import User from '../models/User.js';
import Customer from '../models/Customer.js';

// @desc    Get all services
// @route   GET /api/services
// @access  Private
export const getServices = async (req, res) => {
  try {
    const services = await Service.find({}).populate('technicianAssigned', 'name email').populate('sparePartsUsed.part');
    res.json(services);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get service by serviceId (for public tracking)
// @route   GET /api/services/track/:serviceId
// @access  Public
export const trackService = async (req, res) => {
  try {
    // Case-insensitive search using Regex
    const service = await Service.findOne({ 
        serviceId: { $regex: new RegExp(`^${req.params.serviceId}$`, 'i') } 
    }).select('serviceId status deviceType brand problemDescription notes createdAt updatedAt');
    
    if (service) {
      res.json(service);
    } else {
      res.status(404).json({ message: 'Service not found. Check the Service ID.' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new service
// @route   POST /api/services
// @access  Private/Admin
export const createService = async (req, res) => {
  try {
    const { customerName, phoneNumber, customerEmail, deviceType, brand, problemDescription, estimatedCost } = req.body;
    
    // Auto Generate Service ID: RS-YYYY-XXXX
    const currentYear = new Date().getFullYear();
    const count = await Service.countDocuments();
    const serviceId = `RS-${currentYear}-${String(count + 1).padStart(4, '0')}`;

    const service = await Service.create({
      serviceId,
      customerName,
      phoneNumber,
      customerEmail,
      deviceType,
      brand,
      problemDescription,
      estimatedCost,
      status: 'Assigned' // Default to Assigned as per new flow or first step
    });

    await logActivity(req.user._id, 'Service Created', 'Services', `Service ${serviceId} for ${customerName}`);

    // If technician is assigned at creation
    if (req.body.technicianAssigned) {
      service.technicianAssigned = req.body.technicianAssigned;
      await service.save();
      await createNotification(service.technicianAssigned, 'New Task Assigned', `You have been assigned to service ${service.serviceId}`, 'Info');
    }

    res.status(201).json(service);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update service details, status & notes
// @route   PUT /api/services/:id
// @access  Private
export const updateService = async (req, res) => {
  try {
    const { 
      customerName, phoneNumber, customerEmail, deviceType, brand, problemDescription, estimatedCost,
      status, notes, technicianAssigned, sparePartsUsed 
    } = req.body;
    
    const service = await Service.findById(req.params.id);

    if (service) {
      service.customerName = customerName || service.customerName;
      service.phoneNumber = phoneNumber || service.phoneNumber;
      service.customerEmail = customerEmail !== undefined ? customerEmail : service.customerEmail;
      service.deviceType = deviceType || service.deviceType;
      service.brand = brand || service.brand;
      service.problemDescription = problemDescription || service.problemDescription;
      service.estimatedCost = estimatedCost !== undefined ? estimatedCost : service.estimatedCost;
      
      if (status && status !== service.status) {
        service.status = status;
        
        if (status === 'Completed') {
          service.completedAt = new Date();
          const durationMs = service.completedAt - service.createdAt;
          service.serviceDuration = Math.round(durationMs / (1000 * 60)); // in minutes
        }

        await createNotification(service.technicianAssigned || req.user._id, 'Service Status Updated', `Service ${service.serviceId} is now ${status}`);
        await logActivity(req.user._id, 'Service Status Updated', 'Services', `Service ${service.serviceId} moved to ${status}`);
      }
      
      service.notes = notes || service.notes;

      if (technicianAssigned && technicianAssigned.toString() !== (service.technicianAssigned ? service.technicianAssigned.toString() : '')) {
        service.technicianAssigned = technicianAssigned;
        await createNotification(technicianAssigned, 'New Task Assigned', `You have been assigned to service ${service.serviceId}`, 'Info');
      }
      
      if (sparePartsUsed) {
        service.sparePartsUsed = sparePartsUsed;
      }

      const updatedService = await service.save();
      res.json(updatedService);
    } else {
      res.status(404).json({ message: 'Service not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a service
// @route   DELETE /api/services/:id
// @access  Private/Admin
export const deleteService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (service) {
      const serviceId = service.serviceId;
      await service.deleteOne();
      await logActivity(req.user._id, 'Service Deleted', 'Services', `Removed service: ${serviceId}`);
      res.json({ message: 'Service removed' });
    } else {
      res.status(404).json({ message: 'Service not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

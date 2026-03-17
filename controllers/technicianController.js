import User from '../models/User.js';
import Service from '../models/Service.js';
import bcrypt from 'bcryptjs';

// @desc    Get all technicians
export const getTechnicians = async (req, res) => {
  try {
    const technicians = await User.find({ role: 'Technician' }).select('-password');
    res.json(technicians);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get technician performance stats
export const getTechnicianPerformance = async (req, res) => {
  try {
    const technicians = await User.find({ role: 'Technician' }).select('name email specialization status');
    
    const performanceData = await Promise.all(technicians.map(async (tech) => {
      const completedServices = await Service.countDocuments({ 
        technicianAssigned: tech._id, 
        status: 'Delivered' 
      });
      
      const services = await Service.find({ 
        technicianAssigned: tech._id, 
        status: 'Delivered',
        serviceDuration: { $exists: true }
      });
      
      const avgDuration = services.length > 0 
        ? services.reduce((acc, s) => acc + s.serviceDuration, 0) / services.length 
        : 0;

      return {
        _id: tech._id,
        name: tech.name,
        specialization: tech.specialization,
        status: tech.status,
        completedServices,
        avgDuration: Math.round(avgDuration)
      };
    }));

    res.json(performanceData.sort((a, b) => b.completedServices - a.completedServices));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateTechnicianStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const tech = await User.findById(req.params.id);
    if (tech && tech.role === 'Technician') {
      tech.status = status;
      await tech.save();
      res.json(tech);
    } else {
      res.status(404).json({ message: 'Technician not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a technician
export const createTechnician = async (req, res) => {
  try {
    const { name, email, phone, password, specialization } = req.body;
    const techExists = await User.findOne({ email });

    if (techExists) {
      return res.status(400).json({ message: 'Technician already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const tech = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      specialization,
      role: 'Technician',
      status: 'Active'
    });

    res.status(201).json({ _id: tech._id, name: tech.name, email: tech.email });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a technician
export const updateTechnician = async (req, res) => {
  try {
    const { name, email, phone, specialization, status } = req.body;
    const tech = await User.findById(req.params.id);

    if (tech && tech.role === 'Technician') {
      tech.name = name || tech.name;
      tech.email = email || tech.email;
      tech.phone = phone || tech.phone;
      tech.specialization = specialization || tech.specialization;
      tech.status = status || tech.status;

      const updatedTech = await tech.save();
      res.json(updatedTech);
    } else {
      res.status(404).json({ message: 'Technician not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a technician
export const deleteTechnician = async (req, res) => {
  try {
    const tech = await User.findById(req.params.id);
    if (tech && tech.role === 'Technician') {
      await tech.deleteOne();
      res.json({ message: 'Technician removed' });
    } else {
      res.status(404).json({ message: 'Technician not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

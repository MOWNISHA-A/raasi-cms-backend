import Customer from '../models/Customer.js';
import Service from '../models/Service.js';
import Invoice from '../models/Invoice.js';
import Emi from '../models/Emi.js';


// @desc    Get all customers
export const getCustomers = async (req, res) => {
  try {
    const customers = await Customer.find({}).sort({ createdAt: -1 });
    res.json(customers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a customer
export const createCustomer = async (req, res) => {
  try {
    const { name, phone, email, address } = req.body;
    const customer = await Customer.create({ name, phone, email, address });
    res.status(201).json(customer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get customer by id
export const getCustomerById = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (customer) {
      res.json(customer);
    } else {
      res.status(404).json({ message: 'Customer not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a customer
export const updateCustomer = async (req, res) => {
  try {
    const { name, phone, email, address } = req.body;
    const customer = await Customer.findById(req.params.id);

    if (customer) {
      customer.name = name || customer.name;
      customer.phone = phone || customer.phone;
      customer.email = email || customer.email;
      customer.address = address || customer.address;

      const updatedCustomer = await customer.save();
      res.json(updatedCustomer);
    } else {
      res.status(404).json({ message: 'Customer not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a customer
export const deleteCustomer = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (customer) {
      await customer.deleteOne();
      res.json({ message: 'Customer removed' });
    } else {
      res.status(404).json({ message: 'Customer not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get customer history (services, purchases, EMIs)
export const getCustomerHistory = async (req, res) => {
  try {
    const { phone } = req.query; // Search by phone number normally
    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required' });
    }

    const services = await Service.find({ phoneNumber: phone }).sort({ createdAt: -1 });
    const purchases = await Invoice.find({ customerPhone: phone }).sort({ createdAt: -1 });
    const emis = await Emi.find({ customerName: { $regex: new RegExp(req.query.name || '', 'i') } });
    const customer = await Customer.findOne({ phone }).select('_id');
    const emiSchedules = customer
      ? await EmiSchedule.find({ customerId: customer._id }).populate('invoiceId', 'invoiceNumber totalAmount')
      : [];

    res.json({
      services,
      purchases,
      emis,
      emiSchedules,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

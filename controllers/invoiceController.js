import Invoice from '../models/Invoice.js';
import { logActivity } from '../services/logService.js';
import Inventory from '../models/Inventory.js';
import Customer from '../models/Customer.js';

import Service from '../models/Service.js';

const buildInvoiceType = (serviceId, items = [], spareParts = [], labourCharge = 0) => {
  const hasServiceCharges = Boolean(serviceId);
  const hasItems = Array.isArray(items) && items.length > 0;
  const hasSpareParts = Array.isArray(spareParts) && spareParts.length > 0;
  const hasLabour = Number(labourCharge || 0) > 0;

  if (hasServiceCharges && (hasItems || hasSpareParts || hasLabour)) {
    return 'Mixed';
  }
  if (hasServiceCharges) {
    return 'Service';
  }
  return 'Product';
};

const toMoney = (value) => Number(Number(value || 0).toFixed(2));


const calculateDiscountAmount = (discountType, discountValue, subtotal) => {
  const parsedValue = Number(discountValue || 0);
  if (discountType === 'Amount') {
    return Math.min(toMoney(parsedValue), subtotal);
  }
  if (discountType === 'Percentage') {
    const percentage = Math.max(0, Math.min(parsedValue, 100));
    return toMoney((subtotal * percentage) / 100);
  }
  return 0;
};

const createEmiScheduleForInvoice = async ({ customerId, invoiceId, totalAmount, installments = 3, startDate }) => {
  const count = Number(installments) > 0 ? Number(installments) : 3;
  const installmentAmount = toMoney(totalAmount / count);
  const baseDate = startDate ? new Date(startDate) : new Date();
  const schedule = [];

  for (let i = 1; i <= count; i += 1) {
    const dueDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + i, baseDate.getDate());
    schedule.push({
      customerId,
      invoiceId,
      emiAmount: installmentAmount,
      installmentNumber: i,
      installmentAmount,
      dueDate,
      status: 'Pending',
    });
  }

  return EmiSchedule.insertMany(schedule);
};

const buildScheduleText = (schedules) => {
  return schedules
    .map((row) => {
      const due = new Date(row.dueDate).toLocaleDateString('en-IN');
      return `Installment ${row.installmentNumber}: Rs.${toMoney(row.installmentAmount)} on ${due}`;
    })
    .join('\n');
};

// @desc    Get all invoices
// @route   GET /api/invoices
// @access  Private/Admin
export const getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({}).populate('serviceId', 'serviceId deviceType status');
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create an invoice
// @route   POST /api/invoices
// @access  Private/Admin
export const createInvoice = async (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      customerEmail,
      phone,
      serviceId,
      serviceRef,
      items = [],
      spareParts = [],
      serviceDescription,
      labourCharge = 0,
      paymentMethod,
      taxPercent = 18,
      discountType = 'None',
      discountValue = 0,
      emiPlan,
      customerId,
    } = req.body;

    if (!customerName) {
      return res.status(400).json({ message: 'customerName is required' });
    }

    const normalizedItems = items
      .filter((item) => item && item.productName && Number(item.quantity) > 0)
      .map((item) => ({
        ...item,
        quantity: Number(item.quantity),
        price: Number(item.price),
      }));

    const normalizedSpareParts = spareParts
      .filter((part) => part && part.partName && Number(part.quantity) > 0)
      .map((part) => {
        const quantity = Number(part.quantity);
        const price = Number(part.price);
        return {
          ...part,
          quantity,
          price,
          total: toMoney(quantity * price),
        };
      });

    const resolvedServiceId = serviceId || serviceRef || null;
    const hasBillableData =
      normalizedItems.length > 0 || normalizedSpareParts.length > 0 || Number(labourCharge || 0) > 0 || Boolean(resolvedServiceId);

    if (!hasBillableData) {
      return res.status(400).json({ message: 'Add at least one product/spare part or service charge before creating invoice' });
    }

    if (resolvedServiceId) {
      const linkedService = await Service.findById(resolvedServiceId).select('status');
      if (!linkedService) {
        return res.status(404).json({ message: 'Linked service not found' });
      }
      if (linkedService.status !== 'Completed' && linkedService.status !== 'Ready for Delivery') {
        return res.status(400).json({ message: 'Service invoice can be generated only after service is completed' });
      }
    }

    const count = await Invoice.countDocuments();
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const productSubtotal = toMoney(normalizedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0));
    const sparePartsSubtotal = toMoney(normalizedSpareParts.reduce((acc, part) => acc + part.total, 0));
    const serviceSubtotal = toMoney(Number(labourCharge || 0));
    const subtotal = toMoney(productSubtotal + sparePartsSubtotal + serviceSubtotal);
    const discountAmount = calculateDiscountAmount(discountType, discountValue, subtotal);
    const taxableAmount = toMoney(subtotal - discountAmount);
    const tax = toMoney(taxableAmount * (Number(taxPercent) / 100));
    const totalAmount = toMoney(taxableAmount + tax);

    // Reduce stock for billed products/spare parts.
    for (const item of [...normalizedItems, ...normalizedSpareParts]) {
      const inventoryId = item.productId || item.partId;
      if (!inventoryId) {
        continue;
      }
      const inventoryItem = await Inventory.findById(inventoryId);
      if (!inventoryItem) {
        continue;
      }
      if (inventoryItem.quantity < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${inventoryItem.productName}` });
      }
      inventoryItem.quantity -= item.quantity;
      await inventoryItem.save();
    }

    const downPayment = paymentMethod === 'EMI' ? toMoney(emiPlan?.downPayment || 0) : totalAmount;
    const remainingBalance = paymentMethod === 'EMI' ? toMoney(totalAmount - downPayment) : 0;

    const invoice = await Invoice.create({
      invoiceNumber,
      customerName,
      customerPhone: customerPhone || phone,
      customerEmail,
      serviceId: resolvedServiceId,
      invoiceType: buildInvoiceType(resolvedServiceId, normalizedItems, normalizedSpareParts, labourCharge),
      items: normalizedItems,
      spareParts: normalizedSpareParts,
      serviceDescription,
      labourCharge: serviceSubtotal,
      productSubtotal,
      sparePartsSubtotal,
      serviceSubtotal,
      discountType,
      discountValue: Number(discountValue || 0),
      discountAmount,
      subtotal,
      tax,
      totalAmount,
      amountPaid: downPayment,
      remainingBalance,
      emiPlan: {
        enabled: paymentMethod === 'EMI',
        downPayment,
        remainingBalance,
        installments: Number(emiPlan?.installments || emiPlan?.tenureMonths || 0),
        emiStartDate: emiPlan?.emiStartDate || emiPlan?.startDate || null,
      },
      paymentMethod,
      date: new Date(),
    });

    let createdSchedules = [];
    if (paymentMethod === 'EMI') {
      let resolvedCustomerId = customerId || null;
      if (!resolvedCustomerId) {
        const customer = await Customer.findOne({ phone: customerPhone || phone }).select('_id');
        resolvedCustomerId = customer?._id || null;
      }
      if (resolvedCustomerId) {
        createdSchedules = await createEmiScheduleForInvoice({
          customerId: resolvedCustomerId,
          invoiceId: invoice._id,
          totalAmount: remainingBalance,
          installments: emiPlan?.installments || emiPlan?.tenureMonths,
          startDate: emiPlan?.emiStartDate || emiPlan?.startDate,
        });
      }
    }

    await logActivity(
      req.user._id,
      'Invoice Generated',
      'Billing',
      `Invoice ${invoiceNumber} for ${customerName}`
    );

    res.status(201).json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get invoice by ID
// @route   GET /api/invoices/:id
// @access  Private/Admin
export const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id).populate('serviceId');
    if (invoice) {
      res.json(invoice);
    } else {
      res.status(404).json({ message: 'Invoice not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update invoice details
// @route   PUT /api/invoices/:id
// @access  Private/Admin
export const updateInvoice = async (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      customerEmail,
      serviceId,
      items,
      spareParts,
      labourCharge,
      discountType,
      discountValue,
      paymentMethod,
    } = req.body;
    const invoice = await Invoice.findById(req.params.id);

    if (invoice) {
      if (items || spareParts || labourCharge !== undefined || discountType || discountValue !== undefined) {
        const nextItems = (items || invoice.items || []).map((item) => ({
          ...item,
          quantity: Number(item.quantity),
          price: Number(item.price),
        }));
        const nextSpareParts = (spareParts || invoice.spareParts || []).map((part) => {
          const quantity = Number(part.quantity);
          const price = Number(part.price);
          return {
            ...part,
            quantity,
            price,
            total: toMoney(quantity * price),
          };
        });
        const nextLabour = labourCharge !== undefined ? Number(labourCharge) : Number(invoice.labourCharge || 0);

        const productSubtotal = toMoney(nextItems.reduce((acc, item) => acc + item.price * item.quantity, 0));
        const sparePartsSubtotal = toMoney(nextSpareParts.reduce((acc, part) => acc + part.total, 0));
        const serviceSubtotal = toMoney(nextLabour);
        const subtotal = toMoney(productSubtotal + sparePartsSubtotal + serviceSubtotal);

        const nextDiscountType = discountType || invoice.discountType;
        const nextDiscountValue = discountValue !== undefined ? Number(discountValue) : Number(invoice.discountValue || 0);
        const discountAmount = calculateDiscountAmount(nextDiscountType, nextDiscountValue, subtotal);
        const taxableAmount = toMoney(subtotal - discountAmount);
        const tax = toMoney(taxableAmount * 0.18);
        const total = toMoney(taxableAmount + tax);

        invoice.items = nextItems;
        invoice.spareParts = nextSpareParts;
        invoice.labourCharge = serviceSubtotal;
        invoice.productSubtotal = productSubtotal;
        invoice.sparePartsSubtotal = sparePartsSubtotal;
        invoice.serviceSubtotal = serviceSubtotal;
        invoice.discountType = nextDiscountType;
        invoice.discountValue = nextDiscountValue;
        invoice.discountAmount = discountAmount;
        invoice.subtotal = subtotal;
        invoice.tax = tax;
        invoice.totalAmount = total;
      }

      invoice.customerName = customerName || invoice.customerName;
      invoice.customerPhone = customerPhone || invoice.customerPhone;
      invoice.customerEmail = customerEmail !== undefined ? customerEmail : invoice.customerEmail;
      invoice.serviceId = serviceId || invoice.serviceId;
      invoice.invoiceType = buildInvoiceType(invoice.serviceId, invoice.items, invoice.spareParts, invoice.labourCharge);
      invoice.paymentMethod = paymentMethod || invoice.paymentMethod;

      const updatedInvoice = await invoice.save();
      res.json(updatedInvoice);
    } else {
      res.status(404).json({ message: 'Invoice not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete an invoice
// @route   DELETE /api/invoices/:id
// @access  Private/Admin
export const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (invoice) {
      await invoice.deleteOne();
      res.json({ message: 'Invoice removed' });
    } else {
      res.status(404).json({ message: 'Invoice not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

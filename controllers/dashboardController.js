import Invoice from '../models/Invoice.js';
import Service from '../models/Service.js';
import Inventory from '../models/Inventory.js';
import SparePartRequest from '../models/SparePartRequest.js';
import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';

// Helper to get today's date range
const getTodayRange = () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return { start, end };
};

export const getStats = async (req, res) => {
  try {
    const { start, end } = getTodayRange();

    // 1. Current Uncompleted Services
    const uncompletedServices = await Service.countDocuments({ 
        status: { $nin: ['Completed', 'Delivered'] } 
    });

    // 2. Today's Revenue
    const todayInvoices = await Invoice.find({ createdAt: { $gte: start, $lte: end } });
    const todayRevenue = todayInvoices.reduce((acc, inv) => acc + (inv.totalAmount || 0), 0);

    // 3. Today's Products Sold
    let todayProductsSold = 0;
    todayInvoices.forEach(inv => {
      (Array.isArray(inv.items) ? inv.items : []).forEach(item => {
        todayProductsSold += (item.quantity || 0);
      });
    });

    // 4. Pending Spare Requests
    const pendingSpareRequests = await SparePartRequest.countDocuments({ status: 'Pending' });

    res.json({
      uncompletedServices,
      todayRevenue,
      todayProductsSold,
      pendingSpareRequests,
      totalServices: await Service.countDocuments(),
      totalRevenue: (await Invoice.find({})).reduce((acc, inv) => acc + (inv.totalAmount || 0), 0)
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stats', error: error.message });
  }
};

export const getRevenueAnalytics = async (req, res) => {
  try {
    const filter = req.query.filter || 'daily';
    let data = [];
    const today = new Date();

    if (filter === 'daily') {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        d.setHours(0, 0, 0, 0);
        const nextDay = new Date(d);
        nextDay.setDate(d.getDate() + 1);

        const invoices = await Invoice.find({ createdAt: { $gte: d, $lt: nextDay } });
        const rev = invoices.reduce((acc, inv) => acc + (inv.totalAmount || 0), 0);
        data.push({ label: days[d.getDay()], revenue: rev });
      }
    } else if (filter === 'monthly') {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      for (let i = 11; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const nextMonth = new Date(today.getFullYear(), today.getMonth() - i + 1, 1);

        const invoices = await Invoice.find({ createdAt: { $gte: d, $lt: nextMonth } });
        const rev = invoices.reduce((acc, inv) => acc + (inv.totalAmount || 0), 0);
        data.push({ label: months[d.getMonth()], revenue: rev });
      }
    } else if (filter === 'yearly') {
      for (let i = 4; i >= 0; i--) {
        const year = today.getFullYear() - i;
        const startYear = new Date(year, 0, 1);
        const endYear = new Date(year + 1, 0, 1);

        const invoices = await Invoice.find({ createdAt: { $gte: startYear, $lt: endYear } });
        const rev = invoices.reduce((acc, inv) => acc + (inv.totalAmount || 0), 0);
        data.push({ label: year.toString(), revenue: rev });
      }
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching revenue analytics', error: error.message });
  }
};

export const getProfitAnalytics = async (req, res) => {
    try {
        const filter = req.query.filter || 'daily';
        let data = [];
        const today = new Date();

        const calcProfit = async (start, end) => {
            const invoices = await Invoice.find({ createdAt: { $gte: start, $lt: end } });
            let profit = 0;
            for (const inv of invoices) {
                for (const item of (inv.items || [])) {
                   const product = await Inventory.findById(item.productId);
                   if (product) profit += (item.price - (product.purchasePrice || 0)) * item.quantity;
                   else profit += item.price * 0.3 * item.quantity;
                }
                for (const spare of (inv.spareParts || [])) {
                    const part = await Inventory.findById(spare.partId);
                    if (part) profit += (spare.price - (part.purchasePrice || 0)) * spare.quantity;
                    else profit += spare.price * 0.3 * spare.quantity;
                }
                profit += (inv.labourCharge || 0);
                profit -= (inv.discountAmount || 0);
            }
            return Math.max(0, profit);
        };

        if (filter === 'daily') {
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            for (let i = 6; i >= 0; i--) {
                const d = new Date(today);
                d.setDate(today.getDate() - i);
                d.setHours(0, 0, 0, 0);
                const nextDay = new Date(d);
                nextDay.setDate(d.getDate() + 1);
                const p = await calcProfit(d, nextDay);
                data.push({ label: days[d.getDay()], profit: p });
            }
        } else if (filter === 'monthly') {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            for (let i = 11; i >= 0; i--) {
                const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
                const nextMonth = new Date(today.getFullYear(), today.getMonth() - i + 1, 1);
                const p = await calcProfit(d, nextMonth);
                data.push({ label: months[d.getMonth()], profit: p });
            }
        } else if (filter === 'yearly') {
            for (let i = 4; i >= 0; i--) {
                const year = today.getFullYear() - i;
                const startYear = new Date(year, 0, 1);
                const endYear = new Date(year + 1, 0, 1);
                const p = await calcProfit(startYear, endYear);
                data.push({ label: year.toString(), profit: p });
            }
        }
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching profit analytics', error: error.message });
    }
};

export const getServicesStatus = async (req, res) => {
  try {
    const completed = await Service.countDocuments({ status: { $in: ['Completed', 'Delivered'] } });
    const pending = await Service.countDocuments({ status: { $in: ['Assigned', 'Waiting for Spare'] } });
    const inProgress = await Service.countDocuments({ status: 'In Progress' });
    res.json({ completed, pending, inProgress });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTechnicianRanking = async (req, res) => {
    try {
      const technicians = await User.find({ role: 'Technician' }).select('name');
      const ranking = await Promise.all(technicians.map(async (tech) => {
        const completedServices = await Service.countDocuments({
          technicianAssigned: tech._id,
          status: { $in: ['Completed', 'Delivered'] },
        });
        return { technicianId: tech._id, name: tech.name, completedServices };
      }));
      ranking.sort((a, b) => b.completedServices - a.completedServices);
      res.json({ ranking });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
};

const toDateRange = ({ filter, day, year, month, startDate, endDate }) => {
    const now = new Date();
    let start, end;
    if (filter === 'day') {
      const base = day ? new Date(day) : now;
      start = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 0, 0, 0, 0);
      end = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 23, 59, 59, 999);
    } else if (filter === 'year') {
      const y = Number(year) || now.getFullYear();
      start = new Date(y, 0, 1, 0, 0, 0, 0);
      end = new Date(y, 11, 31, 23, 59, 59, 999);
    } else if (filter === 'custom') {
      start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
      end = endDate ? new Date(endDate) : now;
      if (end) end.setHours(23, 59, 59, 999);
    } else {
      const y = Number(year) || now.getFullYear();
      const m = Number(month) >= 0 ? Number(month) : now.getMonth();
      start = new Date(y, m, 1, 0, 0, 0, 0);
      end = new Date(y, m + 1, 0, 23, 59, 59, 999);
    }
    return { start, end };
};

export const getHistoryReport = async (req, res) => {
    try {
      const { filter = 'month', startDate, endDate, year, month, day } = req.query;
      const { start, end } = toDateRange({ filter, day, year, month, startDate, endDate });
  
      const invoices = await Invoice.find({ createdAt: { $gte: start, $lte: end } });
      const services = await Service.find({ createdAt: { $gte: start, $lte: end } });
  
      const totalRevenue = invoices.reduce((acc, inv) => acc + (inv.totalAmount || 0), 0);
  
      const invoiceRows = invoices.map(inv => ({
          invoiceNumber: inv.invoiceNumber,
          customerName: inv.customerName,
          itemsSold: [...(inv.items || []), ...(inv.spareParts || [])].map(i => i.productName || i.partName).join(', '),
          serviceDetails: inv.serviceDescription || 'N/A',
          paymentMethod: inv.paymentMethod,
          totalAmount: inv.totalAmount,
          date: inv.date || inv.createdAt
      }));
  
      const serviceRows = services.map(s => ({
          serviceId: s.serviceId,
          customerName: s.customerName,
          device: `${s.brand} ${s.deviceType}`,
          status: s.status,
          date: s.createdAt,
          cost: s.estimatedCost || 0
      }));
  
      res.json({ totalRevenue, invoiceRows, serviceRows });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
};

export const getSalesByDateRange = async (req, res) => {
    try {
      const { start, end } = req.query;
      const invoices = await Invoice.find({ createdAt: { $gte: new Date(start), $lte: new Date(end) } });
      const totalRevenue = invoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
      res.json({ totalRevenue, count: invoices.length });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
};

export const getTopSellingProducts = async (req, res) => {
    try {
      const invoices = await Invoice.find({});
      const productStats = {};
      invoices.forEach(inv => {
        (Array.isArray(inv.items) ? inv.items : []).forEach(item => {
          productStats[item.productName] = (productStats[item.productName] || 0) + item.quantity;
        });
      });
      const topProducts = Object.keys(productStats).map(name => ({ name, quantity: productStats[name] })).sort((a,b)=>b.quantity-a.quantity).slice(0, 5);
      res.json(topProducts);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

export const getRecentActivities = async (req, res) => {
    try {
      const activities = await ActivityLog.find({}).populate('user', 'name role').sort({ createdAt: -1 }).limit(10);
      res.json(activities);
    } catch (error) { res.status(500).json({ message: error.message }); }
};

export const getDemandPrediction = async (req, res) => {
    try {
        const lowStockItems = await Inventory.find({ quantity: { $lt: 5 } }).select('productName quantity category').sort({ quantity: 1 }).limit(5);
        res.json({ lowStockItems });
    } catch (error) { res.status(500).json({ message: error.message }); }
};

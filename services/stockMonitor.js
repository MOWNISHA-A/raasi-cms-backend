import cron from 'node-cron';
import Inventory from '../models/Inventory.js';

import Notification from '../models/Notification.js';

export const startStockMonitor = () => {
  // Run every 12 hours
  cron.schedule('0 */12 * * *', async () => {
    console.log('Running stock monitoring check...');
    try {
      const lowStockItems = await Inventory.find({
        quantity: { $lt: 5 }
      });

      if (lowStockItems.length > 0) {
        const itemList = lowStockItems.map(item => `${item.productName} (Stock: ${item.quantity})`).join('\n');

        // Send Email to Admin
        for (const item of lowStockItems) {
          console.log(`Low stock alert for ${item.productName}`);
          await sendLowStockAlert(
            process.env.ADMIN_EMAIL,
            item.productName,
            item.quantity
          );
        }

        // Also create an in-app notification for Admin (role based logic would be in controller, here we just target admin ID from env or similar)
        // For simplicity, we can log it for admin users to see in their notifications feed
        console.log(`Alert sent for ${lowStockItems.length} items.`);
      }
    } catch (error) {
      console.error('Error in stock monitor:', error);
    }
  });
};

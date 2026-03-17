import ActivityLog from '../models/ActivityLog.js';
import Notification from '../models/Notification.js';

export const logActivity = async (userId, action, module, details = '') => {
  try {
    await ActivityLog.create({
      user: userId,
      action,
      module,
      details
    });
  } catch (error) {
    console.error('Logging Error:', error);
  }
};

export const createNotification = async (userId, title, message, type = 'Info') => {
  try {
    await Notification.create({
      user: userId,
      title,
      message,
      type
    });
  } catch (error) {
    console.error('Notification Error:', error);
  }
};

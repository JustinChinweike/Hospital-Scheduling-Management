
import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import User from '../models/User.js';
import Log from '../models/Log.js';
import MonitoredUser from '../models/MonitoredUser.js';

// Function to analyze logs and detect suspicious activity
const analyzeLogs = async () => {
  try {
    // Get timestamp for one minute ago
    const oneMinuteAgo = new Date();
    oneMinuteAgo.setMinutes(oneMinuteAgo.getMinutes() - 1);

    // Find users with high activity in the last minute
    const suspiciousActivity = await Log.findAll({
      attributes: [
        'userId',
        [sequelize.fn('COUNT', sequelize.col('id')), 'actionCount']
      ],
      where: {
        createdAt: { [Op.gte]: oneMinuteAgo }
      },
      group: ['userId'],
      having: sequelize.literal('COUNT(id) > 10'),
      include: [
        {
          model: User,
          attributes: ['username', 'role'],
          // Exclude admins from monitoring
          where: { role: { [Op.ne]: 'ADMIN' } }
        }
      ]
    });

    // Add suspicious users to monitored users list
    for (const activity of suspiciousActivity) {
      // Check if user is already monitored
      const existingMonitored = await MonitoredUser.findOne({
        where: { userId: activity.userId }
      });

      if (!existingMonitored) {
        await MonitoredUser.create({
          userId: activity.userId,
          reason: `Performed ${activity.dataValues.actionCount} actions in 1 minute`,
          detectedAt: new Date()
        });
        
        console.log(`User ${activity.User.username} added to monitored list`);
      }
    }
  } catch (error) {
    console.error('Error in monitoring thread:', error);
  }
};

// Run the analysis every 10 seconds
setInterval(analyzeLogs, 10000);

console.log('Monitoring thread started');

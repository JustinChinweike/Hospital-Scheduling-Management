
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
        [sequelize.fn('COUNT', sequelize.col('Log.id')), 'actionCount']
      ],
      where: {
        createdAt: { [Op.gte]: oneMinuteAgo }
      },
      group: ['userId', 'User.id', 'User.username', 'User.role'],
      having: sequelize.literal('COUNT("Log"."id") > 5'), // Reduced threshold to make detection easier
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
          detectedAt: new Date().toISOString() // Store as ISO string for consistent parsing
        });
        
        console.log(`User ${activity.User.username} added to monitored list`);
      }
    }
  } catch (error) {
    console.error('Error in monitoring thread:', error);
  }
};

// Run the analysis every 5 seconds (reduced from 10 for quicker testing)
setInterval(analyzeLogs, 5000);

console.log('Monitoring thread started');

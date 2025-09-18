
import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import User from '../models/User.js';
import Log from '../models/Log.js';
import MonitoredUser from '../models/MonitoredUser.js';

let intervalRef = null;

// Analyze logs and detect suspicious activity patterns; emit via io when new monitored users appear
const analyzeLogs = async (io) => {
  try {
    // Get timestamp for one minute ago
    const oneMinuteAgo = new Date();
    oneMinuteAgo.setMinutes(oneMinuteAgo.getMinutes() - 1);

    // Pattern 1: High general activity (any actions) by non-admin users
    const highActivity = await Log.findAll({
      attributes: [
        'userId',
        [sequelize.fn('COUNT', sequelize.col('Log.id')), 'actionCount']
      ],
      where: {
        createdAt: { [Op.gte]: oneMinuteAgo }
      },
      group: ['userId', 'User.id', 'User.username', 'User.role'],
      having: sequelize.literal('COUNT("Log"."id") > 10'),
      include: [
        {
          model: User,
          attributes: ['username', 'role'],
          // Exclude admins from monitoring
          where: { role: { [Op.ne]: 'ADMIN' } }
        }
      ]
    });

    // Pattern 2: Repeated auth failures (including 2FA) regardless of success actions
    const authFailureCounts = await Log.findAll({
      attributes: [
        'userId',
        [sequelize.fn('COUNT', sequelize.col('Log.id')), 'failCount']
      ],
      where: {
        createdAt: { [Op.gte]: oneMinuteAgo },
        entityType: { [Op.in]: ['AUTH_FAIL', 'AUTH_FAIL_2FA'] }
      },
      group: ['userId', 'User.id', 'User.username', 'User.role'],
      having: sequelize.literal('COUNT("Log"."id") >= 3'),
      include: [
        {
          model: User,
          attributes: ['username', 'role'],
          where: { role: { [Op.ne]: 'ADMIN' } }
        }
      ]
    });

    const suspiciousSets = [
      ...highActivity.map(r => ({ type: 'HIGH_ACTIVITY', record: r })),
      ...authFailureCounts.map(r => ({ type: 'AUTH_FAILURES', record: r }))
    ];

    for (const item of suspiciousSets) {
      const activity = item.record;
      // Check if user is already monitored
      const existingMonitored = await MonitoredUser.findOne({
        where: { userId: activity.userId }
      });

      if (!existingMonitored) {
        let reason;
        let pattern = 'UNKNOWN';
        let activityCount = null;
        let failureCount = null;
        if (item.type === 'HIGH_ACTIVITY') {
          reason = `High activity: ${activity.dataValues.actionCount} actions in < 1 min`;
          pattern = 'HIGH_ACTIVITY';
          activityCount = Number(activity.dataValues.actionCount) || 0;
        } else if (item.type === 'AUTH_FAILURES') {
          reason = `Repeated auth failures: ${activity.dataValues.failCount} attempts in < 1 min`;
          pattern = 'AUTH_FAILURES';
          failureCount = Number(activity.dataValues.failCount) || 0;
        } else {
          reason = 'Suspicious pattern detected';
        }

        const record = await MonitoredUser.create({
          userId: activity.userId,
          reason,
          pattern,
          activityCount,
          failureCount,
          detectedAt: new Date().toISOString()
        });
        console.log(`Monitoring: user ${activity.User.username} flagged (${reason})`);
        // Emit socket event to admins
        if (io) {
          io.emit('monitoredUser:new', {
            id: record.id,
            userId: record.userId,
            username: activity.User.username,
            reason: record.reason,
            pattern: record.pattern,
            activityCount: record.activityCount,
            failureCount: record.failureCount,
            detectedAt: record.detectedAt
          });
        }
      }
    }
  } catch (error) {
    console.error('Error in monitoring thread:', error);
  }
};

export const startMonitoring = (io) => {
  if (intervalRef) return; // prevent multiple intervals
  intervalRef = setInterval(() => analyzeLogs(io), 5000);
  console.log('Monitoring thread started (patterns: high activity >10/min, auth failures >=3/min)');
};

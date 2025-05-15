
import { faker } from '@faker-js/faker';
import sequelize from './config/database.js';
import User from './models/User.js';
import Schedule from './models/Schedule.js';
import Log from './models/Log.js';

// Create initial admin and user accounts
const createInitialUsers = async () => {
  try {
    // Create admin user
    await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: 'password',
      role: 'ADMIN'
    });

    // Create regular user
    await User.create({
      username: 'user',
      email: 'user@example.com',
      password: 'password',
      role: 'USER'
    });

    console.log('Initial users created');
  } catch (error) {
    console.error('Error creating initial users:', error);
  }
};

// Generate departments
const departments = [
  'Cardiology',
  'Neurology',
  'Pediatrics',
  'Orthopedics',
  'Oncology',
  'Emergency',
  'Surgery',
  'Internal Medicine',
  'Dermatology',
  'Psychiatry'
];

// Generate actions
const actions = ['CREATE', 'READ', 'UPDATE', 'DELETE'];

// Generate large dataset for Silver tier requirement
const seedDatabase = async () => {
  try {
    // Reset database
    await sequelize.sync({ force: true });
    console.log('Database reset');

    // Create initial users
    await createInitialUsers();

    // Get user IDs for reference
    const users = await User.findAll();
    const userIds = users.map(user => user.id);

    // Generate 100,000 schedules
    console.log('Generating schedules...');
    const schedules = [];

    for (let i = 0; i < 100000; i++) {
      const userId = userIds[Math.floor(Math.random() * userIds.length)];
      
      schedules.push({
        doctorName: faker.person.fullName(),
        patientName: faker.person.fullName(),
        dateTime: faker.date.future(),
        department: departments[Math.floor(Math.random() * departments.length)],
        userId
      });
      
      // Insert in batches to avoid memory issues
      if (schedules.length === 1000 || i === 99999) {
        await Schedule.bulkCreate(schedules);
        console.log(`Created ${i + 1} schedules`);
        schedules.length = 0; // Clear the array
      }
    }

    // Create indices for performance (Silver tier optimization)
    await sequelize.query('CREATE INDEX idx_schedules_doctor ON "Schedules" ("doctorName")');
    await sequelize.query('CREATE INDEX idx_schedules_department ON "Schedules" ("department")');
    await sequelize.query('CREATE INDEX idx_schedules_date ON "Schedules" ("dateTime")');
    await sequelize.query('CREATE INDEX idx_logs_user_date ON "Logs" ("userId", "createdAt")');

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    process.exit();
  }
};

seedDatabase();


# Hospital Scheduler System

This project implements a hospital scheduler system with both frontend and backend components.

## Features

### Bronze Tier Features
- Database relationships between entities (Users, Schedules, Logs, MonitoredUsers)
- Full CRUD operations for schedules
- Filtering and sorting on the schedule list
- ORM (Sequelize) for database operations

### Silver Tier Features
- Database seeding with 100,000+ entries
- Performance optimized database with indices
- Complex query optimization for statistics

### Gold Tier Features
- User authentication (register/login)
- User roles (Regular User and Admin)
- Logging system for all CRUD operations
- Background monitoring thread that detects suspicious activity
- Admin dashboard with monitored users list and activity logs
- Simulated attack scenario

## Project Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- PostgreSQL database

### Setting Up the Backend
1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install the required dependencies:
   ```
   npm install
   ```

3. Set up your PostgreSQL database:
   - Make sure PostgreSQL is installed and running
   - Create a database named `hospital_schedule`
   - Update the `.env` file with your database credentials if needed

4. Seed the database with initial data:
   ```
   npm run seed
   ```
   This will create:
   - Admin user: admin@example.com / password
   - Regular user: user@example.com / password
   - 100,000+ sample schedule records

5. Start the backend server:
   ```
   npm run dev
   ```
   The backend server will run on http://localhost:5000

### Setting Up the Frontend
1. Open a new terminal and navigate to the project root directory

2. Install frontend dependencies:
   ```
   npm install
   ```

3. Create a `.npmrc` file in the root directory with the following content:
   ```
   legacy-peer-deps=true
   ```

4. Start the frontend development server:
   ```
   npm run dev
   ```
   The frontend application will be available at http://localhost:8080

## Using the Application

### Login Credentials
- **Admin User**: 
  - Email: admin@example.com
  - Password: password

- **Regular User**: 
  - Email: user@example.com
  - Password: password

### Main Features
1. **Authentication**: Register new users or login with existing accounts
2. **Add Schedules**: Create new hospital appointments
3. **List Schedules**: View, filter, and sort all hospital appointments
4. **Admin Dashboard**: Monitor system activity and suspicious users (admin only)

## Troubleshooting

### Backend Issues
- Ensure PostgreSQL is running and accessible
- Check that the database credentials in the `.env` file are correct
- Verify that port 5000 is not in use by another application

### Frontend Issues
- If you encounter dependency conflicts, ensure the `.npmrc` file contains `legacy-peer-deps=true`
- Clear browser cache if you experience unexpected behaviors
- Check the browser console for any error messages

## Performance Monitoring

For Silver tier performance testing, JMeter or similar tools can be used to test the API endpoints under load.

## Security Features

The system includes a monitoring thread that detects suspicious activity:
- Tracks users with high activity rates
- Identifies potential attack patterns
- Alerts admins via the dashboard

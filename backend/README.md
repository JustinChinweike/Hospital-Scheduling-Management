
# Hospital Scheduling System Backend

This backend implements a complete solution for the Hospital Scheduling System, meeting Bronze, Silver, and Gold tier requirements.

## Setup Instructions

1. Install dependencies:
   ```
   npm install
   ```

2. Set up PostgreSQL database:
   - Make sure PostgreSQL is installed and running
   - Create a database named `hospital_scheduler`
   - Update `.env` file with your database credentials if needed

3. Run database seed script to create initial data:
   ```
   npm run seed
   ```
   This will create:
   - Admin user: admin@example.com / password
   - Regular user: user@example.com / password
   - 100,000 sample schedule records

4. Start the server:
   ```
   npm run dev
   ```

## Features Implemented

### Bronze Tier
- Database relationships (one-to-many between User and Schedule)
- Complete CRUD operations for schedules
- Filtering and sorting capabilities
- Uses Sequelize ORM

### Silver Tier
- Database populated with 100,000+ entries
- Performance optimizations (indexes)
- Optimized queries for statistics

### Gold Tier
- Authentication system (register/login)
- User roles (Admin and Regular User)
- Complete logging system
- Background monitoring thread
- Admin dashboard API
- Simulated attack detection

## API Documentation

### Authentication
- POST /auth/register - Register a new user
- POST /auth/login - Login
- GET /auth/me - Get current user info

### Schedules
- GET /schedules - List schedules with filtering options
- POST /schedules - Create schedule
- GET /schedules/:id - Get a specific schedule
- PATCH /schedules/:id - Update a schedule
- DELETE /schedules/:id - Delete a schedule

### Admin
- GET /admin/monitored-users - List suspicious users
- GET /admin/logs - Get system logs
- GET /admin/statistics - Get system statistics

### Utility
- GET /health - System health check


# Hospital Scheduling System

This application is a comprehensive Hospital Scheduling System that meets all requirements for Bronze, Silver, and Gold tier features.

## Features

### Bronze Tier
- **Database Relationships**: One-to-many relationship between users and schedules
- **Full CRUD Support**: Create, read, update, and delete operations for schedules
- **Filtering and Sorting**: Filter schedules by doctor, patient, department, and more
- **ORM Integration**: Uses Sequelize for database operations

### Silver Tier
- **Large Dataset**: Populated with 100,000+ records for performance testing
- **Performance Optimization**: Database indices and query optimization
- **Complex Queries**: Optimized statistical queries

### Gold Tier
- **Authentication System**: Register and login functionality
- **User Roles**: Admin and regular user roles with proper permissions
- **Logging System**: Tracks all CRUD operations
- **Background Monitoring**: Detects suspicious user activity
- **Admin Dashboard**: View monitored users and system logs
- **Simulated Attack**: Demonstrates security monitoring capabilities

## Project Structure

The project consists of two main parts:

1. **Frontend**: React application with Tailwind CSS and shadcn/UI
2. **Backend**: Express.js server with PostgreSQL database using Sequelize ORM

## Getting Started

### Prerequisites
- Node.js
- PostgreSQL

### Setup

1. Clone the repository

2. Setup backend:
   ```bash
   cd backend
   npm install
   # Update .env file with your PostgreSQL credentials
   npm run seed # This will create admin and user accounts and seed the database
   npm run dev
   ```

3. Setup frontend:
   ```bash
   npm install
   npm run dev
   ```

4. Access the application at http://localhost:8080

### Default Users
- Admin: admin@example.com / password
- User: user@example.com / password

## Technical Implementation

- **Real-time Updates**: WebSockets for instant data synchronization
- **Responsive Design**: Works on mobile, tablet, and desktop
- **Error Handling**: Comprehensive error handling and user feedback
- **Security**: JWT authentication and role-based access control
- **Performance**: Optimized database queries and frontend performance

## Database Schema

- **Users**: Store user accounts and roles
- **Schedules**: Store hospital appointments
- **Logs**: Track all system actions
- **MonitoredUsers**: Track suspicious users

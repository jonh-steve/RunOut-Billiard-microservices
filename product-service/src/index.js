require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

// Environment variables
const PORT = process.env.PORT || 3002;

// Connect to MongoDB then start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    // console.log(`MongoDB connected successfully`);
    
    // Start the server
    const server = app.listen(PORT, () => {
      console.log(`Service running on port ${PORT} in ${process.env.NODE_ENV} mode`);
    });

    // Handle unhandled rejections
    process.on('unhandledRejection', (err) => {
      console.error(`Unhandled Rejection: ${err.message}`);
      server.close(() => {
        throw err;
        // process.exit(1);
      });
    });

    // Handle SIGTERM
    process.on('SIGTERM', () => {
      console.log('SIGTERM received. Shutting down gracefully...');
      server.close(() => {
        console.log('Process terminated.');
      });
    });
  } catch (error) {
    console.error(`Error starting server: ${error.message}`);
    throw error;
    // process.exit(1);
  }
};

startServer();
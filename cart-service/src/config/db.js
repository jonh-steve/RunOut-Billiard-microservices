const mongoose = require('mongoose');

// MongoDB connection options
// const options = {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// };

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    throw new Error('Failed to connect to MongoDB');
    // process.exit(1);
  }
};

module.exports = connectDB;
import mongoose from 'mongoose';

const connectDB = async () => {
  const isProd = process.env.NODE_ENV === 'production';
  const uri = process.env.MONGO_URI || (isProd ? '' : 'mongodb://localhost:27017/attendance_dev');
  if (!uri) {
    console.error('No Mongo URI found. Set MONGO_URI in environment.');
    process.exit(1);
  }
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    console.log('MongoDB Connected');
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  }
};

export default connectDB;

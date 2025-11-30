import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let memoryServer; // for dev fallback

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/attendance_dev';
  const opts = { useNewUrlParser: true, useUnifiedTopology: true };
  try {
    await mongoose.connect(uri, opts);
    console.log('MongoDB Connected');
  } catch (err) {
    console.error('Primary DB connection failed:', err.message);
    console.log('Starting in-memory MongoDB for development...');
    memoryServer = await MongoMemoryServer.create();
    const memUri = memoryServer.getUri('attendance_dev');
    await mongoose.connect(memUri, opts);
    console.log('In-memory MongoDB Connected');
  }
};

export default connectDB;
import mongoose from 'mongoose';

const connectDB = async () => {
  const isProd = process.env.NODE_ENV === 'production';
  const uri = process.env.MONGO_URI || (isProd ? '' : 'mongodb://localhost:27017/attendance_dev');
  if (!uri) {
    console.error('No Mongo URI found. Set MONGO_URI in environment.');
    process.exit(1);
  }
  try {
    const host = (() => {
      try {
        const m = String(uri).split('@')[1] || String(uri);
        const h = m.split('/')[0];
        return h;
      } catch { return ''; }
    })();
    if (host) console.log(`Connecting to MongoDB host: ${host}`);
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 20000 });
    console.log('MongoDB Connected');
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  }
};

export default connectDB;

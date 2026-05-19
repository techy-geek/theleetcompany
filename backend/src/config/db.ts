import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI as string);
    console.log(`MongoDB connected successfully : ${conn.connection.host}`);
  } catch (error: any) {
    console.log(`Error : ${error.message}`);
    process.exit(1);
  }
}

export default connectDB;

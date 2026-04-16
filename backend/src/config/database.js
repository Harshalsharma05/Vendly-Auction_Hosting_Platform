import mongoose from "mongoose";

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    console.error("MongoDB Connection Error: MONGO_URI is not set.");
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);

    if (/querySrv ESERVFAIL/i.test(error.message)) {
      console.error(
        "Atlas SRV lookup failed. Verify the cluster hostname in MONGO_URI and your DNS/network access.",
      );
      console.error(
        "Try replacing mongodb+srv with a direct mongodb:// URI from Atlas connection options if DNS issues persist.",
      );
    }

    process.exit(1); // Exit process with failure
  }
};

export default connectDB;

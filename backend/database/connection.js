import mongoose from 'mongoose';

/** Connects to MongoDB via Mongoose
 * Using Atlas_URI, but can use MongoDB Compass_URI too (change in the .env file)
 */
const connectDB = async () => {
    try {
        // Uses env connection string
        await mongoose.connect(process.env.ATLAS_URI);
        console.log("Connection created successfully");
    } catch (error){
        console.error("Connection failed", error.message);
        // Stop if DB is unavailable
        process.exit(1);
    }
}

export default connectDB;
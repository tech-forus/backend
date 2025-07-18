import mongoose from "mongoose";
import dotenv from 'dotenv';

dotenv.config();

const connectDatabase = async(res) => {
    try {
        const url = process.env.MONGO_DB_URL;
        const connectDB = await mongoose.connect(url);
        if (connectDB) {
            console.log(`Connected to DB ${connectDB.connection.host}`);
        }
        else {
            console.log(`Failed to connect DB`);
        }
    } catch (error) {
        console.log(error);
    }
}

export default connectDatabase;
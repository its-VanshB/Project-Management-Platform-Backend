import mongoose from "mongoose";

const connectDB = async () => {
    try{
        await mongoose.connect(process.env.MONGO_URI);
        console.log("mongo db connected");
    } catch (error) {
        console.error("mongo db connection error" , error);
        process.exit();
    }
};

export default connectDB;
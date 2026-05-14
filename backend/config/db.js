import mongoose from "mongoose";

export const connectDB= async ()=>{
    await mongoose.connect("mongodb+srv://hashdevinfo_db_user:0giAgDy9gn5u8IvM@cluster0.quk9ljt.mongodb.net/NOOREstates")
    .then(() => {
        console.log("DB CONNECTED");
        
    })
}
import express from "express"
import cors from "cors"
import "dotenv/config"
import http from 'http'
import {Server} from "socket.io"
import { connectDB } from "./config/db.js";
import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import properityRouter from "./routes/property.routes.js";
import inquiryRouter from "./routes/inquiry.routes.js";
import wishlistRouter from "./routes/wishlist.routes.js";
import chatRouter from "./routes/chat.routes.js";
import contactRouter from "./routes/conact.routes.js";
import adminRouter from "./routes/admin.routes.js";



const app= express();
const PORT= 5000;

// DB
connectDB();


// Middlewares
const allowedOrigins=[
"http://localhost:5173",
].filter(Boolean);
app.use(cors({
    origin: function(origin, callback){
        if(!origin || allowedOrigins.includes(origin)){
            callback(null,true);
        }else{
            callback(new Error("Not allowed by CORS"))
        }
    },
    credentials: true
}));
app.use(express.json());


app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`)
    next()
})
// Routes
app.use("/api/auth", authRouter)
app.use("/api/users", userRouter)
app.use("/api/property", properityRouter)
app.use("/api/inquiry",inquiryRouter)
app.use("/api/wishlist",wishlistRouter)
app.use("/api/contact",contactRouter)
app.use("/api/admin",adminRouter)
app.use("/api/chat",chatRouter)

app.get("/",(req,res)=>{
    res.send("API WORKING");
});

const server=http.createServer(app);

// socket.io setup

const io= new Server(server,{
    cors:{
        origin:allowedOrigins,
        methods:["GET","POST"],
    }
})
io.on("connection",(socket)=>{
    socket.on("joinChat",(chatId)=>{
        socket.join(chatId)
    })
    socket.on("sendMessage",(data)=>{
        io.to(data.chatId).emit("receiveMessage",data)
    })
    socket.on("disconnect",()=>{})
})


server.listen(PORT,()=>{
    console.log(`Server Started on http://localhost:${PORT}`)
})





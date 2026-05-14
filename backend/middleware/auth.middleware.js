import jwt from "jsonwebtoken"
import User from "../models/user.model.js"

// Protect

export const protect= async (req, res, next)=>{
    try {
        let token;
        if(
            req.headers.authorization && req.headers.authorization.startsWith("Bearer")
        ){
            token =req.headers.authorization.split(" ")[1]
        }
        if(!token){
            return res.status(401).json({
                success: false,
                message: "Not authorized, token missing"
            })
        }

        const decoded= jwt.verify(token, process.env.JWT_SECRET)

        req.user = await User.findById(decoded.id).select("-password")

        if (req.user && req.user.isBlocked){
            return res.status(403).json({
                success: false,
                message: "Your account has been blocked by admin"
            })
        }

        next();

        
    } catch (err) {
        res.status(401).json({
                success: false,
                message: "Token invalid"
            })
    }
}

// role base Authentication

export const authorize=(...roles)=>{
    return(req,res,next)=>{
        if (!roles.includes(req.user.role)){
            return res.status(403).json({
                success: false,
                message: "Access Denied. You dont have permission."
            })
        }
        next();
    }
}
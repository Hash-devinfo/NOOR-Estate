import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import sendEmail from "../utils/sendEmail.js"
import jwt from "jsonwebtoken"
import crypto from "crypto"




// Register

export const register = async (req,res)=>{
    try {
        const {name,email,password,role}= req.body;
        const userExist=await User.findOne({email});

        if(userExist){
            return res.status(400).json({
                message:"user Already Exist"
            });
        }

        const hashedPassword= await bcrypt.hash(password,10);
        const verificationToken= Math.floor(100000 + Math.random() * 900000).toString();

        const user= await User.create({
            name,
            email,
            password: hashedPassword,
            role,
            isApproved: role === "seller"?false : true,
            verificationToken
        });
        try {
            await sendEmail({
                email,
                subject:"Verify Your Email - NOOR-Estates Paltform",
                message:`<p>Your Email verification code is: <Strong>${verificationToken}</Strong></p><p>Please enter this code to activate your Account</p>`
            })
        } catch (emailError) {
            console.error("Failed to send Verification email:",emailError);
            // we still create the user
        }

        res.status(201).json({
            message:"User registered. Please check your email for the verification code.",
            user:{
                email: user.email,
                name: user.name,
                role: user.role
            }
        })



    } catch (err) {
        res.status (500).json({
            message: err.message
        })
    }
}

// Login

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email and Password are required." })
        }

        const user = await User.findOne({ email }).select("+password")  // ✅
        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid email or password" })
        }

        if (!user.isVarified) {
            return res.status(403).json({ success: false, message: "Please verify your email or contact support" })
        }

        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Invalid email or password" })
        }

        if (user.isBlocked) {
            return res.status(403).json({ success: false, message: "Your Account is blocked by Admin. Please contact support." })
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        )

        const { password: _, ...safeUser } = user.toObject()  // ✅
        res.json({ success: true, message: "Login Successfully", token, user: safeUser })

    } catch (err) {
        res.status(500).json({ success: false, message: err.message })
    }
}


// to get Profile

export const getME= async (req,res)=>{
    try {
        const user= await User.findById(req.user.id).select("-pasword");
        if (!user){
            return res.status(404).json({
                message:"User not found"
            })
        }
        res.json({
            success: true,
            user,
        })



    } catch (err) {
        res.status (500).json({
            message: err.message
        })
    }
}

//  verify Email


export const verifyEmail = async (req,res)=>{
    try {
        const {email, code}= req.body
        if(!email || !code){
            return res.status(400).json({
                message:"Email and Code are required."
            })
        }
        const user= await User.findOne({email})
        if (!user){
            return res.status(400).json({
                message:"user Not Found"
            })
        }

        if (user.isVarified){
            return res.status(400).json({
                message:"Email already verified."
            })
        }
        if (user.verificationToken !== code){
            return res.status(400).json({
                message:"Invalid Code"
            })
        }
        user.isVarified=true;
        user.verificationToken=undefined;
        await user.save();
        res.status(200).json({
            message:"Email verified successfully",
            success: true
        })
        
    } catch (err) {
        res.status (500).json({
            message: err.message,
            success:false
        })
    }
}

// forgot Password

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "No user found with that email address" });
        }

        const resetToken = crypto.randomBytes(20).toString("hex");
        const resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 mins

        user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
        user.resetPasswordExpires = resetPasswordExpires;
        await user.save();

        const clientUrl = "http://localhost:5173";
        const resetUrl = `${clientUrl}/reset-password/${resetToken}`;
        const message = `
            <h2>Password Reset Request</h2>
            <p>You requested a password reset. Please click on the link below to reset your password:</p>
            <a href="${resetUrl}" clicktracking="off">${resetUrl}</a>
            <p>This link will expire in 15 minutes.</p>
        `;

        try {
            await sendEmail({
                email: user.email,
                subject: "Password Reset - NOOR-Estate Platform",
                message,
            });
            res.status(200).json({ message: "Password reset email sent", success: true });
        } catch (error) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            await user.save();
            return res.status(500).json({ message: "Could not send email", success: false });
        }
    } catch (err) {
        res.status(500).json({ message: err.message, success: false });
    }
}; // for reset password we required email

// // Now to reset it(password)

export const resetPassword = async(req,res)=>{
    try {
        const {token}= req.params
        const {password}= req.body

        const resetPasswordToken = crypto.createHash("sha256").update(token).digest("hex");
        console.log("Hashed token:", resetPasswordToken)
console.log("Token from URL:", token)
        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpires: {$gt: Date.now()},
           
        })
        
        if (!user){
            return res.status(400).json({
                message:"Invalid or expired password reset token",success:false
            })
        }


        
        user.password= await bcrypt.hash(password,10)
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires= undefined;
        await user.save()  // ✅ save to DB

        res.json({ success: true, message: "Password reset successfully" })

    } catch (err) {
        res.status(500).json({
             message: err.message, success: false 
            });
    }
}







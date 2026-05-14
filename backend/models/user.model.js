import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
        unique:true,
    },
    password:{
        type: String,
        required:true,
        select: false 
    },
    role:{
        type: String,
        enum:["buyer","seller","admin"],
        default:"buyer"
    },
    phone:{
        type:String,
    },
    isBlocked:{
        type:Boolean,
        default:false,
    },
    profilePic:{
        type:String,

    },
    address:{
        type:String,
    },
    isApproved:{
        type:Boolean,
        default:true,
    },
    isVarified:{
        type:Boolean,
        default:false,
    },
    verificationToken:{
        type:String,
    },
    resetPasswordToken:{
        type:String,
    },
    resetPasswordExpires:{
        type:Date,
    },

},
{
    timestamps:true
});

const User= mongoose.model("User",userSchema);

export default User;
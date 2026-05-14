import express from 'express';
import { addProperty, deleteProperty, getAllProperties, getMyProperties, getPropertyCounts, getPropertyDetails, getSellerDashbord, updateProperty } from '../controllers/property.controller.js';
import { authorize, protect } from '../middleware/auth.middleware.js';
import upload from '../middleware/upload.middleware.js';


const properityRouter= express.Router();

properityRouter.get("/", getAllProperties)

// protect the router that only seller can do these works

properityRouter.post("/",protect, authorize("seller"), upload.array('images',10), addProperty)
properityRouter.get("/my", protect,authorize("seller"), getMyProperties)
properityRouter.put("/:id", protect, authorize("seller"), upload.array('images',10), updateProperty)

properityRouter.delete("/:id",protect,authorize("seller"),deleteProperty)
properityRouter.patch("/:id/status", protect, authorize("seller"), updateProperty)

properityRouter.get("/counts", getPropertyCounts)
properityRouter.get("/:id", getPropertyDetails)
properityRouter.get("/seller/dashboard",protect, authorize('seller'), getSellerDashbord)

export default properityRouter;
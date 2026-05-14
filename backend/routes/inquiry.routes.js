import express from "express"
import { authorize, protect } from "../middleware/auth.middleware.js"
import { getBuyerInquiries, getSellerInquiries, markAsRead, sendInquiry } from "../controllers/inquiry.controller.js"



const inquiryRouter= express.Router()

inquiryRouter.post("/", protect, authorize("buyer"), sendInquiry)
inquiryRouter.get("/my", protect, authorize("buyer"), getBuyerInquiries)
inquiryRouter.get("/seller",protect, authorize("seller"), getSellerInquiries)

inquiryRouter.patch("/:id/read", protect, markAsRead)

export default inquiryRouter;
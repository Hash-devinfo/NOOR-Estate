import express from "express";
import Chat from "../models/chat.model.js";
import { protect } from "../middleware/auth.middleware.js";

const chatRouter = express.Router();
chatRouter.use(protect);

// Create or get existing chat
chatRouter.post("/start", async (req, res) => {
  try {
    const { propertyId, sellerId, buyerId: providedBuyerId } = req.body;
    let buyerId, finalSellerId;

    if (req.user.role === "seller") {
      buyerId = providedBuyerId;
      finalSellerId = req.user._id;
    } else {
      buyerId = req.user._id;
      finalSellerId = sellerId;
    }

    if (!buyerId || !finalSellerId) {
      return res.status(400).json({ message: "Missing buyer or seller Id" });
    }

    let chat = await Chat.findOne({ buyer: buyerId, seller: finalSellerId });

    if (!chat) {
      chat = await Chat.create({
        property: propertyId,
        buyer: buyerId,
        seller: finalSellerId,
        messages: [], // ✅ Fixed: was "message"
      });
    }

    chat = await Chat.findById(chat._id)
      .populate("buyer", "name email profilePic")
      .populate("seller", "name email profilePic")
      .populate("property", "title price images");

    res.json(chat);
  } catch (err) {
    res.status(500).json({
      message: "Error creating or fetching chat",
      error: err.message,
    });
  }
});

// Send a message
chatRouter.post("/send", async (req, res) => {
  try {
    const { chatId, text, image } = req.body;
    const userId = req.user._id;

    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    if (
      chat.buyer.toString() !== userId.toString() &&  // ✅ was "userI"
      chat.seller.toString() !== userId.toString()
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const newMessage = {
      sender: userId,
      text,
      image,
      createdAt: new Date(),
    };

    chat.messages.push(newMessage);   // ✅ was "message"
    await chat.save();

    const savedMessage = chat.messages[chat.messages.length - 1];  // ✅ consistent
    res.json({ chat, newMessage: savedMessage });
  } catch (err) {
    res.status(500).json({ message: "Error sending message", error: err.message });
  }
});

// Get all chats for logged-in user
chatRouter.get("/user", async (req, res) => {
  try {
    const userId = req.user._id;
    const chats = await Chat.find({ $or: [{ buyer: userId }, { seller: userId }] })
      .populate("buyer", "name email profilePic")
      .populate("seller", "name email profilePic")
      .populate("property", "title price images")
      .sort({ updatedAt: -1 });

    res.json(chats);
  } catch (err) {
    res.status(500).json({ message: "Error fetching chats", error: err.message });
  }
});

// Get single chat by ID
chatRouter.get("/:chatId", async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.chatId).populate(
      "messages.sender", // ✅ Fixed: was "message.sender"
      "name profilePic"
    );

    if (!chat) return res.status(404).json({ message: "Chat not found" });

    const userId = req.user._id.toString();
    if (chat.buyer.toString() !== userId && chat.seller.toString() !== userId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    res.json(chat);
  } catch (err) {
    res.status(500).json({ message: "Error fetching chat", error: err.message });
  }
});

// Delete entire chat
chatRouter.delete("/:chatId", async (req, res) => {
  try {
    const userId = req.user._id;
    const chat = await Chat.findById(req.params.chatId);

    if (!chat) return res.status(404).json({ message: "Chat not found" });

    // ✅ Fixed: was "user.Id"
    if (
      chat.buyer.toString() !== userId.toString() &&
      chat.seller.toString() !== userId.toString()
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await Chat.findByIdAndDelete(req.params.chatId);
    res.json({ message: "Chat deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting chat", error: err.message });
  }
});

// Delete a single message
chatRouter.delete("/:chatId/message/:messageId", async (req, res) => {
  try {
    const userId = req.user._id;
    const chat = await Chat.findById(req.params.chatId); // ✅ Fixed: was "rea"

    if (!chat) return res.status(404).json({ message: "Chat not found" });

    const message = chat.messages.id(req.params.messageId); // ✅ Fixed: was "mesasge"
    if (!message) return res.status(404).json({ message: "Message not found" });

    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    chat.messages.pull(req.params.messageId);
    await chat.save();
    res.json({ message: "Message deleted successfully", chat });
  } catch (err) {
    res.status(500).json({ message: "Error deleting message", error: err.message });
  }
});

export default chatRouter;
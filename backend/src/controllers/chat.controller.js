const chatModel = require("../models/chat.model.js");

async function createChat(req, res) {
  try {
    const { title } = req.body;
    const user = req.user;

    const chat = await chatModel.create({
      user: user._id,
      title,
    });

    res.status(201).json({
      message: "Chat created successfully",
      chat: {
        _id: chat._id,
        title: chat.title,
        lastActivity: chat.lastActivity,
        user: {
            user: chat.user,
        }
      },
    });
  } catch (error) {
    console.error("Error creating chat:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = {
  createChat,
};
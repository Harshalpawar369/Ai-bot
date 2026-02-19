const { Server } = require("socket.io");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const userModel = require("../models/user.model.js");
const aiService = require("../services/ai.service.js");
const messageModel = require("../models/message.model.js");
const { createMemory,queryMemory } = require("../services/vector.server.js");

function initSocketServer(httpServer) {
  const io = new Server(httpServer, {});

  io.use(async (socket, next) => {
    const cookies = cookie.parse(socket.request.headers?.cookie || "");

    if (!cookies.token) {
      next(new Error("Authentication error: No token provided"));
    }

    try {
      const decoded = jwt.verify(cookies.token, process.env.JWT_SECRET);
      const user = await userModel.findOne(decoded._id);

      if (!user) {
        next(new Error("Authentication error: User not found"));
      }

      socket.user = user;

      next();
    } catch (error) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log("a user connected", socket.id);

    

    socket.on("ai-message", async (messagePayload) => {


      let parsedData;
      if (typeof messagePayload === "string") {
        parsedData = JSON.parse(messagePayload);
      } else {
        parsedData = messagePayload;
      }

      const chatId = parsedData.chat;
      const userMessage = parsedData.message;

      const [message, vectors] = await Promise.all([
        messageModel.create({
          chat: messagePayload.chat,
          user: socket.user._id,
          content: userMessage,
          role: "user",
        }),
        aiService.generateEmbedding(userMessage),
      ]);

     

  
      await createMemory({
          vectors: vectors,
          messageId: message._id, 
          metadata: { 
            chatId: chatId.toString(), 
            userId: socket.user._id.toString(),
            role: "user"
          }
        });
 




      const chatHistory = await messageModel.find({
        chat: messagePayload.chat,
      });
      // console.log("chat history", chatHistory.map(item =>{
      //     return {
      //         role: item.role,
      //         parts: [{text: item.content}]
      //     }
      // }));

      console.log("message payload", messagePayload);

      const response = await aiService.generateResponse(userMessage);

      await messageModel.create({
        chat: messagePayload.chat,
        user: socket.user._id,
        content: response,
        role: "model",
      });
      socket.emit("response", response);
    });

    socket.on("disconnect", (socket) => {
      console.log("user disconnected", socket.id);
    });
  });
}

module.exports = initSocketServer;

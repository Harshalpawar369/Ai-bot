const { Server } = require("socket.io");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const userModel = require("../models/user.model.js");
const aiService = require("../services/ai.service.js");
const messageModel = require("../models/message.model.js");
const { createMemory, queryMemory } = require("../services/vector.server.js");

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
      try {
        let parsedData = typeof messagePayload === "string" 
          ? JSON.parse(messagePayload) 
          : messagePayload;

        const chatId = parsedData.chat;
        const userMessage = parsedData.message;

        const [savedUserMessage, userVectors] = await Promise.all([
          messageModel.create({
            chat: chatId,
            user: socket.user._id,
            content: userMessage,
            role: "user",
          }),
          aiService.generateEmbedding(userMessage),
        ]);

        await createMemory({
          vectors: userVectors,
          messageId: savedUserMessage._id,
          metadata: {
            chatId: chatId.toString(),
            userId: socket.user._id.toString(),
            text: userMessage, 
            role: "user"
          },
        });

        const [memory, chatHistory] = await Promise.all([
          queryMemory({
            queryVector: userVectors,
            limit: 3,
            metadata: {
              userId: socket.user._id.toString(), 
            },
          }),
          messageModel.find({ chat: chatId }).sort({ createdAt: -1 }).limit(20).lean(),
        ]);

        const sortedHistory = chatHistory.reverse();

        const stm = sortedHistory.map((item) => ({
          role: item.role,
          parts: [{ text: item.content }],
        }));

        const ltm = [
          {
            role: "user",
            parts: [{
              text: `These are some previous messages from the chat, use them to generate a response: \n${memory.map((item) => item.metadata.text).join("\n")}`
            }],
          },
        ];


        console.log("Generating AI response...");
        const aiResponseText = await aiService.generateResponse([...ltm, ...stm]);

        const savedAiMessage = await messageModel.create({
          chat: chatId,
          user: socket.user._id,
          content: aiResponseText,
          role: "model",
        });

        socket.emit("response", aiResponseText);

        const responseVectors = await aiService.generateEmbedding(aiResponseText);

        await createMemory({
          vectors: responseVectors, 
          messageId: savedAiMessage._id, 
          metadata: {
            chatId: chatId.toString(),
            userId: socket.user._id.toString(),
            text: aiResponseText,
            role: "model"
          },
        });

        console.log("Cycle complete: Message saved, AI responded, and memories stored.");

      } catch (error) {
        console.error("Error in ai-message handler:", error);
        socket.emit("error", "Something went wrong processing your message.");
      }
    });

    socket.on("disconnect", (socket) => {
      console.log("user disconnected", socket.id);
    });
  });
}

module.exports = initSocketServer;

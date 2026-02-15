const {Server} = require('socket.io')
const cookie = require('cookie')
const jwt = require('jsonwebtoken')
const userModel = require('../models/user.model.js')
const aiService = require('../services/ai.service.js')
const messageModel = require('../models/message.model.js')

function initSocketServer(httpServer) {
         
    const io = new Server(httpServer, {})

    io.use( async (socket, next) => {
        const cookies = cookie.parse(socket.request.headers?.cookie || "");  

        if(!cookies.token){
            next(new Error("Authentication error: No token provided"));
        }

        try{
            const decoded = jwt.verify(cookies.token, process.env.JWT_SECRET);
            const user = await userModel.findOne(decoded._id);

            if(!user){
                next(new Error("Authentication error: User not found"));
            }

            socket.user = user;

            next();
        }catch(error){
            next(new Error("Authentication error: Invalid token"));
        }

        
    })

    io.on('connection', (socket) => {

        console.log('a user connected', socket.id);

        socket.on('message', async (message) => {
    

            await messageModel.create({
                chat: message.chat,
                user: socket.user._id,
                content: message,
                role: 'user'
            })

            const chatHistory = await messageModel.find({
                chat: message.chat
            })
            // console.log("chat history", chatHistory.map(item =>{
            //     return {
            //         role: item.role,
            //         parts: [{text: item.content}]
            //     }
            // }));

            const response = await aiService.generateResponse(chatHistory.map(item =>{
                return {
                    role: item.role,
                    parts: [{text: item.content}]
                }
            }));
        

            await messageModel.create({
                chat: message.chat,
                user: socket.user._id,
                content: response,
                role: 'model'
            })
            socket.emit('response', response);
        });
    
    })

    io.on('discoonect', (socket) => {
        console.log('user disconnected', socket.id);
    })
}

module.exports = initSocketServer;
const {Server} = require('socket.io')
const cookie = require('cookie')
const jwt = require('jsonwebtoken')
const userModel = require('../models/user.model.js')
const aiService = require('../services/ai.service.js')

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
            console.log('Received message:', message);
            const response = await aiService.generateResponse(message);
            console.log('AI response:', response);
            socket.emit('response', response);
        });
    
    })

    io.on('discoonect', (socket) => {
        console.log('user disconnected', socket.id);
    })
}

module.exports = initSocketServer;
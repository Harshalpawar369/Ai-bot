require('dotenv').config();
const app = require('./src/app.js')
const connectDB = require('./src/db/db.js')
const initSocketServer = require("./src/sockets/server.socket.js");
const httpServer = require('http').createServer(app)

connectDB()

 initSocketServer(httpServer)

httpServer.listen(3000, () => {
    console.log("server is running on port 3000");
})

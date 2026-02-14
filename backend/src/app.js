const express = require('express');
const cookieParser = require('cookie-parser')

const authRoute = require('./routers/auth.route.js')
const chatRoute = require('./routers/chat.route.js')

const app = express();

app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(cookieParser())

app.use('/api/auth/user', authRoute)

app.use('/api/chat', chatRoute)

module.exports = app;
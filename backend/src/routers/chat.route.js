const express = require("express");
const chatModel = require("../models/chat.model.js");
const authMiddleware = require("../middlewares/user.middleware.js");
const chatConroller = require("../controllers/chat.controller.js");

const router = express.Router();

router.post("/", authMiddleware.authRoleMiddleware, chatConroller.createChat);

module.exports = router;
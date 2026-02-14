const express = require("express");
const authController = require('../controllers/auth.controller')

const router = express.Router();

router.post("/registerUser", authController.registerUser);

router.post("/login", authController.loginUser);

router.post("/logout", authController.logoutUSer);


module.exports = router;
const userModel = require("../models/user.model.js");
const jwt = require("jsonwebtoken");

async function authRoleMiddleware(req, res, next) {
  const userToken = req.cookies.usertoken;

  if (!userToken) {
    return res.status(401).json({ message: "Please login first" });
  }

  const tryUserToken = async () => {
    if (!userToken) return false;
    const decoded = jwt.verify(userToken, process.env.JWT_SECRET);
    const user = await userModel.findOne({ email: decoded.email });
    if (user) {
      req.user = user;
      req.role = "user";
      return true;
    }
    return false;
  };

  try {
    const isUser = await tryUserToken();
    if (isUser) return next();

    return res.status(404).json({ message: "Invalid Account" });
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

function requireUser(req, res, next) {
  if (req.role !== "user") {
    return res.status(403).json({ message: "User access required" });
  }
  return next();
}

module.exports = { authRoleMiddleware, requireUser };
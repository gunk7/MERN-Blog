const user = require("../models/userModel");
const { verifyAccessToken } = require("../utils/jwt");

exports.authMiddleware = async (req, res, next) => {
  let token;
  const headerAuth = req.headers.authorization;

  if (!headerAuth || !headerAuth.startsWith("Bearer ")) {
    return res.status(401).json({
      data: false,
      success: false,
      message: "Unauthorized, Missing Token",
    });
  }

  try {
    token = headerAuth.split(" ")[1];
    const decoded = verifyAccessToken(token);
    const currentUser = await user.findById(decoded.id).select("-password");
    req.user = currentUser;
    if (!req.user) {
      return res.status(401).json({
        data: false,
        success: false,
        message: "Unauthorized, User Not Found",
      });
    }
    next();
  } catch (error) {
    console.log("JWT ERROR:", error.message);
    return res.status(401).json({
      data: false,
      success: false,
      message: "Unauthorized, Invalid Token",
    });
  }
};

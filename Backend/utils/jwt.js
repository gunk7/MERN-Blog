const jwt = require("jsonwebtoken");

const generateAccessToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }

  return jwt.sign(
    {
      id: user._id,
    },
    process.env.JWT_SECRET,
    { expiresIn: "15min" },
  );
};

const generateRefreshToken = (user) => {
  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error(
      "JWT_REFRESH_SECRET is not defined in environment variables",
    );
  }

  return jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "30d",
  });
};

const verifyAccessToken = (token) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
  }
  return jwt.verify(token, process.env.JWT_SECRET);
};

const verifyRefreshToken = (token) => {
  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error("JWT_REFRESH_SECRET is not defined");
  }
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

/* const tokenOtpType = (user, type) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in environment variables");
  }

  return jwt.sign(
    {
      id: user._id,
      type, 
    },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }, 
  );
};

const verifyOtpToken = (token, expectedType) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  if (decoded.type !== expectedType) {
    throw new Error(`Invalid token type. Expected "${expectedType}"`);
  }

  return decoded; 
}; */
module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};

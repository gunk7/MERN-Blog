const otpGenerator = require("otp-generator");

const generateOTP = (length = 6) => {
 return otpGenerator.generate(length, {
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false,
    digits: true,
  });
};

module.exports = { generateOTP };

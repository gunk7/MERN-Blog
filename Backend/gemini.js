require("dotenv").config();
const readline = require("readline");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = process.env.GEMINI_API_KEY || "YOUR_API_KEY";

const genAI = new GoogleGenerativeAI(API_KEY);

// ✅ Use the SAME model as your curl
const model = genAI.getGenerativeModel({
  model: "gemini-3-flash-preview",
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log("💬 Gemini CLI Chat (type 'exit' to quit)\n");

function askQuestion() {
  rl.question("You: ", async (input) => {
    if (input.toLowerCase() === "exit") {
      console.log("👋 Exiting...");
      rl.close();
      return;
    }

    try {
      const result = await model.generateContent({
        contents: [
          {
            parts: [{ text: input }],
          },
        ],
      });

      const response = result.response.text();
      console.log(`Gemini: ${response}\n`);
    } catch (err) {
      console.error("❌ Error:", err.message);
    }

    askQuestion();
  });
}

askQuestion();

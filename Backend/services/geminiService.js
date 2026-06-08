require("dotenv").config();
const readline = require("readline");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = process.env.GEMINI_API_KEY || "YOUR_API_KEY";

const genAI = new GoogleGenerativeAI(API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-3.1-flash-lite", // or "gemini-3.5-pro" for the pro version
});

async function generateResponse(message) {
  const result = await model.generateContent({
    contents: [{ parts: [{ text: message }] }],
  });
  const response = result.response;
  const usage = response.usageMetadata || {};

  return {
    text: response.text(),
    usage: {
      totalTokenCount: usage.totalTokenCount ?? 0,
      promptTokenCount: usage.promptTokenCount ?? 0,
      candidatesTokenCount: usage.candidatesTokenCount ?? 0,
    },
  };
}

async function generateStreamingResponse(message, history = []) {
  const chatSession = model.startChat({
    history,
    generationConfig: {
      maxOutputTokens: 2048,
    },
  });
  return await chatSession.sendMessageStream(message);
}

module.exports = { generateResponse, generateStreamingResponse, model };


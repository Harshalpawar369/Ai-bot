const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({});

async function generateResponse(message) {
  const prompt = message;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });

   const result = await response;
  return result.text;
}

module.exports = {
    generateResponse
};
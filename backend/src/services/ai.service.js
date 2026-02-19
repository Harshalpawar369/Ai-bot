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

async function generateEmbedding(message) {
      const response = await ai.models.embedContent({
        model: "gemini-embedding-001",
        contents: message,
        config: {
            outputDimensionality: 768
        }
    })

    return response.embeddings[ 0 ].values
}

module.exports = {
    generateResponse,
    generateEmbedding
};




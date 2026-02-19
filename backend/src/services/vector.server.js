require("dotenv").config();
const { Pinecone } = require("@pinecone-database/pinecone");

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

const index = pc.index(
  process.env.PINECONE_INDEX_NAME, 
  process.env.PINECONE_INDEX_HOST
);

async function createMemory({ vectors, metadata, messageId }) {
  if (!Array.isArray(vectors) || vectors.length === 0) {
    throw new Error("Vectors must be a non-empty number[]");
  }

  await index.upsert([
    {
      id: String(messageId), 
      values: vectors,
      metadata: metadata || {},
    },
  ]);
}

async function queryMemory({ queryVector, limit = 5, metadata }) {

  const data = await index.query({
    vector: queryVector,
    topK: limit,
    filter: metadata || undefined,
    includeMetadata: true,
  });

  return data.matches || [];
}

module.exports = {
  createMemory,
  queryMemory
};
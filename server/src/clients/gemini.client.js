const { GoogleGenAI } = require('@google/genai');
const env = require('#config/env');

const client = new GoogleGenAI({
  vertexai: true,
  project: env.GOOGLE_CLOUD_PROJECT,
  location: env.GOOGLE_CLOUD_LOCATION,
});

const generateJson = async ({ instruction, image, schema }) => {
  const response = await client.models.generateContent({
    model: env.GEMINI_MODEL,
    contents: [
      {
        role: 'user',
        parts: [
          { inlineData: { mimeType: image.mimeType, data: image.data.toString('base64') } },
          { text: instruction },
        ],
      },
    ],
    config: {
      responseMimeType: 'application/json',
      responseJsonSchema: schema,
      thinkingConfig: { thinkingLevel: 'LOW' },
    },
  });
  return JSON.parse(response.text);
};

module.exports = { generateJson };

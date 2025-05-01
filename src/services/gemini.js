import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize with hardcoded API key
const GEMINI_API_KEY = "AIzaSyDUayw_Y4hvajwKD3Dic9s6cDcOBIrZqf8";
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export const generateText = async (prompt) => {
  try {
    console.log("Using Gemini 2.0 Flash with API Key:", GEMINI_API_KEY.slice(0, 8) + "...");
    
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",  // Using the latest flash model
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    });

    const result = await model.generateContent({
      contents: [{
        parts: [{ text: prompt }]
      }]
    });
    
    return result.response.text();
  } catch (error) {
    console.error("Gemini API Error:", {
      status: error?.status,
      message: error?.message,
      fullError: JSON.stringify(error, null, 2)
    });
    throw new Error(`Failed to generate content: ${error.message}`);
  }
};
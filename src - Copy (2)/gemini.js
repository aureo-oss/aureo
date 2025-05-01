import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = "AIzaSyDUayw_Y4hvajwKD3Dic9s6cDcOBIrZqf8";
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export const generateText = async (fullPrompt) => {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro-latest",
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
    });

    const result = await model.generateContent(fullPrompt);
    return result.response.text();
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate. Please try again.");
  }
};
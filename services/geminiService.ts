import { GoogleGenAI } from "@google/genai";
import { AgingStyle } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const STYLE_PROMPTS = {
  rustico: "Transform this image to make the person look significantly older (approx 85 years old). Apply deep, pronounced wrinkles, weathered and sun-damaged skin texture, heavy eye bags, and a tired, rugged look. Focus on intense aging signs. Maintain original facial structure and background.",
  natural: "Transform this image to make the person look like a natural older version of themselves (approx 75-80 years old). Add realistic wrinkles, age spots, and grey hair while maintaining a balanced, healthy, and authentic appearance. Keep original facial structure and background.",
  elegante: "Transform this image to make the person look like a sophisticated and well-groomed elderly person. Add refined wrinkles, elegant white/grey hair, and healthy, glowing skin. The look should convey wisdom and sophistication. Maintain original facial structure and background."
};

/**
 * Sends the image to the Gemini model to apply an aging effect based on a selected style.
 */
export const generateAgingEffect = async (base64Image: string, style: AgingStyle = 'natural'): Promise<string> => {
  try {
    const base64Data = base64Image.split(',')[1] || base64Image;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: 'image/jpeg',
            },
          },
          {
            text: STYLE_PROMPTS[style],
          },
        ],
      },
    });

    if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
           return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    }
    
    throw new Error("A resposta da IA não continha dados de imagem.");

  } catch (error) {
    console.error("Error generating aging effect:", error);
    throw new Error("Falha ao processar a imagem. Tente novamente.");
  }
};
import { GoogleGenAI, Type } from "@google/genai";
import { NewsItem } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateMarketNews(day: number, sectors: string[]): Promise<NewsItem> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate a realistic financial news headline and brief content for day ${day} of a stock market simulation. 
      The news should affect one or more of these sectors: ${sectors.join(", ")}.
      Provide a sentiment impact score between -1.0 (very negative) and 1.0 (very positive).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            content: { type: Type.STRING },
            impact: { type: Type.NUMBER },
            affectedSectors: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
          },
          required: ["title", "content", "impact", "affectedSectors"],
        },
      },
    });

    const data = JSON.parse(response.text || "{}");
    return {
      id: Math.random().toString(36).substr(2, 9),
      title: data.title || "Market Opens Quietly",
      content: data.content || "Investors are waiting for more data before making significant moves.",
      impact: data.impact || 0,
      affectedSectors: data.affectedSectors || [],
      timestamp: new Date(),
    };
  } catch (error) {
    console.error("Error generating news:", error);
    return {
      id: Math.random().toString(36).substr(2, 9),
      title: "Market Stability Continues",
      content: "No major news reported today. Markets remain steady.",
      impact: 0,
      affectedSectors: [],
      timestamp: new Date(),
    };
  }
}

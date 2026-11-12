import { GoogleGenAI } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required for AI services.");
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export const aiService = {
  async analyzeSentiment(text: string): Promise<string> {
    try {
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze the sentiment of the following text and return only one word: Positive, Neutral, Negative, or Angry.
        
        Text: "${text}"`,
      });

      const sentiment = response.text?.trim() || "Neutral";
      // Ensure it's one of the expected values
      const validSentiments = ["Positive", "Neutral", "Negative", "Angry"];
      return validSentiments.includes(sentiment) ? sentiment : "Neutral";
    } catch (err) {
      console.error("AI Sentiment Analysis failed:", err);
      return "Neutral";
    }
  }
};

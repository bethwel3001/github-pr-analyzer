import { configureGenkit } from "@genkit-ai/core";
import { googleAI } from "@genkit-ai/googleai";

export default configureGenkit({
  plugins: [
    googleAI({ apiKey: process.env.GOOGLE_API_KEY }),
  ],
  model: "gemini-2.0-flash-exp", 
  theme: "auto",
});
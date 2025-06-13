import { OpenAI } from 'openai';

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

class aiService {
  public async Enhance(text: string) {
    if (text.length < 100) {
      throw new Error('Not enough content provided');
    }
    const result = await openai.chat.completions.create({
      model: 'anthropic/claude-sonnet-4',
      messages: [
        {
          role: 'system',
          content: `You are a professional technical writer and task clarity expert.
Your job is to rewrite the following text to make it:
-Easy to understand for anyone, even WITHOUT a technical background
-Clear, concise, and well-structured
-free of jargon, vague phrases, and ambiguous language.
Improve the clarity, readability, and structure of the text while retaining its original intent and instructions.
Keep the text short, but make sure it remains meaningful and complete.
Preserve all original intent and instructions, but express them in a more accessible and polished way.
Return only the improved version. Do not include explanations.`,
        },
        { role: 'user', content: `${text}` },
      ],
      temperature: 0.7,
    });
    const improvedText = result.choices[0].message.content;
    return improvedText;
  }
}

export default new aiService();

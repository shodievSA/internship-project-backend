import { OpenAI } from 'openai';

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

const supportedModels = [
  'meta-llama/llama-3.3-8b-instruct:free', // free default
  'anthropic/claude-sonnet-4', // paid? default
  'openai/gpt-4-turbo',
  'mistralai/magistral-medium-2506',
  'google/gemini-2.5-flash-preview-05-20',
  'cohere/command-r-plus-08-2024',
  'anthropic/claude-opus-4',
];
class aiService {
  public async Enhance(text: string, modelCount: number) {
    if (modelCount > 3 || modelCount < 0) {
      modelCount = 0;
    }
    if (text.length < 150) {
      throw new Error('Not enough content provided');
    }
    const result = await openai.chat.completions.create({
      model: supportedModels[modelCount],
      messages: [
        {
          role: 'system',
          content: `You are a professional technical writer and task clarity expert.
Your job is to rewrite the following task description or subtask content to make it:
-easy to understand for anyone, even without a technical background,
-clear, concise, and well-structured,
-free of jargon, vague phrases, and ambiguous language.
Keep the text short, but make sure it remains meaningful and complete.
Improve clarity, readability, and structure.
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

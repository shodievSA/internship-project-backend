import { OpenAI } from 'openai';

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});

const enhanceTextFunction = {
  name: 'enhanceText',
  description:
    'Improve clarity, readability, and structure of a piece of text while retaining its intent.',
  parameters: {
    type: 'object',
    properties: {
      enhancedText: {
        type: 'string',
        description:
          'The improved version of the input text. Should be clear, concise, well-structured, and retaining its main intent.',
      },
    },
    required: ['enhancedText'],
  },
};
const sysPrompt = `You are a professional technical writer and task clarity expert.
Your job is to rewrite the following text to make it:
-Easy to understand for anyone, even WITHOUT a technical background
-Clear, concise, and well-structured
-free of jargon, vague phrases, and ambiguous language.
Improve the clarity, readability, and structure of the text while retaining its original intent and instructions.
Keep the text short, but make sure it remains meaningful and complete.
Preserve all original intent and instructions, but express them in a more accessible and polished way.
Return only the improved version. Do not include explanations.
**Do not add any markdown into your response such as asterisk!. Return plain text only!**`;

class aiService {
  public async Enhance(text: string) {
    if (text.length < 100) {
      throw new Error('Not enough content provided');
    }
    const result = await openai.chat.completions.create({
      model: 'anthropic/claude-sonnet-4',
      messages: [
        { role: 'system', content: sysPrompt },
        { role: 'user', content: text },
      ],
      temperature: 0.7,
      tools: [
        {
          type: 'function',
          function: enhanceTextFunction,
        },
      ],
      tool_choice: {
        type: 'function',
        function: { name: 'enhanceText' },
      },
    });
    const parsed = JSON.parse(
      //@ts-ignore
      result.choices[0]?.message?.tool_calls?.[0]?.function?.arguments
    );
    console.log(parsed);
    //@ts-ignore
    return parsed.enhancedText;
  }
}

export default new aiService();

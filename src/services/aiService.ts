import { models } from '@/models';
import { AppError } from '@/types';
import { OpenAI } from 'openai';
import { DailyReport } from '@/types/dailyReport'; 

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

const createTitleFunction = {
  name: 'generate_task_title',
  description:
    'Generates a concise and meaningful title based on the provided task description.',
  parameters: {
    type: 'object',
    properties: {
      title: {
        type: 'string',
        description:
          'The generated task title.',
      },
    },
    required: ['title'],
  },
};

const createSummaryFunction = {
  name: 'generate_summary',
  description:
    'Generates a concise and meaningful summary based on the provided task description.',
  parameters: {
    type: 'object',
    properties: {
      summary: {
        type: 'string',
        description:
          'The generated summary.',
      },
    },
    required: ['summary'],
  },
};

const enhanceDescriptionPrompt = `You are a professional technical writer and task clarity expert.
Your job is to rewrite the following text to make it:
-Easy to understand for anyone, even WITHOUT a technical background
-Clear, concise, and well-structured
-free of jargon, vague phrases, and ambiguous language.
Improve the clarity, readability, and structure of the text while retaining its original intent and instructions.
Keep the text short, but make sure it remains meaningful and complete.
Preserve all original intent and instructions, but express them in a more accessible and polished way.
Return only the improved version. Do not include explanations.
**Do not add any markdown into your response such as asterisk!. Return plain text only!**`;

const createTitlePrompt = `You are a professional technical writer and task clarity expert.
Your job is to read a task description and generate a short, clear, and specific title for it.
The title should accurately reflect the main goal or action of the task, using simple and professional language.
It should be concise (ideally under 10 words) and meaningful to both technical and non-technical team members.
Follow these guidelines:
-Focus on the core objective or deliverable of the task
-Avoid vague words like “stuff,” “things,” or “update” unless contextually necessary
-Use verbs when appropriate (e.g., “Fix login bug” or “Design homepage layout”)
-Do not copy long phrases directly from the description
-Ensure the title stands alone without needing extra explanation
Return only the title. Do not include explanations.
**Do not add any markdown into your response such as asterisk!. Return plain text only!**`;

const CreateSummaryPrompt = `
You are a smart assistant tasked with generating a concise, well-structured **daily report summary** in **Markdown format** based on a user's task and notification data.

The goal is to summarize the user's upcoming and reviewable tasks, and new notifications, in an **official**, clear, and readable format suitable for daily consumption.
Keep it short but include **all** key points.

---
## Requirements for the Summary:

1. **Output format must be Markdown**. You may use:
   - Headings (##, ###)
   - Bullet points or numbered lists
   - Bold (**text**) and italics (_text_) for emphasis
   - Tables (if relevant)
   - Emojis (e.g., ⚠️) to highlight important or urgent tasks (optional but helpful)

2. Use a formal, concise writing style — similar to internal company updates or product release notes.

3. Structure the report with the following sections:
   - ## Tasks Due Today
   - ## Tasks Due Tomorrow
   - ## Tasks Due This Week
   - ## Tasks for Review
   - ## New Notifications

4. If a section has no items, explicitly state that (e.g., "_No tasks due today_").

5. For each task, include relevant context:
   - Task title and description
   - Priority level ("high", "middle", or "low")
   - Deadline (in readable format)
   - Assigned by or assigned to (depending on context)
   - Project name (from which it originated)

6. Use short, readable summaries. Avoid repeating raw data unless necessary.

7. Don't include any AI commentary or assumptions — base everything strictly on the input.

---
Below is the input data in JSON format:
`;

class aiService {
  public async Enhance(text: string) {
    if (text.length < 100) {
      throw new Error('Not enough content provided');
    }
    const result = await openai.chat.completions.create({
      model: 'anthropic/claude-sonnet-4',
      messages: [
        { role: 'system', content: enhanceDescriptionPrompt },
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
    const args = result.choices[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) {

        throw new AppError('AI tool did not return expected result');
    }

    const parsed = JSON.parse(args);

    return parsed.enhancedText;
  }

  public async CreateTitle (description: string) {

    if (description.length < 20) {

      throw new Error('Not enough content provided');

    }

    const result = await openai.chat.completions.create({
      model: 'anthropic/claude-sonnet-4',
      messages: [
        { role: 'system', content: createTitlePrompt },
        { role: 'user', content: description },
      ],
      temperature: 0.7,
      tools: [
        {
          type: 'function',
          function: createTitleFunction,
        },
      ],
      tool_choice: {
        type: 'function',
        function: { name: 'generate_task_title' },
      },
    });

    const args = result.choices[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!args) {

        throw new AppError('AI tool did not return expected result');

    }

    const parsed = JSON.parse(args);

    return parsed.title;
  }


  public async CreateSummary(report: DailyReport ){

    const result = await openai.chat.completions.create({
    model: 'anthropic/claude-sonnet-4',
    messages: [
        { 
            role: 'system', 
            content: CreateSummaryPrompt + '\n```json\n' + JSON.stringify(report,null, 2) + '\n```'
        },
        { role: 'user', content: 'Generate a daily summary report.' },
    ],
    temperature: 0.7,
    tools: [
        {
        type: 'function',
        function: createSummaryFunction,
        },
    ],
    tool_choice: {
        type: 'function',
        function: { name: 'generate_summary' },
    },
    });
    const args = result.choices[0]?.message?.tool_calls?.[0]?.function?.arguments;

    if (!args) {

        throw new AppError('AI tool did not return expected result');
    }

    const parsed = JSON.parse(args);

    return parsed.summary;
        
    }
}

export default new aiService();
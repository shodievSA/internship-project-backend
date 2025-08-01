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
You are an expert assistant designed to generate a concise, well-structured **task and notification summary report** in **Markdown format**, based on the user's input data.

Your goal is to help the user quickly understand their workload for **today**, **tomorrow**, and **the upcoming 7 days**. Your summary should include a **brief roadmap**, identify the most important tasks, and assess workload distribution by priority.

---

## Summary Requirements:

### General Guidelines:
1. **Output format must be Markdown**, using:
   - Headings (##, ###)
   - Bullet points (-) or numbered lists
   - Bold (**text**) and italics (_text_) for emphasis
   - Emojis to highlight urgency or importance (e.g., ⚠️ for high-priority, 🕒 for due soon)

2. **Writing style**:
   - Clear, formal, and concise — similar to internal company reports or product release notes.
   - Avoid AI commentary or speculation — base everything strictly on provided input data.

3. If a section has no items, state it clearly (e.g., "_No tasks scheduled for today._")

---

## Content Sections:

You must generate the following **three sections** in each summary:

### 1. **Today’s Overview**
- Count of total tasks
- Number of high / medium / low priority tasks
- Quick status sentence: e.g., "_Light workload today_" or "_Heavy day ahead with several high-priority tasks._"
- Top 3 tasks to focus on, if available (based on priority and deadline)

### 2.  **Tomorrow’s Outlook**
- Short preview of tomorrow’s tasks
- Mention any tasks that require prep today
- Highlight any upcoming deadlines or meetings

### 3. **Weekly Roadmap (Next 7 Days)**
- Task trends: increasing workload, balanced, or light
- Breakdown of tasks by priority level (e.g., “3 high, 7 medium, 5 low”)
- Key upcoming deadlines or milestones
- Mention if there are any days with expected high workload

---

## Task Details Format (when listing tasks):

For each task, include:
- **Title**: Task name
- **Project**: Originating project
- **Deadline**: Human-readable format (e.g., “Due Friday, Aug 2”)
- **Priority**: One of "high", "medium", "low"
- **Assigned by/to**: (depending on context)
- **Brief Description**: Optional but useful

---

## Input Format:

You will receive input data in **JSON** format containing:
- Task list (with metadata: title, deadline, priority, description, project, assignment info)
- Notifications (if any)
- Other optional calendar or planning data

Do not hallucinate. Generate summaries only from available information. Ensure summaries are short, informative, and prioritized for decision-making.


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
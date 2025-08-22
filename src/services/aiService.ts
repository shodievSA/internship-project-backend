import { openai } from '@/clients/openai';
import { AppError } from '@/types';
import { DailyReport } from '@/types/dailyReport'; 

const enhanceTextFunction = {
	name: 'enhanceText',
	description: 'Improve clarity, readability, and structure of a piece of text while retaining its intent.',
	parameters: {
		type: 'object',
		properties: {
			enhancedText: {
				type: 'string',
				description: 'The improved version of the input text. Should be clear, concise, well-structured, and retaining its main intent.',
			},
		},
		required: ['enhancedText'],
	},
};

const generateTaskTitleFunction = {
	name: 'generateTaskTitle',
	description: 'Generates a concise and meaningful title based on the provided task description.',
	parameters: {
		type: 'object',
		properties: {
			title: {
				type: 'string',
				description: 'The generated task title.',
			},
		},
		required: ['title'],
	},
};

const generateWorkPlanSummaryFunction = {
	name: 'generateWorkPlanSummary',
	description: 'Generates a concise and meaningful summary based on the provided task description.',
	parameters: {
		type: 'object',
		properties: {
			summary: {
				type: 'string',
				description: 'The generated summary.',
			},
		},
		required: ['summary'],
	},
};

const sysPromptForTextEnhacement = `You are a professional technical writer and task clarity expert.
Your job is to rewrite the following text to make it:
-Easy to understand for anyone, even WITHOUT a technical background
-Clear, concise, and well-structured
-free of jargon, vague phrases, and ambiguous language.
Improve the clarity, readability, and structure of the text while retaining its original intent and instructions.
Keep the text short, but make sure it remains meaningful and complete.
Preserve all original intent and instructions, but express them in a more accessible and polished way.
Return only the improved version. Do not include explanations.
**Do not add any markdown into your response such as asterisk!. Return plain text only!**`;

const sysPromptForTaskTitleGeneration = `You are a professional technical writer and task clarity expert.
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

const sysPromptForWorkPlanSummaryGeneration = `
You are a smart assistant that helps users of a project management system by giving them a general
overview of what they need to work on. Your job is to generate a brief report highlighting the user's 
upcoming tasks and recent notifications which they might have missed. The data, represented as JSON, will 
include the following: tasks due today, tasks due tomorrow, tasks due later this week and recent notifications.
Keep in mind that your report shouldn't contain any markdown, headings, titles or subtitles and should
immediately focus on the user's work plan. Finally, keep your tone friendly and informal.
`;

class AiService {

	async enhanceText(text: string) {

		try {
	
			const result = await openai.chat.completions.create({
				model: 'anthropic/claude-sonnet-4',
				messages: [
					{ role: 'system', content: sysPromptForTextEnhacement },
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
	
			if (!args) throw new AppError("AI service did not return expected result", 502, true);
	
			const parsed = JSON.parse(args);
	
			return parsed.enhancedText;

		} catch (err) {

			throw err;

		}

	}

	async generateTaskTitle(taskDescription: string) {

		try {

			const result = await openai.chat.completions.create({
				model: 'anthropic/claude-sonnet-4',
				messages: [
					{ role: 'system', content: sysPromptForTaskTitleGeneration },
					{ role: 'user', content: taskDescription },
				],
				temperature: 0.7,
				tools: [
					{
						type: 'function',
						function: generateTaskTitleFunction,
					},
				],
				tool_choice: {
					type: 'function',
					function: { name: 'generateTaskTitle' },
				},
			});

			const args = result.choices[0]?.message?.tool_calls?.[0]?.function?.arguments;

			if (!args) throw new AppError("AI service did not return expected result", 502, true);

			const parsed = JSON.parse(args);

			return parsed.title;

		} catch (err) {

			throw err;

		}

	}

	async generateWorkPlanSummary(report: DailyReport) {

		try {

			const result = await openai.chat.completions.create({
				model: 'anthropic/claude-sonnet-4',
				messages: [
					{ role: 'system', content: sysPromptForWorkPlanSummaryGeneration },
					{ role: 'user', content: 'Generate a summary report based on the following data:' + '\n\n```json\n' + JSON.stringify(report, null, 2) + '\n```' }
				],
				temperature: 0.7,
				tools: [
					{ type: 'function', function: generateWorkPlanSummaryFunction },
				],
				tool_choice: {
					type: 'function',
					function: { name: 'generateWorkPlanSummary' },
				}
			});

			const args = result.choices[0]?.message?.tool_calls?.[0]?.function?.arguments;

			if (!args) throw new AppError("AI service did not return expected result", 502, true);

			const parsed = JSON.parse(args);

			return parsed.summary;

		} catch (err) {

			throw err;

		}
			
	}

}

export default new AiService();

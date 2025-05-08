// src/ai/flows/chat-with-instructions-flow.ts
'use server';
/**
 * @fileOverview Provides a chat interface for users to ask follow-up questions 
 * about chemical synthesis instructions.
 *
 * - chatWithInstructions - A function that handles the chat interaction.
 * - ChatWithInstructionsInput - The input type for the chatWithInstructions function.
 * - ChatWithInstructionsOutput - The return type for the chatWithInstructions function.
 * - ChatHistoryEntry - The type for chat history entries.
 */

import { ai } from '@/ai/genkit';
import type { MessagePart } from 'genkit';
import { z } from 'genkit'; // For z.infer and schema usage with Genkit
import { 
  ChatHistoryEntrySchema,
  ChatWithInstructionsInputSchema,
  ChatWithInstructionsOutputSchema
} from '@/ai/schemas';

export type ChatHistoryEntry = z.infer<typeof ChatHistoryEntrySchema>;
export type ChatWithInstructionsInput = z.infer<typeof ChatWithInstructionsInputSchema>;
export type ChatWithInstructionsOutput = z.infer<typeof ChatWithInstructionsOutputSchema>;


export async function chatWithInstructions(input: ChatWithInstructionsInput): Promise<ChatWithInstructionsOutput> {
  return chatWithInstructionsFlow(input);
}

const chatWithInstructionsFlow = ai.defineFlow(
  {
    name: 'chatWithInstructionsFlow',
    inputSchema: ChatWithInstructionsInputSchema,
    outputSchema: ChatWithInstructionsOutputSchema,
  },
  async (input) => {
    let systemMessageContent = `You are ChemHelper, an AI assistant specialized in chemical synthesis procedures.
You are assisting a chemist who is following a set of AI-generated instructions.
The original instructions provided by the user were:
"${input.originalInstructions}"

The AI-generated breakdown for this synthesis is as follows:
Detailed Steps:
${input.synthesisContext.detailedSteps.map((step, index) => `${index + 1}. ${step}`).join('\n')}

Recommended Glassware: ${input.synthesisContext.recommendedGlassware.join(', ') || 'None specified'}
Recommended Materials: ${input.synthesisContext.recommendedMaterials.join(', ') || 'None specified'}
Safety Warnings: ${input.synthesisContext.safetyWarnings.join(', ') || 'None specified'}
`;

    if (input.currentStepNumber && input.synthesisContext.detailedSteps[input.currentStepNumber - 1]) {
      systemMessageContent += `\nThe user is likely asking about or is currently on step ${input.currentStepNumber}: "${input.synthesisContext.detailedSteps[input.currentStepNumber - 1]}".`;
    }

systemMessageContent += `

Your role is to answer the user's questions clearly and **very concisely**. Provide **only the most important** details, clarifications, or explanations related to the synthesis. Use the provided context. If the question is outside the scope of this specific synthesis, politely state that you can only assist with the given procedure. Be helpful and informative. **Keep your answers short and to the point.**`;

    const messages: MessagePart[] = [];

    if (input.chatHistory) {
      // Filter out any 'system' roles from chatHistory if they exist, as we're providing a new one.
      messages.push(...input.chatHistory.filter(m => m.role !== 'system') as MessagePart[]);
    }
    
    const response = await ai.generate({
        // Model will now use the default configured in src/ai/genkit.ts
        system: systemMessageContent, 
        history: messages, 
        prompt: input.userQuery, 
        output: {
            format: 'text',
        },
    });

    const aiResponseText = response.text;
    if (aiResponseText === undefined || aiResponseText === null) {
      throw new Error("AI did not return a text response.");
    }

    return { aiResponse: aiResponseText };
  }
);


// src/app/chat-actions.ts
'use server';

import { 
    chatWithInstructions, 
    type ChatWithInstructionsInput, 
    type ChatWithInstructionsOutput,
    type ChatHistoryEntry
} from '@/ai/flows/chat-with-instructions-flow';
import { 
  ChatHistoryEntrySchema, 
  SynthesizeInstructionsOutputSchema 
} from '@/ai/schemas'; // Import schemas from the new central location

import { z } from 'zod'; // Use standard Zod for validation logic in actions

const ChatSubmissionSchema = z.object({
    originalInstructions: z.string().min(1, "Original instructions are required."),
    synthesisContext: SynthesizeInstructionsOutputSchema.describe("The AI-generated breakdown of the synthesis."),
    currentStepNumber: z.number().optional(),
    chatHistory: z.array(ChatHistoryEntrySchema).optional(),
    userQuery: z.string().min(1, "Query cannot be empty.").max(1000, "Query is too long."),
});

export interface ChatState {
  aiResponse?: string;
  updatedHistory?: ChatHistoryEntry[];
  error?: string;
  fieldErrors?: {
    userQuery?: string[];
    // other fields if necessary for chat context validation
  };
}

export async function handleChatSubmission(
  prevState: ChatState | undefined,
  formData: FormData
): Promise<ChatState> {
    const originalInstructions = formData.get('originalInstructions') as string;
    const synthesisContextString = formData.get('synthesisContext') as string;
    const currentStepNumberString = formData.get('currentStepNumber') as string | null;
    const chatHistoryString = formData.get('chatHistory') as string | null;
    const userQuery = formData.get('userQuery') as string;

    let synthesisContext;
    try {
        synthesisContext = JSON.parse(synthesisContextString);
    } catch (e) {
        return { error: "Invalid synthesis context provided." };
    }
    
    let chatHistory: ChatHistoryEntry[] | undefined;
    if (chatHistoryString) {
        try {
            chatHistory = JSON.parse(chatHistoryString);
        } catch (e) {
            return { error: "Invalid chat history provided." };
        }
    }

    const currentStepNumber = currentStepNumberString ? parseInt(currentStepNumberString, 10) : undefined;
    if (currentStepNumberString && currentStepNumber !== undefined && isNaN(currentStepNumber)) { // ensure currentStepNumber is not undefined before isNaN
        return { error: "Invalid current step number." };
    }
    
    const validatedFields = ChatSubmissionSchema.safeParse({
        originalInstructions,
        synthesisContext,
        currentStepNumber,
        chatHistory,
        userQuery,
    });

    if (!validatedFields.success) {
        console.error("Chat validation errors:", validatedFields.error.flatten().fieldErrors);
        return {
            error: "Invalid chat input.",
            fieldErrors: validatedFields.error.flatten().fieldErrors,
        };
    }

    try {
        const input: ChatWithInstructionsInput = validatedFields.data;
        const result: ChatWithInstructionsOutput = await chatWithInstructions(input);

        const newHistoryEntryUser: ChatHistoryEntry = { role: 'user', parts: [{ text: validatedFields.data.userQuery }] };
        const newHistoryEntryModel: ChatHistoryEntry = { role: 'model', parts: [{ text: result.aiResponse }] };
        
        const updatedHistory = [...(validatedFields.data.chatHistory || []), newHistoryEntryUser, newHistoryEntryModel];

        return { 
            aiResponse: result.aiResponse,
            updatedHistory: updatedHistory,
        };

    } catch (e) {
        console.error("Error in handleChatSubmission:", e);
        const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
        return { 
            error: `Chat failed: ${errorMessage}. Please try again.`,
        };
    }
}

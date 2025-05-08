// src/app/tts-actions.ts
'use server';

import { textToSpeech } from '@/services/elevenlabs';
import { z } from 'zod';

const GenerateSpeechSchema = z.object({
  text: z.string().min(1, "Text cannot be empty.").max(1000, "Text is too long for speech generation."),
});

export interface GenerateSpeechState {
  audioBase64?: string;
  error?: string;
}

export async function generateSpeechAction(
  prevState: GenerateSpeechState | undefined, // Not strictly used here as we return directly
  formData: FormData
): Promise<GenerateSpeechState> {
  const text = formData.get('text') as string;

  const validatedFields = GenerateSpeechSchema.safeParse({
    text: text,
  });

  if (!validatedFields.success) {
    return {
      error: "Invalid input for speech generation.",
    };
  }

  try {
    const audioBase64 = await textToSpeech(validatedFields.data.text);
    return { audioBase64 };
  } catch (e) {
    console.error("Error in generateSpeechAction:", e);
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred during speech generation.";
    return {
      error: errorMessage,
    };
  }
}

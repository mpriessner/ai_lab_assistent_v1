// src/app/transcribe-actions.ts
'use server';

import { transcribeAudio } from '@/services/openai';
import { z } from 'zod';

const TranscribeAudioSchema = z.object({
  audioBase64: z.string().min(1, "Audio data cannot be empty."),
});

export interface TranscribeAudioState {
  transcribedText?: string;
  error?: string;
  // To help UI reset or manage form state for new transcriptions if needed
  timestamp?: number; 
}

export async function handleTranscribeAudioAction(
  prevState: TranscribeAudioState | undefined,
  formData: FormData
): Promise<TranscribeAudioState> {
  const audioBase64 = formData.get('audioBase64') as string;

  const validatedFields = TranscribeAudioSchema.safeParse({
    audioBase64,
  });

  if (!validatedFields.success) {
    return {
      error: "Invalid audio data provided for transcription.",
      timestamp: Date.now(),
    };
  }

  try {
    const transcribedText = await transcribeAudio(validatedFields.data.audioBase64);
    return { 
        transcribedText,
        timestamp: Date.now(),
    };
  } catch (e) {
    console.error("Error in handleTranscribeAudioAction:", e);
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred during audio transcription.";
    return {
      error: errorMessage,
      timestamp: Date.now(),
    };
  }
}

// src/app/page.tsx
'use client';

import { useState, useTransition, useEffect, useRef, FormEvent, useActionState } from 'react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ChevronLeft, ChevronRight, AlertCircle, Loader2, Wand2, MessageSquare, Send, Microscope, ShieldAlert, FlaskConical, ListChecks, Volume2, Mic, StopCircle } from 'lucide-react';
import { handleBreakdownInstructions, type BreakdownState } from './actions';
import { handleChatSubmission, type ChatState } from './chat-actions';
import { generateSpeechAction, type GenerateSpeechState } from './tts-actions';
import { handleTranscribeAudioAction, type TranscribeAudioState } from './transcribe-actions'; // Import Transcribe action
import type { ChatHistoryEntry } from '@/ai/flows/chat-with-instructions-flow';
import { useToast } from "@/hooks/use-toast";
import type { SynthesizeInstructionsOutput } from '@/ai/flows/synthesize-instructions';

const initialBreakdownState: BreakdownState = {
  detailedSteps: undefined,
  recommendedGlassware: undefined,
  recommendedMaterials: undefined,
  safetyWarnings: undefined,
  error: undefined,
  fieldErrors: undefined,
  input: '',
};

const initialChatState: ChatState = {
    aiResponse: undefined,
    updatedHistory: [],
    error: undefined,
};

const initialTtsState: GenerateSpeechState = {
    audioBase64: undefined,
    error: undefined,
};

const initialTranscribeState: TranscribeAudioState = {
    transcribedText: undefined,
    error: undefined,
};

export default function ChemFlowPage() {
  const [breakdownFormState, breakdownFormAction] = useActionState(handleBreakdownInstructions, initialBreakdownState);
  const [chatFormState, chatFormAction] = useActionState(handleChatSubmission, initialChatState);
  const [transcribeFormState, transcribeFormAction] = useActionState(handleTranscribeAudioAction, initialTranscribeState);
  
  const [currentProcedureData, setCurrentProcedureData] = useState<BreakdownState>(initialBreakdownState);
  const [isClient, setIsClient] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isBreakdownProcessing, startBreakdownTransition] = useTransition();
  const [isChatProcessing, startChatTransition] = useTransition();
  const [isTranscribing, startTranscribeTransition] = useTransition();
  const { toast } = useToast();
  const instructionsTextAreaRef = useRef<HTMLTextAreaElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);

  // TTS State
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [isTtsLoading, setIsTtsLoading] = useState(false);
  const [lastSpokenText, setLastSpokenText] = useState<string | null>(null);

  // Transcription State
  const [isRecording, setIsRecording] = useState(false);
  const [hasMicPermission, setHasMicPermission] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    setIsClient(true);
  }, []);


  useEffect(() => {
    if (breakdownFormState?.detailedSteps) {
      setCurrentProcedureData({
        detailedSteps: breakdownFormState.detailedSteps,
        recommendedGlassware: breakdownFormState.recommendedGlassware,
        recommendedMaterials: breakdownFormState.recommendedMaterials,
        safetyWarnings: breakdownFormState.safetyWarnings,
        input: breakdownFormState.input, 
      });
      setCurrentStepIndex(0);
      setChatFormStateInternal(initialChatState); 
      setAudioBase64(null); 
      setLastSpokenText(null);
      if (breakdownFormState.detailedSteps.length === 0 && breakdownFormState.input) {
        toast({
            variant: "default",
            title: "Processing Complete",
            description: "The instructions provided did not result in distinct steps. Try rephrasing or adding more detail.",
        });
      }
    }
    if (breakdownFormState?.error && !breakdownFormState.fieldErrors) { 
        toast({
            variant: "destructive",
            title: "Error Processing Instructions",
            description: breakdownFormState.error,
        });
    }
    if (breakdownFormState?.input && instructionsTextAreaRef.current) {
      if(breakdownFormState.fieldErrors?.instructions || (breakdownFormState.error && !breakdownFormState.detailedSteps)) {
        instructionsTextAreaRef.current.value = breakdownFormState.input;
      }
    }
  }, [breakdownFormState, toast]);

  const [chatFormStateInternal, setChatFormStateInternal] = useState<ChatState>(initialChatState);
   useEffect(() => {
    setChatFormStateInternal(chatFormState); 
    if (chatFormState?.aiResponse) {
      if(isClient) {
        if (chatInputRef.current) {
          chatInputRef.current.value = ''; 
        }
        const currentResponseText = chatFormState.aiResponse;
        setLastSpokenText(currentResponseText); 
        setIsTtsLoading(true);
        const ttsFormData = new FormData();
        ttsFormData.append('text', currentResponseText);
        
        generateSpeechAction(undefined, ttsFormData).then(ttsResult => {
          setIsTtsLoading(false);
          if (ttsResult.audioBase64) {
            setAudioBase64(ttsResult.audioBase64);
          } else if (ttsResult.error) {
            toast({ title: "Speech Generation Error", description: ttsResult.error, variant: "destructive" });
          }
        }).catch(error => {
          setIsTtsLoading(false);
          const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during speech generation.";
          toast({ title: "Speech Generation Failed", description: errorMessage, variant: "destructive" });
        });
      }
    }
    if (chatFormState?.error) {
        toast({
            variant: "destructive",
            title: "Chat Error",
            description: chatFormState.error,
        });
    }
  }, [chatFormState, toast, isClient]);

  useEffect(() => {
    if (isClient) {
      if (audioBase64) {
        const audio = new Audio(`data:audio/mpeg;base64,${audioBase64}`);
        audio.play().catch(error => {
          console.error("Error playing audio:", error);
          toast({ title: "Audio Playback Error", description: "Could not play audio automatically.", variant: "destructive"});
        });
      }
    }
  }, [audioBase64, toast, isClient]);

  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatFormStateInternal?.updatedHistory]);

  // Microphone Permission
  useEffect(() => {
    const getMicPermission = async () => {      
        try {
          await navigator.mediaDevices.getUserMedia({ audio: true });
          setHasMicPermission(true);
        } catch (error) {
          console.error('Error accessing microphone:', error);
          setHasMicPermission(false);
          toast({
            variant: 'destructive',
            title: 'Microphone Access Denied',
            description: 'Please enable microphone permissions in your browser settings to use voice input.',
          });
        }
    };
    if (isClient) { // Only run on client
        getMicPermission();
    }
  }, [toast, isClient]);

  // Handle Transcription Result
  useEffect(() => {
    if (transcribeFormState?.transcribedText && chatInputRef.current) {
      chatInputRef.current.value = transcribeFormState.transcribedText;
    }
    if (transcribeFormState?.error) {
      toast({
        variant: "destructive",
        title: "Transcription Error",
        description: transcribeFormState.error,
      });
    }
  }, [transcribeFormState, toast]);


  const handleReplayAudio = async () => {
    if (isClient) {
      if (lastSpokenText && !isTtsLoading) {
        setIsTtsLoading(true);
        setAudioBase64(null); 
        const ttsFormData = new FormData();
        ttsFormData.append('text', lastSpokenText);
        try {
          const ttsResult = await generateSpeechAction(undefined, ttsFormData);
          if (ttsResult.audioBase64) {
            setAudioBase64(ttsResult.audioBase64);
          } else if (ttsResult.error) {
            toast({ title: "Speech Replay Error", description: ttsResult.error, variant: "destructive" });
          }
        } catch (error: any) {
          toast({ title: "Speech Replay Failed", description: error.message, variant: "destructive" });
        } finally {
          setIsTtsLoading(false);
        }
      }
    }
  };

  const handleStartRecording = async () => {
    if (isClient) {
      if (!hasMicPermission) {
        toast({ variant: 'destructive', title: 'Microphone Permission Required', description: 'Please enable microphone access in your browser settings.' });
        return;
      }
      if (isRecording || isTranscribing) return;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        audioChunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorderRef.current.onstop = handleStopMediaRecorder(stream); // Pass stream here

        mediaRecorderRef.current.start();
        setIsRecording(true);
      } catch (error) {
        console.error('Error starting recording:', error);
        toast({ variant: 'destructive', title: 'Recording Error', description: 'Could not start audio recording.' });
        setIsRecording(false); 
      }
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };
  
  const handleStopMediaRecorder = (stream: MediaStream) => {
    return () => { // This is the 'onstop' handler
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const reader = new FileReader();

      reader.onloadend = () => {
        const base64Audio = (reader.result as string).split(',')[1];
        const formData = new FormData();
        formData.append('audioBase64', base64Audio);
        
        startTranscribeTransition(() => {
            transcribeFormAction(formData);
        });
      };
      reader.readAsDataURL(audioBlob);

      // Stop media tracks after processing
      stream.getTracks().forEach(track => track.stop());
      audioChunksRef.current = []; // Clear chunks for next recording
    };
  };


  const handleNextStep = () => {
    if (currentProcedureData.detailedSteps && currentStepIndex < currentProcedureData.detailedSteps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handlePreviousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleBreakdownSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setCurrentProcedureData(initialBreakdownState); 
    setCurrentStepIndex(0);
    setChatFormStateInternal(initialChatState); 
    setAudioBase64(null);
    setLastSpokenText(null);
    startBreakdownTransition(() => {
      breakdownFormAction(formData);
    });
  };

  const handleChatSubmitInternal = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentProcedureData.input || !currentProcedureData.detailedSteps) {
        toast({ title: "Cannot Chat", description: "Please process instructions first.", variant: "destructive" });
        return;
    }
    const formData = new FormData(event.currentTarget);
    formData.append('originalInstructions', currentProcedureData.input);
    
    const synthesisContextForChat: SynthesizeInstructionsOutput = { 
      detailedSteps: currentProcedureData.detailedSteps || [],
      recommendedGlassware: currentProcedureData.recommendedGlassware || [],
      recommendedMaterials: currentProcedureData.recommendedMaterials || [],
      safetyWarnings: currentProcedureData.safetyWarnings || [],
    };
    formData.append('synthesisContext', JSON.stringify(synthesisContextForChat));

    if (currentProcedureData.detailedSteps.length > 0) {
        formData.append('currentStepNumber', (currentStepIndex + 1).toString());
    }
    formData.append('chatHistory', JSON.stringify(chatFormStateInternal.updatedHistory || []));
    
    setAudioBase64(null); 

    startChatTransition(() => {
      chatFormAction(formData);
    });
  };

  const currentStepText = currentProcedureData.detailedSteps && currentProcedureData.detailedSteps.length > 0 
    ? currentProcedureData.detailedSteps[currentStepIndex] 
    : "Your processed steps will appear here.";

  return (
    <main className="min-h-screen bg-background text-foreground p-4 md:p-8 flex flex-col items-center">
      <header className="mb-8 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-primary flex items-center justify-center">
          <Wand2 className="mr-3 h-10 w-10 sm:h-12 sm:w-12" />
          ChemFlow AI
        </h1>
        <p className="text-muted-foreground mt-2 text-md sm:text-lg max-w-2xl">
          Enhanced chemical synthesis guidance: detailed steps, material lists, safety alerts, and interactive voiced chat.
        </p>
      </header>

      {!hasMicPermission && isClient && ( // Only show if client and permission not granted
         <Alert variant="destructive" className="mb-4 max-w-2xl mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Microphone Access Recommended</AlertTitle>
            <AlertDescription>
              This app uses your microphone for voice input. Please grant permission if prompted. If denied, voice input will not be available.
            </AlertDescription>
          </Alert>
      )}


      <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <Card className="shadow-xl rounded-lg overflow-hidden lg:col-span-1">
          <CardHeader className="bg-card">
            <CardTitle className="text-xl sm:text-2xl text-primary flex items-center">
              <Wand2 className="mr-2 h-6 w-6" /> Synthesis Input
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Enter instructions for AI breakdown.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleBreakdownSubmit}>
            <CardContent className="space-y-4 p-6">
              <div>
                <Label htmlFor="instructions" className="text-base font-semibold">Instructions</Label>
                <Textarea
                  ref={instructionsTextAreaRef}
                  id="instructions"
                  name="instructions"
                  placeholder="e.g., To synthesize Aspirin, mix Salicylic acid with Acetic anhydride..."
                  rows={10}
                  className="mt-1 text-base border-input focus:ring-primary focus:border-primary shadow-sm"
                  required
                  defaultValue={initialBreakdownState.input}
                />
                 {breakdownFormState?.fieldErrors?.instructions && (
                  <p className="text-sm text-destructive mt-2" role="alert">
                    <AlertCircle className="inline mr-1 h-4 w-4" />
                    {breakdownFormState.fieldErrors.instructions.join(', ')}
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter className="bg-muted/50 p-6">
              <Button type="submit" className="w-full text-lg py-3" disabled={isBreakdownProcessing}>
                {isBreakdownProcessing ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Wand2 className="mr-2 h-5 w-5" />
                )}
                Break Down Instructions
              </Button>
            </CardFooter>
          </form>
        </Card>

        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <Card className="shadow-xl rounded-lg flex flex-col overflow-hidden">
            <CardHeader className="bg-card">
                <CardTitle className="text-xl sm:text-2xl text-primary flex items-center">
                    <ListChecks className="mr-2 h-6 w-6" />
                    Procedure Details
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">
                {currentProcedureData.detailedSteps && currentProcedureData.detailedSteps.length > 0 
                    ? `Follow the steps below. Use chat for more info.`
                    : `Your processed procedure will appear here.`}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col p-6 bg-accent/5 space-y-4 min-h-[300px]">
                {isBreakdownProcessing && (
                <div className="text-center text-muted-foreground p-4 flex-grow flex flex-col justify-center items-center">
                    <Loader2 className="mx-auto h-10 w-10 sm:h-12 sm:w-12 animate-spin text-primary mb-4" />
                    <p className="text-lg font-semibold">Processing your instructions...</p>
                    <p className="text-sm">This may take a few moments.</p>
                </div>
                )}
                {!isBreakdownProcessing && (!currentProcedureData.detailedSteps || currentProcedureData.detailedSteps.length === 0) && (
                <div className="text-center text-muted-foreground p-4 flex-grow flex flex-col justify-center items-center">
                    <svg data-ai-hint="chemistry lab" xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-gray-300 mb-4"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M12 18v-4"></path><path d="M9 18H7.5a1.5 1.5 0 0 1 0-3H9"></path><path d="M15 18h1.5a1.5 0 0 0 0-3H15l1-1h.5a1.5 1.5 0 0 0 0-3H17"></path><path d="M12 14h.01"></path><path d="M12 10h.01"></path><path d="M10 10h.01"></path><path d="M14 10h.01"></path></svg>
                    <p className="text-xl font-semibold">Waiting for instructions</p>
                    <p className="text-sm max-w-xs mx-auto">Enter procedure on the left and click "Break Down" to begin.</p>
                </div>
                )}
                {currentProcedureData.detailedSteps && currentProcedureData.detailedSteps.length > 0 && !isBreakdownProcessing && (
                <div className="w-full space-y-4">
                    <div>
                        <p className="text-sm text-muted-foreground mb-1 font-medium">
                        Current Step: {currentStepIndex + 1} of {currentProcedureData.detailedSteps.length}
                        </p>
                        <div 
                        className="bg-accent/20 p-4 sm:p-6 rounded-lg shadow-inner text-accent-foreground min-h-[100px] flex items-center justify-center animation-fadeIn"
                        key={`step-${currentStepIndex}`} 
                        >
                        <p className="text-base sm:text-lg">{currentStepText}</p>
                        </div>
                    </div>

                    <Accordion type="multiple" className="w-full">
                        {currentProcedureData.recommendedGlassware && currentProcedureData.recommendedGlassware.length > 0 && (
                        <AccordionItem value="glassware">
                            <AccordionTrigger className="text-base font-semibold"><FlaskConical className="mr-2 h-5 w-5 text-primary/80" />Recommended Glassware</AccordionTrigger>
                            <AccordionContent>
                            <ul className="list-disc list-inside pl-2 space-y-1 text-sm">
                                {currentProcedureData.recommendedGlassware.map((item, idx) => <li key={`glass-${idx}`}>{item}</li>)}
                            </ul>
                            </AccordionContent>
                        </AccordionItem>
                        )}
                        {currentProcedureData.recommendedMaterials && currentProcedureData.recommendedMaterials.length > 0 && (
                        <AccordionItem value="materials">
                            <AccordionTrigger className="text-base font-semibold"><Microscope className="mr-2 h-5 w-5 text-primary/80" />Recommended Materials</AccordionTrigger>
                            <AccordionContent>
                            <ul className="list-disc list-inside pl-2 space-y-1 text-sm">
                                {currentProcedureData.recommendedMaterials.map((item, idx) => <li key={`mat-${idx}`}>{item}</li>)}
                            </ul>
                            </AccordionContent>
                        </AccordionItem>
                        )}
                        {currentProcedureData.safetyWarnings && currentProcedureData.safetyWarnings.length > 0 && (
                        <AccordionItem value="safety">
                            <AccordionTrigger className="text-base font-semibold"><ShieldAlert className="mr-2 h-5 w-5 text-destructive" />Safety Warnings</AccordionTrigger>
                            <AccordionContent>
                            <ul className="list-disc list-inside pl-2 space-y-1 text-sm text-destructive/90">
                                {currentProcedureData.safetyWarnings.map((item, idx) => <li key={`safety-${idx}`}>{item}</li>)}
                            </ul>
                            </AccordionContent>
                        </AccordionItem>
                        )}
                    </Accordion>
                </div>
                )}
            </CardContent>
            <CardFooter className="bg-muted/50 p-6">
                {currentProcedureData.detailedSteps && currentProcedureData.detailedSteps.length > 0 && !isBreakdownProcessing && (
                <div className="flex justify-between w-full">
                    <Button
                    onClick={handlePreviousStep}
                    disabled={currentStepIndex === 0}
                    variant="outline"
                    className="text-base py-2.5"
                    >
                    <ChevronLeft className="mr-1 h-5 w-5" /> Previous
                    </Button>
                    <Button
                    onClick={handleNextStep}
                    disabled={currentStepIndex === currentProcedureData.detailedSteps.length - 1}
                    className="text-base py-2.5"
                    >
                    Next <ChevronRight className="ml-1 h-5 w-5" />
                    </Button>
                </div>
                )}
                {(!currentProcedureData.detailedSteps || currentProcedureData.detailedSteps.length === 0) && !isBreakdownProcessing && (
                <div className="text-center w-full text-muted-foreground">
                    <p className="text-sm">Use the panel on the left to get started.</p>
                </div>
                )}
            </CardFooter>
            </Card>

            <Card className="shadow-xl rounded-lg flex flex-col overflow-hidden">
                <CardHeader className="bg-card">
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-xl sm:text-2xl text-primary flex items-center">
                        <MessageSquare className="mr-2 h-6 w-6" /> AI Chat Assistant
                        </CardTitle>
                        {lastSpokenText && (
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={handleReplayAudio} 
                            disabled={isTtsLoading || isChatProcessing}
                            aria-label="Replay last audio"
                        >
                            {isTtsLoading && lastSpokenText ? <Loader2 className="h-5 w-5 animate-spin" /> : <Volume2 className="h-5 w-5" />}
                        </Button>
                        )}
                    </div>
                    <CardDescription className="text-sm sm:text-base">
                    Ask questions about the current procedure. Answers will be spoken. Use the mic for voice input.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex-grow p-0 flex flex-col">
                    <ScrollArea className="flex-grow h-[300px] p-4 space-y-3">
                        {(!chatFormStateInternal.updatedHistory || chatFormStateInternal.updatedHistory.length === 0) && !currentProcedureData.input && (
                            <div className="text-center text-muted-foreground p-4 flex-grow flex flex-col justify-center items-center h-full">
                                <MessageSquare size={48} className="text-gray-300 mb-3" />
                                <p className="font-semibold">Process instructions first</p>
                                <p className="text-xs">Then you can chat about them here.</p>
                            </div>
                        )}
                        {(!chatFormStateInternal.updatedHistory || chatFormStateInternal.updatedHistory.length === 0) && currentProcedureData.input && (
                            <div className="text-center text-muted-foreground p-4 flex-grow flex flex-col justify-center items-center h-full">
                                <MessageSquare size={48} className="text-gray-300 mb-3" />
                                <p className="font-semibold">Chat about the procedure</p>
                                <p className="text-xs">Ask for clarifications or more details.</p>
                            </div>
                        )}
                        {chatFormStateInternal.updatedHistory?.map((entry, index) => (
                            <div
                            key={`chat-${index}`}
                            className={`flex ${entry.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                            <div
                                className={`max-w-[80%] p-2.5 rounded-lg shadow ${
                                entry.role === 'user'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-accent text-accent-foreground'
                                }`}
                            >
                                <p className="text-sm whitespace-pre-wrap">{entry.parts.map(p => p.text).join('')}</p>
                            </div>
                            </div>
                        ))}
                        <div ref={chatMessagesEndRef} />
                    </ScrollArea>
                </CardContent>
                <CardFooter className="bg-muted/50 p-4">
                    <form onSubmit={handleChatSubmitInternal} className="w-full flex items-center gap-2">
                    <Input
                        ref={chatInputRef}
                        name="userQuery"
                        placeholder={currentProcedureData.input ? "Ask or use mic..." : "Process instructions first..."}
                        className="flex-grow text-sm"
                        autoComplete="off"
                        disabled={!currentProcedureData.input || isChatProcessing || isBreakdownProcessing || isTtsLoading || isRecording || isTranscribing}
                    />
                    <Button 
                        type="button" 
                        size="icon" 
                        variant={isRecording ? "destructive" : "outline"}
                        onClick={isRecording ? handleStopRecording : handleStartRecording}
                        disabled={!currentProcedureData.input || !hasMicPermission || isChatProcessing || isBreakdownProcessing || isTtsLoading || isTranscribing}
                        aria-label={isRecording ? "Stop recording" : "Start recording"}
                    >
                        {isTranscribing ? <Loader2 className="h-4 w-4 animate-spin" /> : (isRecording ? <StopCircle className="h-4 w-4" /> : <Mic className="h-4 w-4" />)}
                    </Button>
                    <Button type="submit" size="icon" disabled={!currentProcedureData.input || isChatProcessing || isBreakdownProcessing || isTtsLoading || isRecording || isTranscribing}>
                        {isChatProcessing || (isTtsLoading && !audioBase64 && lastSpokenText) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        <span className="sr-only">Send message</span>
                    </Button>
                    </form>
                </CardFooter>
                {chatFormStateInternal?.fieldErrors?.userQuery && (
                    <p className="text-xs text-destructive px-4 pb-2" role="alert">
                        {chatFormStateInternal.fieldErrors.userQuery.join(', ')}
                    </p>
                )}
            </Card>
        </div>
      </div>
    </main>
  );
}
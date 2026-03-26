import { GoogleGenerativeAI } from "@google/generative-ai";

export async function processTranscript(transcriptText: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable not set. Please set it in your .env file or environment.");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Base default for all agents
    const defaultModel = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    // Individual agent model configuration
    const diarizerModelName = process.env.GEMINI_MODEL_DIARIZER || defaultModel;
    const cleanerModelName = process.env.GEMINI_MODEL_CLEANER || defaultModel;
    const architectModelName = process.env.GEMINI_MODEL_ARCHITECT || defaultModel;
    const writerModelName = process.env.GEMINI_MODEL_WRITER || defaultModel;

    console.log(`--- AI Pipeline Configuration ---`);
    console.log(`Diarizer Model:  ${diarizerModelName}`);
    console.log(`Cleaner Model:   ${cleanerModelName}`);
    console.log(`Architect Model: ${architectModelName}`);
    console.log(`Writer Model:    ${writerModelName}`);
    console.log(`---------------------------------`);

    const diarizerModel = genAI.getGenerativeModel({ model: diarizerModelName });
    const cleanerModel = genAI.getGenerativeModel({ model: cleanerModelName });
    const architectModel = genAI.getGenerativeModel({ model: architectModelName });
    const writerModel = genAI.getGenerativeModel({ model: writerModelName });

    // Agent 1: The Diarizer
    console.log("-> Agent 1: The Diarizer is analyzing speakers and filtering...");
    const diarizerPrompt = `
You are 'The Diarizer', an Identity Expert.
I am providing you with a cleaned auto-generated plain text transcript from a YouTube technical presentation.
Your task is to analyze the context to label the speakers (e.g., Host, Host2, Speaker 1, Speaker 2, Audience).
Crucially: Remove any text spoken by the Host(s) and only return the text spoken by the Speaker(s) and Audience. Label who is speaking.

Here is the transcript:
---
${transcriptText}
---
    `;
    const diarizerResult = await diarizerModel.generateContent(diarizerPrompt);
    const diarizedText = diarizerResult.response.text();

    // Agent 2: The Cleaner
    console.log("-> Agent 2: The Cleaner is polishing the text...");
    const cleanerPrompt = `
You are 'The Cleaner', a Verbal Polisher.
I am providing you with a diarized transcript of a technical presentation.
Your task is to remove "um/uh," repetitive conversational phrases, and technical stutters while perfectly preserving the original meaning and technical accuracy.

Here is the diarized transcript:
---
${diarizedText}
---
    `;
    const cleanerResult = await cleanerModel.generateContent(cleanerPrompt);
    const cleanedText = cleanerResult.response.text();

    // Agent 3: The Architect
    console.log("-> Agent 3: The Architect is creating the outline...");
    const architectPrompt = `
You are 'The Architect', an Outline Creator.
I am providing you with a polished transcript of a technical presentation.
Your task is to extract the core technical points and organize them into a logical article structure or outline.

Here is the polished transcript:
---
${cleanedText}
---
    `;
    const architectResult = await architectModel.generateContent(architectPrompt);
    const outlineText = architectResult.response.text();

    // Agent 4: The Narrative Writer
    console.log("-> Agent 4: The Narrative Writer is drafting the final article...");
    const narrativePrompt = `
You are 'The Narrative Writer', the Final Author.
I am providing you with a polished technical transcript and a logical outline.
Your task is to synthesize all of this into a cohesive, professional Markdown blog post in a single voice. Use the outline for structure and the transcript for detailed content.

Polished Transcript:
---
${cleanedText}
---

Outline:
---
${outlineText}
---
    `;
    const narrativeResult = await writerModel.generateContent(narrativePrompt);
    return narrativeResult.response.text();
}

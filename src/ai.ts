import { GoogleGenerativeAI } from "@google/generative-ai";

export async function processTranscript(transcriptText: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable not set. Please set it in your .env file or environment.");
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // We will use gemini-2.5-flash as the stable fallback unless specified
    const defaultModel = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";

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

    const cleanJsonResponse = (text: string) => text.replaceAll(/```json/gi, '').replaceAll('```', '').trim();

    // Agent 1: The Diarizer
    console.log("-> Agent 1: The Diarizer is analyzing speakers and tagging...");
    const diarizerPrompt = `
You are 'The Diarizer', an expert in linguistic patterns and speaker identification.

Task: Analyze the provided transcript to identify speaker changes.
Rules:
- Use generic labels: [Host], [Host 2], [Speaker 1], [Speaker 2], or [Audience].
- Do not remove any text; your goal is purely to categorize who said what.
- Identify the [Host] based on introductory cues (e.g., "Welcome everyone," "Our next guest is...").
- Output the result ONLY as a valid JSON array of objects.

Output Format:
[{"speaker": "[Label]", "text": "actual spoken text"}]

Here is the transcript:
---
${transcriptText}
---
    `;
    const diarizerResult = await diarizerModel.generateContent(diarizerPrompt);
    const diarizedText = cleanJsonResponse(diarizerResult.response.text());

    // Agent 2: The Cleaner
    console.log("-> Agent 2: The Cleaner is polishing the text and removing duplicates...");
    const cleanerPrompt = `
You are 'The Cleaner', a professional technical editor.

Task: Refine the diarized JSON transcript.
Rules:
- Remove verbal fillers (e.g., "um," "uh," "you know," "like").
- Rolling Deduplication: YouTube auto-captions often repeat phrases as they scroll (e.g., "the code is" followed by "the code is working"). Merge these into a single, clean sentence.
- Maintain the exact technical terminology and acronyms used by the speakers.
- Preserve the JSON structure provided in the input.

Constraint: Do not summarize or delete technical points. Only polish the delivery. Output ONLY the valid JSON array.

Here is the diarized JSON transcript:
---
${diarizedText}
---
    `;
    const cleanerResult = await cleanerModel.generateContent(cleanerPrompt);
    const cleanedText = cleanJsonResponse(cleanerResult.response.text());

    // Agent 3: The Architect
    console.log("-> Agent 3: The Architect is creating the JSON outline...");
    const architectPrompt = `
You are 'The Architect', a Senior Content Strategist.

Task: Analyze the polished JSON transcript to create a comprehensive structural blueprint for a technical article.

Rules:
- Unified Narrative: Include all technical insights and content from all identified [Speaker] labels. Synthesize their contributions into a single, cohesive narrative flow rather than separating the article by individual speakers.
- Audience & Q&A Inclusion: Explicitly include sections for [Audience] questions and the corresponding speaker responses. These must be treated as essential technical content.
- Chronological Integrity: The blueprint sections must strictly follow the original timeline and sequence of the presentation.
- Mandatory Completeness: Every technical topic, concept, sub-topic, or feature discussed in the transcript must be represented. No subject of discussion is to be missing from the final blueprint.
- Host Exclusion: Exclude segments labeled as [Host] that are purely introductory, logistical, or non-technical "housekeeping."

Output Format: Provide a JSON "Blueprint" containing an ordered list of sections. Each section must include a title and a detailed_summary_of_points.
Output ONLY the valid JSON array. Do not wrap in markdown loops.

Example Format:
[
  {
    "title": "Introduction to Next-Gen Networking",
    "detailed_summary_of_points": "Covers the historical background and the primary scaling problems addressed by the new architecture."
  }
]

Here is the polished JSON transcript:
---
${cleanedText}
---
    `;
    const architectResult = await architectModel.generateContent(architectPrompt);
    const outlineText = cleanJsonResponse(architectResult.response.text());

    let outlineData;
    try {
        outlineData = JSON.parse(outlineText);
    } catch (e) {
        console.error("Failed to parse Architect JSON. Raw output:", outlineText);
        throw e;
    }

    // Agent 4: The Narrative Writer
    console.log(`-> Agent 4: The Narrative Writer is drafting the final article in ${outlineData.length} chunks...`);

    let finalArticle = "# Technical Presentation Article\n\n";

    for (let i = 0; i < outlineData.length; i++) {
        const section = outlineData[i];
        console.log(`   - Writing section ${i + 1}/${outlineData.length}: ${section.title}`);

        const narrativePrompt = `
You are 'The Narrative Writer', a Senior Technical Journalist.

Task: Convert the structural blueprint and relevant transcript segments into a unified, professional blog post.
Rules:
- Voice: Use a single, cohesive, authoritative voice. Do not write it as a transcript or Q&A.
- Tone: Professional, engaging, and technically precise.
- Formatting: Use Markdown headers, bullet points for lists, and bold text for key concepts.
- Constraint: Use the blueprint for the structure and the transcript for the technical details. Ignore any host-specific "housekeeping" (e.g., "the slides are available later").
- Narrative Synthesis: Even when multiple speakers or audience members contribute to a topic, write in a single, authoritative voice. For Q&A segments, integrate the audience's queries and the speakers' answers into the professional prose (e.g., "Addressing a common concern regarding latency, the team explained that...").

Your Section Assignment:
Title: ${section.title}
Summary to Cover: ${section.detailed_summary_of_points}

Focus ONLY on writing this specific section using the provided transcript as your grounded truth.
Start your output with a Markdown heading corresponding to the section title (e.g. ## ${section.title}), followed by the contents.

Polished JSON Transcript Context:
---
${cleanedText}
---
        `;

        const narrativeResult = await writerModel.generateContent(narrativePrompt);
        finalArticle += narrativeResult.response.text().trim() + "\n\n";
    }

    return finalArticle.trim();
}

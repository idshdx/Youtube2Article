# YouTube TechTalk-to-Article MVP

This application converts YouTube technical presentations into high-quality, unified Markdown articles using Google's Gemini 1.5 Flash.

## Prerequisites

1. **Node.js** installed on your machine.
2. **`yt-dlp`** installed and available in your system's PATH. ([Installation guide](https://github.com/yt-dlp/yt-dlp/wiki/Installation))
3. **`ffmpeg`** installed and available in your system's PATH (required for subtitle conversion to SRT). ([Installation guide](https://ffmpeg.org/download.html))
4. **Google Gemini API Key**: Get one from [Google AI Studio](https://aistudio.google.com/).

## Setup

1. Clone or navigate to this repository.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and add your API key:

   ```env
   GEMINI_API_KEY=your_actual_api_key_here
   ```

## Usage

Run the tool with a YouTube URL as an argument:

```bash
npm start "https://www.youtube.com/watch?v=YOUR_VIDEO_ID"
```

The script will:

1. Use `yt-dlp` to download the auto-generated English transcript as a `.vtt` file.
2. Read the transcript content.
3. Send it to Gemini 1.5 Flash to automatically clean timestamps, perform speaker diarization (if applicable), and format it into a cohesive Markdown article.
4. Save the generated content to `article.md` in the current directory.

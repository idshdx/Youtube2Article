import { downloadTranscript } from './downloader';
import { processTranscript } from './ai';
import { cleanSRT } from './cleaner';
import * as fs from 'node:fs';
import * as dotenv from 'dotenv';
import { spawnSync } from 'node:child_process';

dotenv.config();

async function main() {
    const url = process.argv[2];
    if (!url) {
        console.error('Usage: npm start <YouTube URL>');
        process.exit(1);
    }

    // FFmpeg dependency check
    const ffmpegCheck = spawnSync('ffmpeg', ['-version']);
    if (ffmpegCheck.error) {
        console.error('------- DEPENDENCY ERROR -------');
        console.error('FFmpeg was not found in your system PATH.');
        console.error('yt-dlp requires FFmpeg to convert subtitles to SRT.');
        console.error('Please install FFmpeg: https://ffmpeg.org/download.html');
        console.error('--------------------------------');
        process.exit(1);
    }

    try {
        console.log(`Downloading transcript for: ${url}`);
        const vttFilePath = await downloadTranscript(url);

        console.log(`Reading transcript from: ${vttFilePath}`);
        const srtText = fs.readFileSync(vttFilePath, 'utf-8');
        const cleanedText = cleanSRT(srtText);

        const cleanedFileName = 'cleaned_transcript.txt';
        fs.writeFileSync(cleanedFileName, cleanedText, 'utf-8');
        console.log(`Cleaned transcript saved to: ${cleanedFileName}`);

        console.log('\nExecuting Multi-Agent Pipeline...');
        const articleMd = await processTranscript(cleanedText);

        const outPath = 'article.md';
        fs.writeFileSync(outPath, articleMd, 'utf-8');
        console.log(`\nSuccessfully synthesized article to ${outPath}`);
    } catch (e: any) {
        console.error('Error message:', e.message || e);
        if (e.status) console.error('Status:', e.status);
        process.exit(1);
    }
}

main();

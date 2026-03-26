import { downloadTranscript } from './downloader';
import { processTranscript } from './ai';
import { cleanSRT } from './cleaner';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as dotenv from 'dotenv';
import { spawnSync } from 'node:child_process';

dotenv.config();

function getYoutubeId(url: string): string {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = regExp.exec(url);
    return match?.[2]?.length === 11 ? match[2] : 'video_output';
}

async function main() {
    const url = process.argv[2];
    let customName = process.argv[3];
    
    if (!url) {
        console.error('Usage: npm start <YouTube URL> [optional_output_name]');
        process.exit(1);
    }

    if (!customName) {
        customName = getYoutubeId(url);
    }

    // Ensure dist directory exists
    const distDir = path.join(process.cwd(), 'dist');
    if (!fs.existsSync(distDir)) {
        fs.mkdirSync(distDir, { recursive: true });
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
        const vttFilePath = await downloadTranscript(url, distDir, customName);

        console.log(`Reading transcript from: ${vttFilePath}`);
        const srtText = fs.readFileSync(vttFilePath, 'utf-8');
        const cleanedText = cleanSRT(srtText);

        const cleanedFileName = path.join(distDir, `${customName}_cleaned.txt`);
        fs.writeFileSync(cleanedFileName, cleanedText, 'utf-8');
        console.log(`Cleaned transcript saved to: ${cleanedFileName}`);

        console.log('\nExecuting Multi-Agent Pipeline...');
        const articleMd = await processTranscript(cleanedText);

        const outPath = path.join(distDir, `${customName}.md`);
        fs.writeFileSync(outPath, articleMd, 'utf-8');
        console.log(`\nSuccessfully synthesized article to ${outPath}`);
    } catch (e: any) {
        console.error('Error message:', e.message || e);
        if (e.status) console.error('Status:', e.status);
        process.exit(1);
    }
}

main();

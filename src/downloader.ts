import { spawn } from 'node:child_process';
import * as path from 'node:path';
import * as fs from 'node:fs';

export async function downloadTranscript(url: string, outputDir: string = process.cwd(), baseName: string = 'transcript'): Promise<string> {
    return new Promise((resolve, reject) => {
        // Output template for yt-dlp
        const outTmpl = path.join(outputDir, baseName);
        const expectedFile = path.join(outputDir, `${baseName}.en.srt`);

        // Clean up previous file if it exists
        if (fs.existsSync(expectedFile)) {
            fs.unlinkSync(expectedFile);
        }

        const args = [
            '--skip-download',
            '--write-auto-sub',
            '--sub-lang', 'en',
            '--convert-subs', 'srt',
            '-o', outTmpl,
            url
        ];

        const ytDlp = spawn('yt-dlp', args);

        ytDlp.stdout.on('data', (data) => {
            console.log(`yt-dlp: ${data.toString().trim()}`);
        });

        ytDlp.stderr.on('data', (data) => {
            console.error(`yt-dlp err: ${data.toString().trim()}`);
        });

        ytDlp.on('close', (code) => {
            if (code === 0) {
                // Check if the file was created
                if (fs.existsSync(expectedFile)) {
                    resolve(expectedFile);
                } else {
                    reject(new Error(`yt-dlp finished but ${expectedFile} was not found.`));
                }
            } else {
                reject(new Error(`yt-dlp exited with code ${code}`));
            }
        });
    });
}

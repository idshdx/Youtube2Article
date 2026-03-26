import { cleanSRT } from './src/cleaner';
import * as fs from 'fs';

const text = fs.readFileSync('transcript.en.srt', 'utf-8');
const cleaned = cleanSRT(text);
console.log(`Original SRT length: ${text.length}`);
console.log(`Cleaned text length: ${cleaned.length}`);
console.log('--- Substring Sample (first 500 chars) ---');
console.log(cleaned.substring(0, 500));

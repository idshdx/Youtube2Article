export function cleanSRT(srtText: string): string {
    const blocks = srtText.trim().split(/\r?\n\r?\n/);
    const finalWords: string[] = [];

    for (const block of blocks) {
        const lines = block.split(/\r?\n/);
        // SRT blocks roughly look like:
        // 1
        // 00:00:00,000 --> 00:00:02,000
        // Text line 1
        // Text line 2
        
        if (lines.length < 3) continue;

        // Extract the actual text lines from the block, ignoring index and timestamp
        let text = lines.slice(2).join(' ').trim();
        
        // Strip HTML-like tags (e.g. <c> tags sometimes left over or standard <b>, <i>)
        text = text.replace(/<[^>]*>/g, '').trim();
        
        // Remove duplicate spaces
        text = text.replace(/\s+/g, ' ');

        if (!text) continue;

        const currentWords = text.split(' ');

        if (finalWords.length === 0) {
            finalWords.push(...currentWords);
            continue;
        }

        // Try to find the maximum exact word overlap between the end of finalWords and start of currentWords
        let maxOverlap = 0;
        const maxPossibleOverlap = Math.min(finalWords.length, currentWords.length);
        
        // Look backwards from the largest possible overlap down to 1
        for (let i = maxPossibleOverlap; i >= 1; i--) {
            let match = true;
            for (let j = 0; j < i; j++) {
                if (finalWords[finalWords.length - i + j] !== currentWords[j]) {
                    match = false;
                    break;
                }
            }
            if (match) {
                maxOverlap = i;
                break;
            }
        }

        // Only append the non-overlapping new words to final running list
        for (let i = maxOverlap; i < currentWords.length; i++) {
            finalWords.push(currentWords[i]);
        }
    }

    return finalWords.join(' ');
}



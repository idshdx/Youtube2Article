export function cleanSRT(srtText: string): string {
    const blocks = srtText.trim().split(/\r?\n\r?\n/);
    const textLines: string[] = [];

    for (const block of blocks) {
        const lines = block.split(/\r?\n/);
        
        if (lines.length < 3) continue;

        // Extract the actual text lines from the block, ignoring index and timestamp
        let text = lines.slice(2).join(' ').trim();
        
        // Strip out any HTML-like tags (e.g. <c> tags)
        text = text.replaceAll(/<[^>]*>/g, '').trim();
        
        // Remove duplicate spaces
        text = text.replaceAll(/\s+/g, ' ');

        if (!text) continue;
        
        textLines.push(text);
    }

    // Return the raw text lines separated by line breaks to preserve structural paragraphing.
    // We defer the advanced deduplication and contextual merging to 'The Cleaner' AI Agent.
    return textLines.join('\n\n');
}

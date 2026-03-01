import { ContentIdea, ScriptCritique } from '../types';

export function downloadAsMarkdown(contentIdea: ContentIdea, critique?: ScriptCritique | null) {
    let md = `# Production Script: ${contentIdea.title}\n\n`;

    md += `## 🪝 Hooks\n`;
    contentIdea.hookVariations?.forEach(h => {
        md += `- **[${h.type}]**: ${h.text}\n`;
    });
    md += `\n`;

    md += `## 📝 Script Timeline\n`;
    contentIdea.script.forEach(segment => {
        md += `### ${segment.timestamp}\n**Dialogue:** ${segment.text}\n`;
        const visual = contentIdea.imagePrompts?.find(p => p.frame === segment.timestamp);
        if (visual) {
            md += `*Visual Instruction: ${visual.prompt}*\n`;
        }
        md += `\n`;
    });

    md += `## 🎨 Design & Post-Production\n`;
    md += `- **Visual Style Model:** ${contentIdea.visualStyle}\n`;
    md += `- **Font Typography:** ${contentIdea.fontStyle}\n`;
    md += `- **Editing FX:** ${contentIdea.editingEffects.join(', ')}\n`;
    md += `- **Pacing Context:** ${contentIdea.editingEffectsContext}\n\n`;

    md += `## 🎵 Audio Environment\n`;
    md += `- **Music Vibe:** ${contentIdea.musicStyle}\n`;
    md += `- **Sound Elements:** ${contentIdea.soundEffects.join(', ')}\n\n`;

    md += `## 🔍 SEO & Upload Metadata\n`;
    if (contentIdea.seoMetadata) {
        md += `- **Title:** ${contentIdea.seoMetadata.youtubeTitle}\n`;
        md += `- **Description:** ${contentIdea.seoMetadata.youtubeDescription}\n`;
        md += `- **Pinned Comment:** ${contentIdea.seoMetadata.pinnedCommentIdea}\n`;
    }
    md += `- **Hashtags:** ${contentIdea.hashtags.map(h => '#' + h.replace('#', '')).join(' ')}\n\n`;

    if (critique?.improvedScript) {
        md += `---\n\n## ✨ AI Improved Script Revision\n\n`;
        md += `*The AI rebuilt this script to maximize retention against a ${critique.viralityScore}/100 baseline score.*\n\n`;
        critique.improvedScript.forEach(segment => {
            md += `### ${segment.timestamp}\n**Dialogue:** ${segment.text}\n`;
            const visual = critique.improvedImagePrompts?.find(p => p.frame === segment.timestamp);
            if (visual) {
                md += `*Visual Instruction: ${visual.prompt}*\n`;
            }
            md += `\n`;
        });
    }

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    // BUG FIX #6: Wrap in try/finally so the object URL is always revoked,
    // even if link.click() throws. Without this, the URL leaks until page unload.
    try {
        const link = document.createElement('a');
        link.href = url;
        link.download = `script_${contentIdea.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } finally {
        URL.revokeObjectURL(url);
    }
}

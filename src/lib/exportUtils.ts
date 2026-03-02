import { ContentIdea, ScriptCritique } from '../types';

export function downloadAsMarkdown(contentIdea: ContentIdea, critique?: ScriptCritique | null) {
    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = Math.floor(secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    let md = `# Production Script: ${contentIdea.title}\n\n`;

    md += `## 🪝 Hooks\n`;
    contentIdea.hookVariations?.forEach(h => {
        md += `- **[${h.type}]**: ${h.text}\n`;
    });
    md += `\n`;

    md += `## 🎬 Storyboard Timeline\n`;
    contentIdea.timeline.forEach(seg => {
        md += `### [${formatTime(seg.startTime)}–${formatTime(seg.endTime)}]\n`;
        md += `**AUDIO:** ${seg.audio}\n`;
        md += `*VISUAL: ${seg.visual}*\n\n`;
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

    if (critique?.improvedTimeline) {
        md += `---\n\n## ✨ AI Improved Storyboard\n\n`;
        md += `*Rebuilt to maximize retention against a ${critique.viralityScore}/100 baseline score.*\n\n`;
        critique.improvedTimeline.forEach(seg => {
            md += `### [${formatTime(seg.startTime)}–${formatTime(seg.endTime)}]\n`;
            md += `**AUDIO:** ${seg.audio}\n`;
            md += `*VISUAL: ${seg.visual}*\n\n`;
        });
    }

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
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

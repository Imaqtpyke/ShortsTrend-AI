import { ContentIdea, ScriptCritique } from '../types';

export function downloadAsMarkdown(contentIdea: ContentIdea, critique?: ScriptCritique | null) {
    const formatTime = (secs: number) => {
        if (secs == null || isNaN(secs)) return "00:00";
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = Math.floor(secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    let md = `# Production Script: ${contentIdea.title}\n\n`;

    if (contentIdea.abTestPack) {
        const variants = [
            ['A', contentIdea.abTestPack.variantA],
            ['B', contentIdea.abTestPack.variantB],
            ['C', contentIdea.abTestPack.variantC]
        ] as const;
        md += `## 🧪 A/B Test Pack\n`;
        variants.forEach(([key, variant]) => {
            md += `### Variant ${key} — ${variant.label}\n`;
            md += `- **Hook:** ${variant.hook}\n`;
            md += `- **Title:** ${variant.title}  \n`;
            md += `- **Thumbnail:** ${variant.thumbnailText}\n`;
            md += `- **Best for:** ${variant.suggestedAudience} on ${variant.platformFit}\n`;
            md += `- **Hypothesis:** ${variant.testHypothesis}\n`;
            md += `- **How to test:** ${variant.testInstructions}\n\n`;
        });
    } else {
        md += `## 🪝 Hooks\n`;
        contentIdea.hookVariations?.forEach(h => {
            md += `- **[${h.type}]**: ${h.text}\n`;
        });
        md += `\n`;
    }

    md += `## 🎬 Storyboard Timeline\n`;
    contentIdea.segments.forEach(seg => {
        md += `### [${seg.timestamp || formatTime(seg.startTime)}]\n`;
        md += `**SCRIPT:** ${seg.script}\n`;
        md += `*VISUAL: ${seg.visual}*\n`;
        if (seg.motion) md += `*MOTION: ${seg.motion}*\n`;
        md += `\n`;
    });

    md += `## 🎨 Design & Post-Production\n`;
    if (contentIdea.hook) md += `- **Primary Hook:** ${contentIdea.hook}\n`;
    md += `- **Visual Style Model:** ${contentIdea.visualStyle}\n`;
    md += `- **Font Typography:** ${contentIdea.fontStyle}\n`;
    md += `- **Editing FX:** ${contentIdea.editingEffects.join(', ')}\n`;
    md += `- **Pacing Context:** ${contentIdea.editingEffectsContext}\n\n`;


    // Removed musicStyle and soundEffects lines
    md += `## 🔍 SEO & Upload Metadata\n`;
    if (contentIdea.seoMetadata) {
        md += `- **Title:** ${contentIdea.seoMetadata.youtubeTitle}\n`;
        md += `- **Description:** ${contentIdea.seoMetadata.youtubeDescription}\n`;
        md += `- **Pinned Comment:** ${contentIdea.seoMetadata.pinnedCommentIdea}\n`;
    }
    md += `- **Hashtags:** ${contentIdea.hashtags.map(h => '#' + h.replace('#', '')).join(' ')}\n\n`;

    if (critique?.improvedSegments) {
        md += `---\n\n## ✨ AI Improved Storyboard\n\n`;
        md += `*Rebuilt to maximize retention against a ${critique.viralityScore}/100 baseline score.*\n\n`;
        critique.improvedSegments.forEach(seg => {
            md += `### [${seg.timestamp || formatTime(seg.startTime)}]\n`;
            md += `**SCRIPT:** ${seg.script}\n`;
            md += `*VISUAL: ${seg.visual}*\n`;
            if (seg.motion) md += `*MOTION: ${seg.motion}*\n`;
            md += `\n`;
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

export function downloadAsCSV(contentIdea: ContentIdea) {
    const formatTime = (secs: number) => {
        if (secs == null || isNaN(secs)) return "00:00";
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = Math.floor(secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    const sanitizeCell = (value: unknown) => {
        const raw = value == null ? '' : String(value);
        const flattened = raw.replace(/\r?\n/g, ' ').trim();
        const escapedQuotes = flattened.replace(/"/g, '""');
        return /[",]/.test(escapedQuotes) ? `"${escapedQuotes}"` : escapedQuotes;
    };

    const rows: string[] = [];
    rows.push('Segment,Timestamp,Script,Visual,Motion,Cut Type');

    contentIdea.segments.forEach((seg, idx) => {
        rows.push([
            sanitizeCell(seg.index ?? idx),
            sanitizeCell(seg.timestamp || formatTime(seg.startTime)),
            sanitizeCell(seg.script),
            sanitizeCell(seg.visual),
            sanitizeCell(seg.motion ?? ''),
            sanitizeCell(seg.cutType ?? '')
        ].join(','));
    });

    rows.push('');
    rows.push('');

    const hashtags = contentIdea.hashtags
        .map(tag => `#${String(tag).replace(/^#+/, '')}`)
        .join(' ');

    const metadataRows: Array<[string, string]> = [
        ['Title', contentIdea.title],
        ['Primary Hook', contentIdea.hook],
        ['Visual Style', contentIdea.visualStyle],
        ['Font Style', contentIdea.fontStyle],
        ['Editing Effects', contentIdea.editingEffects.join(' | ')],
        ['YouTube Title', contentIdea.seoMetadata?.youtubeTitle ?? ''],
        ['YouTube Description', contentIdea.seoMetadata?.youtubeDescription ?? ''],
        ['Pinned Comment', contentIdea.seoMetadata?.pinnedCommentIdea ?? ''],
        ['Hashtags', hashtags]
    ];

    if (contentIdea.abTestPack) {
        const variantRows: Array<[string, string]> = [
            ['Variant A Label', contentIdea.abTestPack.variantA.label],
            ['Variant A Hook', contentIdea.abTestPack.variantA.hook],
            ['Variant A Title', contentIdea.abTestPack.variantA.title],
            ['Variant A Thumbnail', contentIdea.abTestPack.variantA.thumbnailText],
            ['Variant A Hypothesis', contentIdea.abTestPack.variantA.testHypothesis],
            ['Variant A Suggested Audience', contentIdea.abTestPack.variantA.suggestedAudience],
            ['Variant A Platform Fit', contentIdea.abTestPack.variantA.platformFit],
            ['Variant A Test Instructions', contentIdea.abTestPack.variantA.testInstructions],
            ['Variant B Label', contentIdea.abTestPack.variantB.label],
            ['Variant B Hook', contentIdea.abTestPack.variantB.hook],
            ['Variant B Title', contentIdea.abTestPack.variantB.title],
            ['Variant B Thumbnail', contentIdea.abTestPack.variantB.thumbnailText],
            ['Variant B Hypothesis', contentIdea.abTestPack.variantB.testHypothesis],
            ['Variant B Suggested Audience', contentIdea.abTestPack.variantB.suggestedAudience],
            ['Variant B Platform Fit', contentIdea.abTestPack.variantB.platformFit],
            ['Variant B Test Instructions', contentIdea.abTestPack.variantB.testInstructions],
            ['Variant C Label', contentIdea.abTestPack.variantC.label],
            ['Variant C Hook', contentIdea.abTestPack.variantC.hook],
            ['Variant C Title', contentIdea.abTestPack.variantC.title],
            ['Variant C Thumbnail', contentIdea.abTestPack.variantC.thumbnailText],
            ['Variant C Hypothesis', contentIdea.abTestPack.variantC.testHypothesis],
            ['Variant C Suggested Audience', contentIdea.abTestPack.variantC.suggestedAudience],
            ['Variant C Platform Fit', contentIdea.abTestPack.variantC.platformFit],
            ['Variant C Test Instructions', contentIdea.abTestPack.variantC.testInstructions]
        ];
        metadataRows.push(...variantRows);
    } else if (contentIdea.hookVariations?.length) {
        contentIdea.hookVariations.forEach((hook, idx) => {
            metadataRows.push([`Hook Variation ${idx + 1} Type`, hook.type]);
            metadataRows.push([`Hook Variation ${idx + 1} Text`, hook.text]);
        });
    }

    metadataRows.forEach(([key, value]) => {
        rows.push([sanitizeCell(key), sanitizeCell(value)].join(','));
    });

    const csv = rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    try {
        const link = document.createElement('a');
        link.href = url;
        link.download = `script_${contentIdea.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } finally {
        URL.revokeObjectURL(url);
    }
}

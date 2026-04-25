import React from 'react';
import { motion } from 'motion/react';
import { X, ImageIcon, Video, Sliders, User, AlertCircle } from 'lucide-react';
import { VISUAL_STYLES, CONTENT_GENRES, ContentGenre } from '../../types';
import { cn } from '../../lib/utils';
import { useAppStore } from '../../store/useAppStore';

export function PreGenModal() {
    const {
        searchMode,
        directIdea,
        showPreGenModal,
        setShowPreGenModal,
        pendingTrend,
        setPendingTrend,
        selectedVisualStyle,
        setVisualStyle,
        useCustomStyle,
        setUseCustomStyle,
        visualGenerationType,
        setVisualGenerationType,
        segmentLength,
        setSegmentLength,
        customSegmentLength,
        setCustomSegmentLength,
        segmentMode,
        setSegmentMode,
        useCustomCharacter,
        customCharacter,
        setUseCustomCharacter,
        setCustomCharacter,
        selectedGenre,
        setGenre,
        useCustomGenre,
        setUseCustomGenre,
        customGenreString,
        setCustomGenreString,

        handleGenerate,
        isLoading
    } = useAppStore();

    const [charError, setCharError] = React.useState<string | null>(null);

    // U3 FIX: Focus trap — confines keyboard navigation inside the modal and adds
    // Escape-to-close. Restores focus to the previously focused element on unmount.
    const modalRef = React.useRef<HTMLDivElement>(null);
    React.useEffect(() => {
        if (!showPreGenModal) return;
        const previouslyFocused = document.activeElement as HTMLElement;
        const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
            'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        focusable?.[0]?.focus();
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') { setShowPreGenModal(false); return; }
            if (e.key !== 'Tab' || !focusable?.length) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault(); last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault(); first.focus();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            previouslyFocused?.focus?.();
        };
    }, [showPreGenModal, setShowPreGenModal]);

    React.useEffect(() => {
        if (showPreGenModal && visualGenerationType === 'video' && segmentMode === 'fixed') {
            setSegmentMode('adjustable');
        }
    }, [showPreGenModal, visualGenerationType, segmentMode, setSegmentMode]);

    // In idea mode, the configured target is the direct idea itself.
    // Otherwise, it's the pending trend. If opened via "Edit Config" directly from the generator, pendingTrend is empty but selectedTrend is set.
    const selectedTrend = useAppStore(state => state.selectedTrend);

    if (!showPreGenModal) return null;

    const wordCount = (customCharacter?.description || '').trim().split(/\s+/).filter(Boolean).length;
    
    // When editing config after a direct idea generation, searchMode might be 'idea' and directIdea is populated.
    // However, if we just generated from a trend, searchMode is 'keyword', pendingTrend is empty, but selectedTrend has the value.
    const targetEntity = (searchMode === 'idea' && directIdea) 
        ? directIdea 
        : (pendingTrend || selectedTrend || 'Direct Implementation');

    const onGenerate = () => {
        if (visualGenerationType === 'video' && segmentMode === 'fixed') {
            setSegmentMode('adjustable');
        }

        if (useCustomCharacter) {
            if (!(customCharacter?.name || '').trim()) {
                setCharError('Character name is required.');
                return;
            }
            if (wordCount < 50) {
                setCharError(`Custom Character requires a detailed description (minimum 50 words). You have ${wordCount}.`);
                return;
            }
        }
        setCharError(null);
        handleGenerate(targetEntity || 'Direct Implementation');
        setShowPreGenModal(false);
        setPendingTrend('');
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm text-white">
            <motion.div
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="pregen-modal-title"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative w-full max-w-3xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto bg-[#0a0a0a] text-white border border-white/10 p-4 sm:p-6 custom-scrollbar shadow-2xl"
            >
                <button
                    onClick={() => setShowPreGenModal(false)}
                    aria-label="Close dialog"
                    className="absolute top-4 right-4 p-2 text-white/50 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="mb-4 sm:mb-5 space-y-0.5 sm:space-y-1">
                    <h3 id="pregen-modal-title" className="text-base sm:text-lg md:text-xl font-bold tracking-tight">Config: {searchMode === 'idea' ? 'Direct Idea' : targetEntity}</h3>
                    <p className="text-[10px] sm:text-[11px] font-mono opacity-60">Set visual directions before creating script.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 pt-5 border-t border-white/10 items-stretch">
                    {/* ── Box 1: Visual Style (Header + Toggle + Content) ── */}
                    <div className="md:col-span-2 p-3 sm:p-4 border bg-[#1a1a1a]/40 border-white/10 space-y-2 sm:space-y-3">
                        <div className="flex justify-between items-center mb-0.5 sm:mb-1">
                            <label className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-1.5 sm:gap-2">
                                <ImageIcon className="w-2.5 sm:w-3 h-2.5 sm:h-3" /> Visual Style
                            </label>
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] font-mono uppercase opacity-50">Custom Style</span>
                                <button
                                    onClick={() => setUseCustomStyle(!useCustomStyle)}
                                    className={cn(
                                        "relative inline-flex h-4 w-7 items-center rounded-full transition-colors focus:outline-none",
                                        useCustomStyle ? "bg-emerald-500" : "bg-white/10"
                                    )}
                                >
                                    <span className={cn(
                                        "inline-block h-2 w-2 rounded-full bg-white shadow transition-transform",
                                        useCustomStyle ? "translate-x-[16px]" : "translate-x-[4px]"
                                    )} />
                                </button>
                            </div>
                        </div>

                        {useCustomStyle ? (
                            <input
                                id="modal-custom-style-input"
                                type="text"
                                value={VISUAL_STYLES.includes(selectedVisualStyle) ? '' : selectedVisualStyle}
                                onChange={(e) => setVisualStyle(e.target.value)}
                                placeholder="Style (e.g., Neon Noir, Retro Synthwave)..."
                                className="w-full px-3 py-2 text-[10px] sm:text-xs font-mono border transition-all min-h-[38px] bg-[#0a0a0a] text-white border-white/10 focus:border-emerald-500 outline-none"
                            />
                        ) : (
                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 flex-1 items-start content-start">
                                {VISUAL_STYLES.map(style => {
                                    let label = style.split(' ')[0];
                                    if (style === "Low Poly 3D") label = "LOW";
                                    if (style === "3D Pixar / Disney Style") label = "3D";
                                    if (style === "3D Render") label = "3D";
                                    if (style === "Cinematic & Photorealistic") label = "CINEMA";
                                    if (style === "Anime / Studio Ghibli") label = "ANIME";
                                    if (style === "Cyberpunk / Neon") label = "CYBER";
                                    if (style === "Minimalist Vector Art") label = "VECTOR";
                                    if (style === "Vintage 90s VHS") label = "VHS";

                                    return (
                                        <button
                                            key={style}
                                            onClick={() => setVisualStyle(style)}
                                            className={cn(
                                                "px-1.5 py-1.5 text-[8px] sm:text-[9px] font-mono uppercase border transition-all min-h-[32px] flex items-center justify-center",
                                                selectedVisualStyle === style
                                                    ? "bg-emerald-500 text-[#0a0a0a] border-emerald-500 font-bold"
                                                    : "bg-[#0a0a0a] text-white border-white/10 hover:border-emerald-500"
                                            )}
                                        >
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* ── Box 2: Visual Type (Compact) ── */}
                    <div className="md:col-span-1 p-3 sm:p-4 border bg-[#1a1a1a]/40 border-white/10 space-y-2 sm:space-y-3">
                        <label className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-1.5 sm:gap-2">
                            <Video className="w-2.5 sm:w-3 h-2.5 sm:h-3" /> Type
                        </label>
                        <div className="flex flex-col gap-2">
                            {(['image', 'video', 'image-to-video'] as const).map(type => (
                                <button
                                    key={type}
                                    onClick={() => setVisualGenerationType(type)}
                                    className={cn(
                                        "px-3 sm:px-4 py-2 sm:py-2.5 text-[10px] sm:text-[11px] font-mono uppercase border transition-all flex items-center gap-2 sm:gap-3 w-full min-h-[36px] sm:min-h-[40px]",
                                        visualGenerationType === type
                                            ? "bg-emerald-500 text-[#0a0a0a] border-emerald-500"
                                            : "bg-[#0a0a0a] text-white border-white/10 hover:border-emerald-500"
                                    )}
                                >
                                    {type === 'image' ? <ImageIcon className="w-3.5 sm:w-4 h-3.5 sm:h-4 flex-shrink-0" /> : <Video className="w-3.5 sm:w-4 h-3.5 sm:h-4 flex-shrink-0" />}
                                    {type === 'image' ? 'Image' : type === 'video' ? 'Video' : 'Img→Vid'}
                                </button>
                            ))}
                            

                        </div>
                    </div>

                    {/* ── Box 3: Segment Length (Compact) ── */}
                    <div className="md:col-span-1 p-3 sm:p-4 border bg-[#1a1a1a]/40 border-white/10 space-y-2 sm:space-y-3">
                        <div className="flex flex-col space-y-1.5 sm:space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-1.5 sm:gap-2">
                                    {visualGenerationType === 'image' ? <ImageIcon className="w-2.5 sm:w-3 h-2.5 sm:h-3" /> : <Video className="w-2.5 sm:w-3 h-2.5 sm:h-3" />}
                                    {visualGenerationType === 'image' ? 'Seg' : 'Clip'}
                                </label>

                                <div className="flex bg-[#0a0a0a] border border-white/10 p-0.5 rounded-sm">
                                    {visualGenerationType === 'image' && (
                                        <button
                                            onClick={() => setSegmentMode('fixed')}
                                            className={cn(
                                                "px-2 py-1 text-[8px] font-mono uppercase tracking-widest transition-colors rounded-sm",
                                                segmentMode === 'fixed'
                                                    ? "bg-emerald-500 text-black font-bold"
                                                    : "text-white/50 hover:text-white"
                                            )}
                                        >
                                            Fixed
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setSegmentMode('adjustable')}
                                        className={cn(
                                            "px-2 py-1 text-[8px] font-mono uppercase tracking-widest transition-colors rounded-sm",
                                            (segmentMode === 'adjustable' || visualGenerationType !== 'image')
                                                ? "bg-emerald-500 text-black font-bold"
                                                : "text-white/50 hover:text-white"
                                        )}
                                    >
                                        Dynamic Sync
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-col space-y-2">
                                {segmentMode === 'adjustable' || visualGenerationType !== 'image' ? (
                                    <div className="p-2.5 border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-[9px] font-mono leading-relaxed">
                                        <p className="font-bold mb-0.5 text-emerald-400">Perfect Sync Active:</p>
                                        <p>AI automatically splits scenes based on script beats and punctuation.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <p className="text-[9px] font-mono text-white/40 uppercase tracking-wider px-1">Clip Duration:</p>
                                        <select
                                            className="w-full px-2 sm:px-3 py-2 sm:py-2.5 text-[10px] sm:text-[11px] font-mono border transition-all bg-[#0a0a0a] text-white border-white/10 focus:border-emerald-500 outline-none min-h-[36px] sm:min-h-[40px]"
                                            value={customSegmentLength !== null ? 'custom' : segmentLength}
                                            onChange={(e) => {
                                                if (e.target.value === 'custom') {
                                                    setCustomSegmentLength(visualGenerationType === 'image' ? 4 : 6);
                                                } else {
                                                    setCustomSegmentLength(null);
                                                    setSegmentLength(Number(e.target.value));
                                                }
                                            }}
                                        >
                                            <option value="4">4s (Fast)</option>
                                            <option value="6">6s (Std)</option>
                                            <option value="8">8s (Mid)</option>
                                            <option value="15">15s (Slow)</option>
                                            <option value="custom">Custom...</option>
                                        </select>
                                        {customSegmentLength !== null && (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    min={2}
                                                    max={30}
                                                    value={customSegmentLength}
                                                    onChange={(e) => {
                                                        const val = Number(e.target.value);
                                                        if (val >= 2 && val <= 30) setCustomSegmentLength(val);
                                                    }}
                                                    className="w-full px-3 py-2 text-[11px] font-mono border transition-all bg-[#0a0a0a] text-emerald-400 border-emerald-500/50 focus:border-emerald-500 outline-none min-h-[38px]"
                                                />
                                                <span className="text-[10px] font-mono text-white/40 whitespace-nowrap">sec</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Box 3.5: Genre (Wide) ── */}
                    <div className="md:col-span-2 p-3 sm:p-4 border bg-[#1a1a1a]/40 border-white/10 space-y-2 sm:space-y-3">
                        <div className="flex justify-between items-center">
                            <label className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-1.5 sm:gap-2">
                                <Sliders className="w-2.5 sm:w-3 h-2.5 sm:h-3" /> Content Genre
                            </label>
                            <div className="flex items-center gap-2">
                                <span className="text-[9px] font-mono uppercase opacity-50">Custom Genre</span>
                                <button
                                    onClick={() => setUseCustomGenre(!useCustomGenre)}
                                    className={cn(
                                        "relative inline-flex h-4 w-7 items-center rounded-full transition-colors focus:outline-none",
                                        useCustomGenre ? "bg-emerald-500" : "bg-white/10"
                                    )}
                                >
                                    <span className={cn(
                                        "inline-block h-2 w-2 rounded-full bg-white shadow transition-transform",
                                        useCustomGenre ? "translate-x-[16px]" : "translate-x-[4px]"
                                    )} />
                                </button>
                            </div>
                        </div>
                        {useCustomGenre ? (
                            <input
                                type="text"
                                value={customGenreString}
                                onChange={(e) => setCustomGenreString(e.target.value)}
                                placeholder="Framing rules (e.g., Fast cuts, Dramatic)..."
                                className="w-full px-3 py-2 text-[10px] sm:text-xs font-mono border transition-all min-h-[38px] bg-[#0a0a0a] text-white border-white/10 mt-1.5 focus:border-emerald-500 outline-none"
                            />
                        ) : (
                            <div className="flex flex-wrap gap-1.5">
                                {(() => {
                                    const GENRE_ICONS: Record<ContentGenre, string> = {
                                        Storytelling: '📖',
                                        Action: '⚡',
                                        Documentary: '🎥',
                                        Motivational: '🔥',
                                        Restoration: '🛠️',
                                        POV: '👁️',
                                        Timelapse: '⏩',
                                        Horror: '🦇',
                                        Comedy: '😂',
                                        Educational: '🎓',
                                        Cinematic: '🎬',
                                        Tutorial: '🔨',
                                        Vlog: '📱',
                                        Gaming: '🎮',
                                        Fitness: '💪',
                                        Travel: '✈️',
                                        Food: '🍽️',
                                        Fashion: '✨',
                                        Mystery: '🔍',
                                        ASMR: '🎧',
                                        Interview: '🎤'
                                    };
                                    return CONTENT_GENRES.map((g) => (
                                        <button
                                            key={g}
                                            onClick={() => setGenre(g)}
                                            className={cn(
                                                "px-2 py-1.5 text-[8px] sm:text-[10px] font-mono uppercase border transition-all min-h-[28px] flex items-center gap-1",
                                                selectedGenre === g
                                                    ? "bg-emerald-500 text-[#0a0a0a] border-emerald-500 font-bold"
                                                    : "bg-[#0a0a0a] text-white border-white/10 hover:border-emerald-500"
                                            )}
                                        >
                                            <span className="text-xs sm:text-sm">{GENRE_ICONS[g]}</span>
                                            {g}
                                        </button>
                                    ));
                                })()}
                            </div>
                        )}
                    </div>

                    {/* ── Box 5: Custom Character (Wide) ── */}
                    <div className="md:col-span-2 p-3 sm:p-4 border bg-[#1a1a1a]/40 border-white/10 space-y-2 sm:space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest opacity-40 flex items-center gap-1.5 sm:gap-2">
                                <User className="w-2.5 sm:w-3 h-2.5 sm:h-3" /> Character System
                            </label>
                            <button
                                onClick={() => { setUseCustomCharacter(!useCustomCharacter); setCharError(null); }}
                                className={cn(
                                    "relative inline-flex h-4.5 w-9 items-center rounded-full transition-colors focus:outline-none",
                                    useCustomCharacter ? "bg-emerald-500" : "bg-white/10"
                                )}
                            >
                                <span className={cn(
                                    "inline-block h-3 w-3 rounded-full bg-white shadow transition-transform",
                                    useCustomCharacter ? "translate-x-[20px]" : "translate-x-[4px]"
                                )} />
                            </button>
                        </div>

                        {useCustomCharacter && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="space-y-3 pt-1"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <input
                                        type="text"
                                        value={customCharacter.name}
                                        onChange={e => setCustomCharacter({ ...customCharacter, name: e.target.value })}
                                        placeholder="Character name (e.g. Zyro, Dr. Nova)..."
                                        className="w-full px-4 py-3 text-xs font-mono border transition-all min-h-[44px] bg-[#0a0a0a] text-white border-white/10 focus:border-emerald-500 outline-none"
                                    />
                                    <select
                                        value={customCharacter.type}
                                        onChange={e => setCustomCharacter({ ...customCharacter, type: e.target.value as 'image' | 'video' | 'both' })}
                                        className="w-full px-3 sm:px-4 py-2 sm:py-3 text-[10px] sm:text-[11px] font-mono border transition-all bg-[#0a0a0a] text-white border-white/10 focus:border-emerald-500 outline-none min-h-[38px] sm:min-h-[44px]"
                                    >
                                        <option value="image">Img Only</option>
                                        <option value="video">Vid Only</option>
                                        <option value="both">Both</option>
                                    </select>
                                </div>
                                <div className="relative">
                                    <textarea
                                        value={customCharacter.description}
                                        onChange={e => setCustomCharacter({ ...customCharacter, description: e.target.value })}
                                        placeholder="Description (appearance, personality, voice). Min 50 words."
                                        rows={2}
                                        className={cn(
                                            "w-full px-3 sm:px-4 py-2 sm:py-3 text-[10px] sm:text-xs font-mono border transition-all bg-[#0a0a0a] text-white outline-none resize-none",
                                            wordCount >= 50
                                                ? "border-emerald-500/50 focus:border-emerald-500"
                                                : "border-white/10 focus:border-yellow-500"
                                        )}
                                    />
                                    <span className={cn(
                                        "absolute bottom-2 right-3 text-[8px] sm:text-[9px] font-mono uppercase tracking-widest",
                                        wordCount >= 50 ? "text-emerald-400" : "text-yellow-400"
                                    )}>{wordCount}/50</span>
                                </div>
                                {charError && (
                                    <div className="flex items-start gap-2 p-2.5 border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-mono">
                                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                        <span>{charError}</span>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </div>
                </div>

                <div className="pt-4 sm:pt-5 mt-4 sm:mt-5 border-t border-white/10">
                    <button
                        onClick={onGenerate}
                        disabled={isLoading}
                        className="w-full px-4 py-3 sm:py-3.5 font-mono text-xs sm:text-sm font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-3 border shadow-md active:translate-y-0.5 active:shadow-none min-h-[44px] sm:min-h-[48px] bg-emerald-500 text-[#0a0a0a] border-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Wait...' : `GENERATE SCRIPT >>`}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

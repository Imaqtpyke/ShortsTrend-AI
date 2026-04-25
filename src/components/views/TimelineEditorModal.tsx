import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Play, Pause, Save, Clock, Film, GripVertical, Download, X } from 'lucide-react';
import { useAppStore, useTheme } from '../../store/useAppStore';
import { cn } from '../../lib/utils';
import { downloadAsMarkdown } from '../../lib/exportUtils';
import { TimelineSegment as BaseTimelineSegment } from '../../types';

// Extended segment with duration for the editor
interface TimelineSegment extends BaseTimelineSegment {
    duration: number;
}

// Sortable Item Component
function SortableSegment({ segment, index, totalWidth, totalDuration }: { segment: TimelineSegment, index: number, totalWidth: number, totalDuration: number }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: segment.id });

  const theme = useTheme();

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    // Calculate width as a percentage of total duration
    width: `${(segment.duration / totalDuration) * 100}%`,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative h-32 md:h-48 border-r border-white/5 flex flex-col group overflow-hidden select-none",
        isDragging ? "bg-emerald-500/20 border-emerald-500/50 shadow-xl opacity-90" : "bg-[#1a1a1a] hover:bg-white/5",
        "transition-colors duration-200"
      )}
    >
      {/* Drag Handle Area */}
      <div 
        {...attributes} 
        {...listeners}
        className="h-6 bg-black/40 w-full flex items-center justify-between px-2 cursor-grab active:cursor-grabbing border-b border-white/5"
      >
        <span className="text-[9px] font-mono text-white/40">Clip {index + 1}</span>
        <GripVertical className="w-3 h-3 text-white/20 group-hover:text-white/60" />
      </div>
      
      {/* Content Area */}
      <div className="flex-1 p-2 md:p-3 overflow-hidden text-xs flex flex-col gap-2">
        <div className="flex justify-between items-start opacity-60">
           <span className="font-mono text-[10px] bg-white/10 px-1 rounded">{segment.duration}s</span>
           {segment.cutType && (
               <span className="font-mono text-[8px] uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-1 rounded border border-emerald-500/20 mx-1">
                   {segment.cutType.replace('_', ' ')}
               </span>
           )}
           <span className="font-mono text-[9px]">{segment.timestamp}</span>
        </div>
        <p className="line-clamp-3 md:line-clamp-4 leading-relaxed text-white/80">{segment.visual}</p>
        <div className="mt-auto pt-2 border-t border-white/5">
            <p className="line-clamp-2 italic text-emerald-400/80 font-medium">"{segment.script}"</p>
        </div>
      </div>
    </div>
  );
}

export function TimelineEditorModal() {
  const { contentIdea, updateTimelineSegments, showTimelineEditorModal, setShowTimelineEditorModal } = useAppStore();
  const theme = useTheme();
  
  // Local state for the timeline order
  const [segments, setSegments] = useState<TimelineSegment[]>(() => {
      if (!contentIdea) return [];
      
      // Map segments to include their calculated duration
      return contentIdea.segments.map((seg, index, arr) => {
          let duration = 3; // fallback
          if (seg.endTime && seg.startTime !== undefined) {
              duration = parseFloat((seg.endTime - seg.startTime).toFixed(1));
          } else {
             duration = contentIdea.segmentLength || 3;
          }
          return { ...seg, duration };
      });
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const totalDuration = segments.reduce((acc, curr) => acc + curr.duration, 0);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setSegments((items) => {
        const itemIds = items.map((seg) => seg.id);
        const oldIndex = itemIds.indexOf(active.id as string);
        const newIndex = itemIds.indexOf(over.id as string);
        
        // Reorder array
        const reordered = arrayMove(items, oldIndex, newIndex);
        
        // Recalculate timestamps based on new order
        let currentStartTime = 0;
        const reorderedWithTimestamps = reordered.map((seg, index) => {
            const formatTimeLocal = (secs: number) => {
                const m = Math.floor(secs / 60).toString().padStart(2, '0');
                const s = Math.floor(secs % 60).toString().padStart(2, '0');
                return `${m}:${s}`;
            };
            const newStartTime = currentStartTime;
            const newEndTime = currentStartTime + seg.duration;
            currentStartTime = newEndTime;
            
            return {
                ...seg,
                index,
                startTime: newStartTime,
                endTime: newEndTime,
                timestamp: formatTimeLocal(newStartTime)
            };
        });
        
        return reorderedWithTimestamps;
      });
    }
  }

  const handleExport = () => {
    if (contentIdea) {
        // Only override the segments
        downloadAsMarkdown({ ...contentIdea, segments }, null); // Passing null for critique
    }
  };

  if (!showTimelineEditorModal || !contentIdea) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm text-white">
      <motion.div
        key="timeline-editor-modal"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-[#0a0a0a] border border-white/10 p-5 md:p-8 custom-scrollbar shadow-2xl space-y-6"
      >
        <button
          onClick={() => setShowTimelineEditorModal(false)}
          className="absolute top-4 right-4 p-2 text-white/50 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b pb-6 border-white/10">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest opacity-50 mb-1 block">NLE Mockup</span>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Timeline Editor</h2>
          <p className="text-sm opacity-60 mt-2 max-w-xl">
             Drag and drop segments below to visually adjust pacing and flow. Export when you are happy with the arrangement.
          </p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="px-4 border min-h-[44px] flex items-center gap-2 bg-[#0a0a0a] border-white/10 text-white/50 font-mono text-sm py-2">
                <Clock className="w-4 h-4" />
                {Math.round(totalDuration)}s Total
            </div>
            <button
              onClick={handleExport}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-6 border min-h-[44px] font-mono text-xs uppercase tracking-widest transition-colors w-full focus-ring",
                theme.bg + " text-[#0a0a0a] " + theme.hoverBg
              )}
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
               onClick={() => setShowTimelineEditorModal(false)}
               className={cn(
                 "flex items-center justify-center gap-2 px-6 border min-h-[44px] font-mono text-xs uppercase tracking-widest transition-colors focus-ring",
                 "bg-[#1a1a1a] border-white/10 hover:bg-white/5 text-white"
               )}
            >
              Cancel
            </button>
            <button
               onClick={() => {
                 const baseSegments = segments.map(({ duration, ...base }) => base) as BaseTimelineSegment[];
                 updateTimelineSegments(baseSegments);
                 setShowTimelineEditorModal(false);
               }}
               className={cn(
                 "flex items-center justify-center gap-2 px-4 border min-h-[44px] font-mono text-xs uppercase tracking-widest transition-colors focus-ring",
                 theme.bg + " text-[#0a0a0a] " + theme.hoverBg
               )}
            >
              Save Changes
            </button>
        </div>
      </div>

      <div className="w-full bg-[#0a0a0a] border border-white/10 rounded-sm overflow-hidden p-[1px]">
          {/* Time Ruler */}
          <div className="w-full h-8 flex border-b border-white/10 relative opacity-40">
             {segments.map((seg, i) => (
                 <div key={i} style={{ width: `${(seg.duration / totalDuration) * 100}%` }} className="border-r border-white/5 h-full flex flex-col justify-end pb-1 pr-1">
                     <span className="text-[8px] font-mono text-right">{seg.timestamp}</span>
                 </div>
             ))}
          </div>
          
          {/* Drag & Drop Context */}
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="flex w-full overflow-x-auto overflow-y-hidden custom-scrollbar bg-[#050505]">
                <SortableContext 
                    items={segments.map((seg) => seg.id)}
                    strategy={horizontalListSortingStrategy}
                >
                    <div className="flex min-w-[800px] w-full items-center pl-0 pr-0">
                        {segments.map((segment, index) => (
                            <SortableSegment 
                                key={segment.id} 
                                segment={segment} 
                                index={index}
                                totalWidth={100} // relative pct handled inside
                                totalDuration={totalDuration}
                            />
                        ))}
                    </div>
                </SortableContext>
            </div>
          </DndContext>
      </div>
      
      </motion.div>
    </div>
  );
}

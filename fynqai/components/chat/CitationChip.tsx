'use client';

import { Citation } from '@/types/app.types';

interface CitationChipProps {
    citation: Citation;
    onClick: (citation: Citation) => void;
}

export function CitationChip({ citation, onClick }: CitationChipProps) {
    return (
        <button
            onClick={() => onClick(citation)}
            className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-fynq-steel/30 border border-fynq-steel text-[10px] font-bold text-fynq-ash hover:text-white hover:bg-fynq-red hover:border-fynq-crimson transition-all duration-300 mx-0.5 align-top group active:scale-95"
        >
            <span className="opacity-60 font-mono text-[8px] mr-1">REF</span>
            {citation.index}
        </button>
    );
}

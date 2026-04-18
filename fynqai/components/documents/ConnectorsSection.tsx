'use client';

import { ConnectorCard, type ConnectorConfig } from './ConnectorCard';

/* ──────────────────────────────────────────────────────────────────────────
   Brand SVG Icons (inline, no external deps)
   ────────────────────────────────────────────────────────────────────────── */

function GoogleDriveIcon() {
    return (
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
            <path d="M8.627 2L1 15.25l3.737 6.5H8.3L15.927 8.5H8.627z" fill="#0066DA" />
            <path d="M15.927 8.5L8.3 21.75h7.352L23 8.5h-7.073z" fill="#00AC47" />
            <path d="M4.737 21.75L8.627 15.25 15.927 2H8.627L1 15.25l3.737 6.5z" fill="#EA4335" />
            <path d="M15.927 8.5L8.627 2l-3.89 6.75L8.3 15.25l7.627-6.75z" fill="#00832D" />
            <path d="M15.652 21.75L23 8.5h-7.073L8.3 21.75h7.352z" fill="#2684FC" />
            <path d="M8.3 15.25l3.737 6.5h3.615l7.348-13.25h-7.073L8.3 15.25z" fill="#FFBA00" />
        </svg>
    );
}

function OneDriveIcon() {
    return (
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
            <path d="M9.59 15.94l.02-.02 4.33-2.57c-.39-1.87-1.75-3.38-3.54-4.01a5.09 5.09 0 00-1.49-.3A5.19 5.19 0 004 14.11l.03-.01 5.56 1.84z" fill="#0364B8" />
            <path d="M13.94 13.35l-.02.01-4.33 2.58 7.44 2.47h.01A3.46 3.46 0 0020.5 15a3.46 3.46 0 00-.52-1.83l-1.32-.9-4.72-2.92v4z" fill="#0078D4" />
            <path d="M4.03 14.1A3.42 3.42 0 000 17.5 3.42 3.42 0 003.37 21h13.66l.01-.01-7.44-2.47-5.54-1.84-.03.01V14.1z" fill="#1490DF" />
            <path d="M13.94 9.34a5.17 5.17 0 00-3.03-3.3 5.09 5.09 0 00-1.49-.3c.39-.08.8-.13 1.22-.13 2.2 0 4.07 1.38 4.8 3.32l4.72 2.92A3.46 3.46 0 0124 15a3.46 3.46 0 01-3.46 3.46h-.01l.01-.05-6.6-5.07v-4z" fill="#28A8EA" />
        </svg>
    );
}

function SlackIcon() {
    return (
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
            <path d="M5.042 15.166a2.527 2.527 0 01-2.521 2.521 2.527 2.527 0 01-2.521-2.521 2.527 2.527 0 012.521-2.521h2.521v2.521zM6.313 15.166a2.527 2.527 0 012.521-2.521 2.527 2.527 0 012.521 2.521v6.313a2.527 2.527 0 01-2.521 2.521 2.527 2.527 0 01-2.521-2.521v-6.313z" fill="#E01E5A" />
            <path d="M8.834 5.042a2.527 2.527 0 01-2.521-2.521A2.527 2.527 0 018.834 0a2.527 2.527 0 012.521 2.521v2.521H8.834zM8.834 6.313a2.527 2.527 0 012.521 2.521 2.527 2.527 0 01-2.521 2.521H2.521A2.527 2.527 0 010 8.834a2.527 2.527 0 012.521-2.521h6.313z" fill="#36C5F0" />
            <path d="M18.958 8.834a2.527 2.527 0 012.521-2.521A2.527 2.527 0 0124 8.834a2.527 2.527 0 01-2.521 2.521h-2.521V8.834zM17.687 8.834a2.527 2.527 0 01-2.521 2.521 2.527 2.527 0 01-2.521-2.521V2.521A2.527 2.527 0 0115.166 0a2.527 2.527 0 012.521 2.521v6.313z" fill="#2EB67D" />
            <path d="M15.166 18.958a2.527 2.527 0 012.521 2.521A2.527 2.527 0 0115.166 24a2.527 2.527 0 01-2.521-2.521v-2.521h2.521zM15.166 17.687a2.527 2.527 0 01-2.521-2.521 2.527 2.527 0 012.521-2.521h6.313A2.527 2.527 0 0124 15.166a2.527 2.527 0 01-2.521 2.521h-6.313z" fill="#ECB22E" />
        </svg>
    );
}

/* ──────────────────────────────────────────────────────────────────────────
   Connector Definitions
   ────────────────────────────────────────────────────────────────────────── */

const CONNECTORS: ConnectorConfig[] = [
    {
        id: 'google-drive',
        name: 'Google Drive',
        description: 'Sync shared drives and folders directly into your governance knowledge base.',
        icon: <GoogleDriveIcon />,
        brandColor: '#4285F4',
        brandColorTw: '[#4285F4]',
        fileCount: 37,
    },
    {
        id: 'onedrive',
        name: 'Microsoft OneDrive',
        description: 'Import SharePoint and OneDrive documents for automated contradiction scanning.',
        icon: <OneDriveIcon />,
        brandColor: '#0078D4',
        brandColorTw: '[#0078D4]',
        fileCount: 24,
    },
    {
        id: 'slack',
        name: 'Slack',
        description: 'Ingest pinned messages and shared files from Slack channels as knowledge sources.',
        icon: <SlackIcon />,
        brandColor: '#E01E5A',
        brandColorTw: '[#E01E5A]',
        fileCount: 18,
    },
];

/* ──────────────────────────────────────────────────────────────────────────
   Section Component
   ────────────────────────────────────────────────────────────────────────── */

export function ConnectorsSection() {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
                <div>
                    <h3 className="font-ui text-sm font-bold text-fynq-fog uppercase tracking-[0.1em]">
                        External Connectors
                    </h3>
                    <p className="font-ui text-[11px] text-fynq-ash mt-1">
                        Link third-party platforms to auto-sync documents into your KB.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                {CONNECTORS.map(connector => (
                    <ConnectorCard key={connector.id} connector={connector} />
                ))}
            </div>
        </div>
    );
}

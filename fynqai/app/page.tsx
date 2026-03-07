'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
    const router = useRouter();

    useEffect(() => {
        router.push('/dashboard');
    }, [router]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-fynq-void">
            <div className="w-12 h-12 rounded-2xl bg-fynq-red/10 animate-pulse border border-fynq-red/20 shadow-2xl flex items-center justify-center">
                <span className="font-display italic text-2xl text-fynq-red font-bold">f</span>
            </div>
        </div>
    );
}

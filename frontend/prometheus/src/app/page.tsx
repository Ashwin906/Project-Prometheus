'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to landing page
        router.push('/landing');
    }, [router]);

    return (
        <div className="bg-gray-900 text-gray-200 min-h-screen font-sans flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-2xl font-bold text-white mb-4">
                    Project <span className="text-sky-400">Prometheus</span>
                </h1>
                <p className="text-gray-400">Redirecting to landing page...</p>
            </div>
        </div>
    );
}

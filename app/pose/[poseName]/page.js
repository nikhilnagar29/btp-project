// =============================================
// FILE: app/pose/[poseName]/page.tsx  (DETAILS PAGE)
// =============================================
'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';

// Reuse your existing helpers
import { fetchFullPoseData, parseCsvData } from './poseUtils';

function SectionCard({ title, icon, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center gap-3">
        <span className="text-pink-600 text-2xl">{icon}</span>
        {title}
      </h3>
      <div className="prose prose-pink max-w-none text-gray-700">{children}</div>
    </div>
  );
}

export default function PoseDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [pose, setPose] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const poseName = decodeURIComponent(params?.poseName);
        const data = await fetchFullPoseData(poseName);
        // ensure CSV parsed (kept for parity if you need it later)
        await parseCsvData(data.csvData);
        setPose(data);
      } catch (e) {
        setError(e?.message || 'Failed to load pose');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params?.poseName]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pink-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-400 mx-auto"></div>
          <p className="mt-4 text-pink-700 font-medium">Loading pose…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-2">Pose Not Found</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/" className="inline-flex bg-pink-600 text-white px-5 py-2.5 rounded-lg shadow hover:bg-pink-700">Back home</Link>
        </div>
      </div>
    );
  }

  if (!pose) return null;

  const poseName = decodeURIComponent(params?.poseName );

  return (
    <div className="min-h-screen bg-pink-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/" className="inline-flex items-center text-pink-600 hover:text-pink-700">← Back</Link>
          <span className="ml-auto inline-flex items-center rounded-full bg-white/80 px-3 py-1 text-sm font-semibold text-pink-700 shadow">{pose.level || 'Intermediate'}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* LEFT: BIG IMAGE */}
          <div className="bg-gradient-to-br from-white to-pink-50 rounded-2xl shadow-xl overflow-hidden border border-white/70">
            <div className="relative w-full">
              {/* Keep natural ratio: remove forced square. Use responsive container. */}
              <div className="relative w-full" style={{ aspectRatio: '4 / 5' }}>
                <Image src={pose.image} alt={pose.name} fill className="object-cover" priority />
              </div>
            </div>
          </div>

          {/* RIGHT: DETAILS */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-900">{pose.name}</h1>
              <p className="text-lg text-pink-700 italic mt-1">{pose.sanskritName}</p>
            </div>

            <SectionCard title="Benefits" icon={<span>✨</span>}>
              <div className="whitespace-pre-line">{pose.benefits}</div>
            </SectionCard>

            <SectionCard title="Instructions" icon={<span>📋</span>}>
              <div className="whitespace-pre-line">{pose.instructions}</div>
            </SectionCard>

            <div className="pt-2">
              <button
                onClick={() => router.push(`/practice/${encodeURIComponent(poseName)}`)}
                className="w-full inline-flex items-center justify-center gap-3 bg-gradient-to-r from-pink-400 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold shadow hover:from-pink-500 hover:to-pink-700"
              >
                ▶ Start Practice
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

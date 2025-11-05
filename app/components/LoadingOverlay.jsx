'use client';
export default function LoadingOverlay({ label = 'Loading…', show = false }) {
  if (!show) return null;
  return (
    <div className="absolute inset-0 bg-white/90 flex items-center justify-center z-30">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-400 mx-auto mb-4"></div>
        <p className="text-gray-700 font-medium">{label}</p>
      </div>
    </div>
  );
}

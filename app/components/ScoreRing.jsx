'use client';
export default function ScoreRing({ value = 0, label = '', size = 110 }) {
  const clamped = Math.min(100, Math.max(0, value));
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (clamped / 100) * circumference;

  return (
    <div className="inline-block text-center relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="block mx-auto">
        <defs>
          <linearGradient id="ringGrad" x1="0%" x2="100%">
            <stop offset="0%" stopColor="#fbcfe8" />
            <stop offset="100%" stopColor="#fda4af" />
          </linearGradient>
        </defs>
        <g transform={`translate(${size / 2}, ${size / 2})`}>
          <circle r={radius} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="10" />
          <circle
            r={radius}
            fill="none"
            stroke="url(#ringGrad)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference - dash}`}
            transform="rotate(-90)"
          />
        </g>
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div>
          <div className="text-3xl font-bold text-pink-600">{clamped}</div>
          <div className="text-xs text-gray-600">{label}</div>
        </div>
      </div>
    </div>
  );
}

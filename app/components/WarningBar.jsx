'use client';
export default function WarningBar({ children }) {
  return (
    <div className="absolute left-1/2 -translate-x-1/2 bottom-3 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded-md text-sm font-semibold shadow z-30">
      {children}
    </div>
  );
}

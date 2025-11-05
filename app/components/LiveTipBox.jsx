'use client';
export default function LiveTipBox({ tip }) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center gap-3">
        <span className="text-pink-600 text-2xl">💡</span>
        Live Tip
      </h3>
      <p className="text-gray-700 text-lg min-h-[3rem] flex items-center transition-opacity duration-300">
        {tip}
      </p>
    </div>
  );
}

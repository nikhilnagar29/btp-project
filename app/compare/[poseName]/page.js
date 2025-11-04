'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Papa from 'papaparse';

export default function ComparePage() {
  const params = useParams();
  const router = useRouter();
  const [error, setError] = useState(null);
  const [poseName, setPoseName] = useState('');
  const [scores, setScores] = useState({ full_body: 0, upper_body: 0, lower_body: 0 });
  const [fps, setFps] = useState(0);
  const [status, setStatus] = useState('Initializing...');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const poseInstanceRef = useRef(null);
  const cameraRef = useRef(null);
  const referenceDataRef = useRef(null);
  const lastCheckRef = useRef(0);
  const prevTimeRef = useRef(0);
  const isActiveRef = useRef(true);

  useEffect(() => {
    isActiveRef.current = true;
    const name = decodeURIComponent(params.poseName || '');
    setPoseName(name);
    init(name);

    const onVisibility = () => {
      if (document.hidden) {
        cleanup();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      cleanup();
      isActiveRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.poseName]);

  const fetchPoseMeta = async (name) => {
    const res = await fetch(`/api/poses/${encodeURIComponent(name)}`);
    if (!res.ok) throw new Error('Pose not found');
    return res.json();
  };

  const parseCsvFlexible = (url) => new Promise((resolve, reject) => {
    // First try header=true
    Papa.parse(url, {
      download: true,
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors && results.errors.length) {
          // Fallback to headerless parse
          Papa.parse(url, {
            download: true,
            header: false,
            dynamicTyping: true,
            skipEmptyLines: true,
            complete: (results2) => {
              if (results2.errors && results2.errors.length) return reject(results2.errors[0]);
              const rows2 = results2.data;
              if (!Array.isArray(rows2) || rows2.length === 0) return reject(new Error('CSV has no rows'));
              const first = rows2[0];
              const expectedLen = SCORE_GROUPS.full_body.length;
              if (first.length !== expectedLen) return reject(new Error(`CSV row length ${first.length} != expected ${expectedLen}`));
              const keys = SCORE_GROUPS.full_body;
              const mapped = rows2.map(arr => Object.fromEntries(arr.map((v, i) => [keys[i], v])));
              resolve(mapped);
            },
            error: (e2) => reject(e2),
          });
        } else {
          resolve(results.data);
        }
      },
      error: (err) => reject(err),
    });
  });

  const ANGLE_DEFINITIONS = {
    hip_1: [12, 24, 26], hip_2: [12, 24, 23], hip_3: [23, 24, 26], hip_4: [11, 23, 25],
    hip_5: [11, 23, 24], hip_6: [24, 23, 25], knee_1: [24, 26, 28], knee_2: [23, 25, 27],
    ankle_1: [26, 28, 30], ankle_2: [26, 30, 32], ankle_3: [25, 27, 29], ankle_4: [25, 29, 31],
    ankle_5: [26, ['mid', 24, 23], 25], ankle_6: [30, ['mid', 24, 23], 29],
    arm_shoulder_1: [12, 14, 16], arm_shoulder_2: [12, 14, 18], arm_shoulder_3: [11, 13, 15], arm_shoulder_4: [11, 13, 17],
    shoulder_1: [14, 12, 11], shoulder_2: [14, 12, 24], shoulder_3: [0, 12, 24],
    shoulder_4: [['mid', 10, 9], 12, 24], shoulder_5: [13, 11, 12], shoulder_6: [13, 11, 23],
    shoulder_7: [0, 11, 23], shoulder_8: [['mid', 10, 9], 11, 23], neck_1: [0, ['mid', 11, 12], ['mid', 23, 24]],
    neck_2: [['mid', 10, 9], ['mid', 11, 12], ['mid', 23, 24]],
  };

  const SCORE_GROUPS = {
    full_body: Object.keys(ANGLE_DEFINITIONS),
    upper_body: ['arm_shoulder_1','arm_shoulder_2','arm_shoulder_3','arm_shoulder_4','shoulder_1','shoulder_2','shoulder_3','shoulder_4','shoulder_5','shoulder_6','shoulder_7','shoulder_8','neck_1','neck_2'],
    lower_body: ['hip_1','hip_2','hip_3','hip_4','hip_5','hip_6','knee_1','knee_2','ankle_1','ankle_2','ankle_3','ankle_4','ankle_5','ankle_6'],
  };

  const cosineSimilarity = (A, B) => {
    let dot = 0, normA = 0, normB = 0;
    for (let i = 0; i < A.length; i++) {
      const a = A[i] ?? 0; const b = B[i] ?? 0;
      dot += a * b; normA += a * a; normB += b * b;
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  };

  const getPoint = (landmarks, def) => {
    if (Array.isArray(def) && def[0] === 'mid') {
      const i1 = def[1]; const i2 = def[2];
      const p1 = landmarks[i1]; const p2 = landmarks[i2];
      return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
    } else {
      const p = landmarks[def];
      return { x: p.x, y: p.y };
    }
  };

  const calculateAngle = (a, b, c) => {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs((radians * 180.0) / Math.PI);
    if (angle > 180.0) angle = 360 - angle;
    return angle;
  };

  const init = async (name) => {
    setStatus('Loading pose...');
    try {
      const meta = await fetchPoseMeta(name);
      setStatus('Loading CSV...');
      const rows = await parseCsvFlexible(`/csv/${meta.csvFileName}`);

      // Validate columns
      const required = SCORE_GROUPS.full_body;
      const header = Object.keys(rows[0] || {});
      const missing = required.filter(k => !header.includes(k));
      if (missing.length) throw new Error(`CSV missing columns: ${missing.slice(0,5).join(', ')}${missing.length>5?'...':''}`);
      referenceDataRef.current = rows;

      // Camera permissions and setup
      if (!window.isSecureContext && location.hostname !== 'localhost') {
        throw new Error('Camera requires HTTPS or localhost. Please use https or run locally.');
      }

      if (videoRef.current) {
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('muted', 'true');
        videoRef.current.muted = true;
        videoRef.current.autoplay = true;
      }

      setStatus('Requesting camera...');
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
      } catch (e1) {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }
      if (!isActiveRef.current) return; // aborted
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try { await videoRef.current.play(); } catch {}
      }

      setStatus('Loading model...');
      const [poseMod, drawing, camUtils] = await Promise.all([
        import('@mediapipe/pose'),
        import('@mediapipe/drawing_utils'),
        import('@mediapipe/camera_utils'),
      ]);
      if (!isActiveRef.current) return;
      const { Pose, POSE_CONNECTIONS } = poseMod;

      const poseInstance = new Pose({ locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}` });
      poseInstance.setOptions({ modelComplexity: 1, smoothLandmarks: true, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
      poseInstance.onResults((results) => { if (!isActiveRef.current) return; drawAndScore(results, drawing, POSE_CONNECTIONS); });
      poseInstanceRef.current = poseInstance;

      const camera = new camUtils.Camera(videoRef.current, {
        onFrame: async () => { if (!isActiveRef.current) return; await poseInstance.send({ image: videoRef.current }); },
        width: 640,
        height: 480,
      });
      cameraRef.current = camera;
      camera.start();
      setStatus('Live');
    } catch (e) {
      console.error('Compare init failed', e);
      setError(e.message || 'Initialization failed');
      setStatus('Error');
    }
  };

  const cleanup = () => {
    isActiveRef.current = false;
    try { cameraRef.current?.stop?.(); } catch {}
    cameraRef.current = null;
    if (poseInstanceRef.current) { try { poseInstanceRef.current.close(); } catch {} poseInstanceRef.current = null; }
    if (videoRef.current && videoRef.current.srcObject) {
      try {
        const tracks = videoRef.current.srcObject.getTracks(); tracks.forEach(t => t.stop());
      } catch {}
      videoRef.current.srcObject = null;
    }
    const canvasEl = canvasRef.current;
    if (canvasEl) {
      const ctx = canvasEl.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
    }
  };

  const drawAndScore = (results, drawing, POSE_CONNECTIONS) => {
    const canvasEl = canvasRef.current; const videoEl = videoRef.current;
    if (!canvasEl || !videoEl) return;

    const ctx = canvasEl.getContext('2d'); if (!ctx) return;
    const vw = videoEl.videoWidth || 0; const vh = videoEl.videoHeight || 0;
    if (!vw || !vh) return;
    canvasEl.width = vw; canvasEl.height = vh;

    ctx.save(); ctx.clearRect(0, 0, canvasEl.width, canvasEl.height); ctx.drawImage(results.image, 0, 0, canvasEl.width, canvasEl.height);

    if (results.poseLandmarks) {
      try {
        drawing.drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, { color: '#22c55e', lineWidth: 4 });
        drawing.drawLandmarks(ctx, results.poseLandmarks, { color: '#3b82f6', lineWidth: 2 });
      } catch {}

      const now = performance.now() / 1000; const CHECK_INTERVAL = 0.25;
      if (now - lastCheckRef.current > CHECK_INTERVAL && referenceDataRef.current) {
        lastCheckRef.current = now;
        const lm = results.poseLandmarks;
        const current = {};
        for (const [k, def] of Object.entries(ANGLE_DEFINITIONS)) {
          try { const a = getPoint(lm, def[0]); const b = getPoint(lm, def[1]); const c = getPoint(lm, def[2]); current[k] = calculateAngle(a, b, c); } catch { current[k] = -180; }
        }
        const newScores = { full_body: 0, upper_body: 0, lower_body: 0 };
        for (const [group, angleNames] of Object.entries(SCORE_GROUPS)) {
          const refMatrix = referenceDataRef.current.map(row => angleNames.map(n => Number(row[n] ?? 0)));
          const currVec = angleNames.map(n => Number(current[n] ?? 0));
          let maxCos = 0; for (let i = 0; i < refMatrix.length; i++) { const cs = cosineSimilarity(refMatrix[i], currVec); if (cs > maxCos) maxCos = cs; }
          const oldPct = maxCos * 100; const pct = Math.max(0, (oldPct - 90) * 10); newScores[group] = Math.round(pct);
        }
        setScores(newScores);
      }
    }

    // HUD
    let y = 28; const entries = [['Full Body', scores.full_body], ['Upper Body', scores.upper_body], ['Lower Body', scores.lower_body]];
    entries.forEach(([label, val]) => { const text = `${label}: ${val}%`; ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(10, y - 18, ctx.measureText(text).width + 20, 24); ctx.fillStyle = '#fff'; ctx.font = '16px sans-serif'; ctx.fillText(text, 20, y); y += 28; });

    const t = performance.now() / 1000; const fpsNow = 1 / Math.max(1e-3, t - prevTimeRef.current); prevTimeRef.current = t; setFps(Math.round(fpsNow)); ctx.restore();
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Compare: {poseName}</h1>
          <button onClick={() => router.push(`/pose/${encodeURIComponent(poseName)}`)} className="text-gray-600 hover:text-green-600">Back to pose</button>
        </div>

        {error && (
          <div className="mb-4 p-4 rounded-lg bg-red-50 text-red-700 border border-red-200">{error}</div>
        )}
        {!error && status !== 'Live' && (
          <div className="mb-4 p-4 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">{status}</div>
        )}

        <div className="relative w-full">
          <video ref={videoRef} className="w-full rounded-lg bg-black" playsInline muted></video>
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full rounded-lg pointer-events-none"></canvas>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-600">Full Body</div>
            <div className="text-2xl font-bold text-green-600">{scores.full_body}%</div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-600">Upper Body</div>
            <div className="text-2xl font-bold text-blue-600">{scores.upper_body}%</div>
          </div>
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-600">Lower Body</div>
            <div className="text-2xl font-bold text-indigo-600">{scores.lower_body}%</div>
          </div>
        </div>
        <div className="text-xs text-gray-500 mt-2">FPS: {fps}</div>
      </div>
    </div>
  );
}

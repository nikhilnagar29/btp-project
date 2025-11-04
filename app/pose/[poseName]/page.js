'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Papa from 'papaparse';

export default function PoseDetail() {
  const params = useParams();
  const [pose, setPose] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCoaching, setIsCoaching] = useState(false);
  const [scores, setScores] = useState({ full_body: 0, upper_body: 0, lower_body: 0 });
  const [fps, setFps] = useState(0);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const poseInstanceRef = useRef(null);
  const referenceDataRef = useRef(null);
  const lastCheckRef = useRef(0);
  const prevTimeRef = useRef(0);

  useEffect(() => {
    if (params.poseName) {
      fetchPose();
    }
    // Cleanup on unmount
    return () => stopCoaching();
  }, [params.poseName]);

  const fetchPose = async () => {
    try {
      const poseName = decodeURIComponent(params.poseName);
      const response = await fetch(`/api/poses/${encodeURIComponent(poseName)}`);
      if (!response.ok) {
        throw new Error('Pose not found');
      }
      const data = await response.json();
      setPose(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadReferenceCsv = async (csvFileName) => {
    return new Promise((resolve, reject) => {
      Papa.parse(`/csv/${csvFileName}`, {
        download: true,
        header: true,
        dynamicTyping: true,
        complete: (results) => {
          if (results.errors && results.errors.length > 0) {
            reject(results.errors[0]);
          } else {
            resolve(results.data);
          }
        },
        error: (err) => reject(err),
      });
    });
  };

  const startCoaching = async () => {
    if (!pose) return;

    try {
      setIsCoaching(true);

      // Load reference CSV
      const refRows = await loadReferenceCsv(pose.csvFileName);
      referenceDataRef.current = refRows.filter(r => Object.keys(r).length > 0);

      // Check context
      if (!window.isSecureContext && location.hostname !== 'localhost') {
        throw new Error('Camera requires HTTPS or localhost. Please use https or run locally.');
      }

      // Prepare video element
      if (videoRef.current) {
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.setAttribute('muted', 'true');
        videoRef.current.muted = true;
        videoRef.current.autoplay = true;
      }

      // Request webcam with robust constraints
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
      } catch (e1) {
        // Fallback constraints
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try { await videoRef.current.play(); } catch {}
      }

      // Lazy import MediaPipe Pose and drawing utils
      const [poseMod, drawing, camUtils] = await Promise.all([
        import('@mediapipe/pose'),
        import('@mediapipe/drawing_utils'),
        import('@mediapipe/camera_utils'),
      ]);

      const { Pose, POSE_CONNECTIONS } = poseMod;

      const poseInstance = new Pose({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
      });
      poseInstance.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      poseInstance.onResults((results) => {
        drawAndScore(results, drawing, POSE_CONNECTIONS);
      });

      poseInstanceRef.current = poseInstance;

      const camera = new camUtils.Camera(videoRef.current, {
        onFrame: async () => {
          await poseInstance.send({ image: videoRef.current });
        },
        width: 640,
        height: 480,
      });
      camera.start();
    } catch (err) {
      console.error('Failed to start coaching', err);
      setIsCoaching(false);
      alert(err?.message || 'Unable to access camera or load resources.');
    }
  };

  const stopCoaching = () => {
    setIsCoaching(false);
    if (poseInstanceRef.current) {
      try { poseInstanceRef.current.close(); } catch {}
      poseInstanceRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const getPoint = (landmarks, def) => {
    if (Array.isArray(def) && def[0] === 'mid') {
      const i1 = def[1];
      const i2 = def[2];
      const p1 = landmarks[i1];
      const p2 = landmarks[i2];
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

  const drawAndScore = (results, drawing, POSE_CONNECTIONS) => {
    const canvasEl = canvasRef.current;
    const videoEl = videoRef.current;
    if (!canvasEl || !videoEl) return;

    const ctx = canvasEl.getContext('2d');
    canvasEl.width = videoEl.videoWidth;
    canvasEl.height = videoEl.videoHeight;

    ctx.save();
    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
    ctx.drawImage(results.image, 0, 0, canvasEl.width, canvasEl.height);

    if (results.poseLandmarks) {
      // draw landmarks
      drawing.drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, { color: '#22c55e', lineWidth: 4 });
      drawing.drawLandmarks(ctx, results.poseLandmarks, { color: '#3b82f6', lineWidth: 2 });

      const now = performance.now() / 1000;
      const CHECK_INTERVAL = 0.25;
      if (now - lastCheckRef.current > CHECK_INTERVAL && referenceDataRef.current) {
        lastCheckRef.current = now;
        const lm = results.poseLandmarks;

        // compute angles
        const current = {};
        for (const [k, def] of Object.entries(ANGLE_DEFINITIONS)) {
          try {
            const a = getPoint(lm, def[0]);
            const b = getPoint(lm, def[1]);
            const c = getPoint(lm, def[2]);
            current[k] = calculateAngle(a, b, c);
          } catch {
            current[k] = -180;
          }
        }

        const newScores = { full_body: 0, upper_body: 0, lower_body: 0 };
        for (const [group, angleNames] of Object.entries(SCORE_GROUPS)) {
          // build reference matrix
          const refMatrix = referenceDataRef.current.map(row => angleNames.map(n => Number(row[n] ?? 0)));
          const currVec = angleNames.map(n => Number(current[n] ?? 0));

          // compute max cosine similarity
          let maxCos = 0;
          for (let i = 0; i < refMatrix.length; i++) {
            const cs = cosineSimilarity(refMatrix[i], currVec);
            if (cs > maxCos) maxCos = cs;
          }
          const oldPct = maxCos * 100;
          const pct = Math.max(0, (oldPct - 90) * 10);
          newScores[group] = Math.round(pct);
        }
        setScores(newScores);
      }
    }

    // HUD
    let y = 28;
    const entries = [
      ['Full Body', scores.full_body],
      ['Upper Body', scores.upper_body],
      ['Lower Body', scores.lower_body],
    ];
    entries.forEach(([label, val]) => {
      const text = `${label}: ${val}%`;
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(10, y - 18, ctx.measureText(text).width + 20, 24);
      ctx.fillStyle = '#fff';
      ctx.font = '16px sans-serif';
      ctx.fillText(text, 20, y);
      y += 28;
    });

    // FPS
    const t = performance.now() / 1000;
    const fpsNow = 1 / Math.max(1e-3, t - prevTimeRef.current);
    prevTimeRef.current = t;
    setFps(Math.round(fpsNow));

    ctx.restore();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading pose details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">😔</span>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Pose Not Found</h2>
          <p className="text-gray-600 mb-8">{error}</p>
          <Link 
            href="/"
            className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:from-green-600 hover:to-blue-600 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!pose) return null;

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <Link 
          href="/"
          className="inline-flex items-center text-gray-600 hover:text-green-600 mb-8 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to All Poses
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Section */}
          <div className="space-y-6">
            <div className="aspect-square relative overflow-hidden rounded-2xl shadow-2xl">
              <Image
                src={pose.image}
                alt={pose.name}
                fill
                className="object-cover"
                priority
              />
            </div>
            
            {/* CSV Download */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Resources</h3>
              <a
                href={`/csv/${pose.csvFileName}`}
                download
                className="inline-flex items-center bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:from-green-600 hover:to-blue-600 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download CSV Guide
              </a>

              <div className="mt-4">
                <Link
                  href={`/compare/${encodeURIComponent(pose.name)}`}
                  className="inline-flex items-center bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-600 hover:to-indigo-600 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7H7m6 10H7m10-5H7" />
                  </svg>
                  Make your pose perfect
                </Link>
              </div>
            </div>

          </div>

          {/* Details Section */}
          <div className="space-y-8">
            {/* Header */}
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{pose.name}</h1>
              <p className="text-2xl text-gray-600 italic">{pose.sanskritName}</p>
            </div>

            {/* Benefits */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                <span className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-green-600">✨</span>
                </span>
                Benefits
              </h2>
              <div className="prose prose-gray max-w-none">
                <div className="text-gray-700 leading-relaxed whitespace-pre-line">{pose.benefits}</div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                <span className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-blue-600">📋</span>
                </span>
                Step-by-Step Instructions
              </h2>
              <div className="prose prose-gray max-w-none">
                <div className="text-gray-700 leading-relaxed whitespace-pre-line">{pose.instructions}</div>
              </div>
            </div>

            {/* Practice Tips */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Practice Tips</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  Hold each pose for 30 seconds to 2 minutes, depending on your level
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  Focus on your breathing throughout the pose
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  Listen to your body and don't force any position
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  Practice regularly for best results
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

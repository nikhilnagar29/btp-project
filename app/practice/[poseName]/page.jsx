'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import { fetchFullPoseData, parseCsvData, calculateScores } from './poseUtils';
import { ANGLE_TO_TIP_MAP } from './poseConstants';
import { initMediaPipe, initCamera, drawPose, drawHud } from './mediaPipeUtils';

import LoadingOverlay from '../../components/LoadingOverlay';
import ScoreRing from '../../components/ScoreRing';
import WarningBar from '../../components/WarningBar';
import LiveTipBox from '../../components/LiveTipBox';

export default function PracticePage() {
  const params = useParams();
  const router = useRouter();

  const [pose, setPose] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isCameraStarting, setIsCameraStarting] = useState(true);
  const [scores, setScores] = useState({ full_body: 0, upper_body: 0, lower_body: 0 });
  const [feedbackList, setFeedbackList] = useState([]);
  const [displayFeedback, setDisplayFeedback] = useState('Hold pose to get feedback.');
  const [warning, setWarning] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const poseInstanceRef = useRef(null);
  const cameraRef = useRef(null);
  const referenceDataRef = useRef([]);
  const highlightLandmarksRef = useRef([]);
  const feedbackIndexRef = useRef(0);
  const feedbackTimerRef = useRef(null);
  const lastCheckRef = useRef(0);
  const prevTimeRef = useRef(0);
  const noPoseCountRef = useRef(0);

  // Load pose + CSV
  useEffect(() => {
    const load = async () => {
      try {
        const poseName = decodeURIComponent(params?.poseName);
        const data = await fetchFullPoseData(poseName);
        setPose(data);
        const parsed = await parseCsvData(data.csvData);
        referenceDataRef.current = parsed.filter(r => Object.keys(r).length > 0);
      } catch (e) {
        setError(e?.message || 'Failed to load pose');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params?.poseName]);

  // Start camera immediately
  useEffect(() => {
    if (!pose || !referenceDataRef.current?.length) return;
    const start = async () => {
      try {
        poseInstanceRef.current = await initMediaPipe(onPoseResults);
        cameraRef.current = await initCamera(videoRef, poseInstanceRef.current);
        setFeedbackList(['Hold your pose to get real-time feedback.']);
      } catch (err) {
        console.error('Camera error', err);
        setWarning('Camera permission denied or unavailable');
      } finally {
        setIsCameraStarting(false);
      }
    };
    start();

    return () => {
      try { cameraRef.current?.stop?.(); } catch {}
      cameraRef.current = null;
      try { poseInstanceRef.current?.close?.(); } catch {}
      poseInstanceRef.current = null;
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
        videoRef.current.srcObject = null;
      }
      clearInterval(feedbackTimerRef.current);
    };
  }, [pose]);

  // Cycle live tips
  useEffect(() => {
    clearInterval(feedbackTimerRef.current);
    feedbackIndexRef.current = 0;
    if (feedbackList.length > 0) {
      setDisplayFeedback(feedbackList[0]);
      if (feedbackList.length > 1) {
        feedbackTimerRef.current = setInterval(() => {
          feedbackIndexRef.current = (feedbackIndexRef.current + 1) % feedbackList.length;
          setDisplayFeedback(feedbackList[feedbackIndexRef.current]);
        }, 2000);
      }
    } else if (scores.full_body > 95) {
      setDisplayFeedback('Excellent Form! Hold it.');
    } else {
      setDisplayFeedback('Hold your pose to get feedback.');
    }
    return () => clearInterval(feedbackTimerRef.current);
  }, [feedbackList, scores.full_body]);

  // Pose results
  const onPoseResults = (results, drawing, POSE_CONNECTIONS) => {
    const canvasEl = canvasRef.current;
    const ctx = canvasEl?.getContext('2d');
    const videoEl = videoRef.current;
    if (!canvasEl || !ctx || !videoEl || !videoEl.videoWidth) return;

    // Desktop → prefer 16:9; Mobile → auto (your “16:9 OR auto”)
    const preferSixteenNine = window.innerWidth >= 1024;
    if (preferSixteenNine) {
      const width = videoEl.videoWidth;
      const height = Math.round((width * 9) / 16);
      canvasEl.width = width;
      canvasEl.height = height;
    } else {
      canvasEl.width = videoEl.videoWidth;
      canvasEl.height = videoEl.videoHeight;
    }

    let currentHighlights = highlightLandmarksRef.current;

    if (results?.poseLandmarks) {
      noPoseCountRef.current = 0;
      const now = performance.now();
      const CHECK_INTERVAL = 250;
      if (now - lastCheckRef.current > CHECK_INTERVAL) {
        lastCheckRef.current = now;
        const { scores: newScores, worstAngles } = calculateScores(
          results.poseLandmarks,
          referenceDataRef.current
        );
        setScores(newScores);
        const newFeedback = worstAngles.map(a => ANGLE_TO_TIP_MAP[a].tip);
        setFeedbackList(newFeedback);
        const newHighlights = worstAngles.map(a => ANGLE_TO_TIP_MAP[a].landmarkIndex);
        highlightLandmarksRef.current = newHighlights;
        currentHighlights = newHighlights;
        if (newScores.full_body > 35) setWarning(null);
      }
    } else {
      noPoseCountRef.current += 1;
      if (noPoseCountRef.current > 6) setWarning('Move back — full body not detected');
    }

    drawPose(ctx, results, drawing, POSE_CONNECTIONS, currentHighlights);

    const t = performance.now() / 1000;
    const fps = 1 / Math.max(1e-3, t - prevTimeRef.current);
    prevTimeRef.current = t;
    drawHud(ctx, Math.round(fps));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pink-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-400 mx-auto"></div>
          <p className="mt-4 text-pink-700 font-medium">Loading practice…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-lg text-gray-700">{error}</p>
        <Link
          href={`/pose/${params?.poseName}`}
          className="inline-flex bg-pink-600 text-white px-5 py-2.5 rounded-lg shadow hover:bg-pink-700"
        >
          Back to pose
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pink-50">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
        <div className="flex items-center gap-3 mb-4">
          <Link href={`/pose/${params?.poseName}`} className="text-pink-600 hover:text-pink-700">
            ← {pose?.name || 'Back'}
          </Link>
          <span className="ml-auto inline-flex items-center rounded-full bg-white/80 px-3 py-1 text-sm font-semibold text-pink-700 shadow">
            Coach Mode
          </span>
        </div>

        {/* 75% / 25% */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8 items-start">
          {/* Left: Video (3/4) */}
          <div className="lg:col-span-3">
            <div className="relative rounded-2xl shadow-2xl overflow-hidden bg-black border border-white/10">
              <div className="relative w-full lg:h-[calc(100vh-180px)]">
                <div className="absolute inset-0">
                  <video ref={videoRef} className=" object-cover" playsInline muted />
                  <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />
                </div>

                <LoadingOverlay show={isCameraStarting} label="Starting camera — please allow access" />
                {warning && <WarningBar>{warning}</WarningBar>}

                <div className="absolute top-3 left-3 bg-white/80 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-semibold text-pink-700">
                  COACH
                </div>
              </div>
            </div>
          </div>

          {/* Right: Analysis (1/4) */}
          <aside className="lg:col-span-1 space-y-6">
            <LiveTipBox tip={displayFeedback} />

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center gap-4">
                <ScoreRing value={Math.round(scores.full_body)} label="Overall" />
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <div className="bg-pink-50 rounded-lg p-3 text-center">
                    <div className="text-sm font-medium text-gray-700">Upper</div>
                    <div className="text-2xl font-bold text-pink-600">{scores.upper_body}%</div>
                  </div>
                  <div className="bg-pink-50 rounded-lg p-3 text-center">
                    <div className="text-sm font-medium text-gray-700">Lower</div>
                    <div className="text-2xl font-bold text-pink-600">{scores.lower_body}%</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Session</h4>
              <div className="flex gap-2">
                <button
                  onClick={() => router.replace(`/pose/${params?.poseName}`)}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-white border border-pink-200 text-pink-700 px-4 py-2 rounded-lg font-semibold hover:bg-pink-50"
                >
                  Stop
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

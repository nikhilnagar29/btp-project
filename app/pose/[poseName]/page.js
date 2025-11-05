'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { fetchFullPoseData, parseCsvData, calculateScores } from './poseUtils';
import { ANGLE_TO_TIP_MAP } from './poseConstants'; 
import { initMediaPipe, initCamera, drawPose, drawHud } from './mediaPipeUtils';

export default function PoseDetail() {
  const params = useParams();
  const [pose, setPose] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCoaching, setIsCoaching] = useState(false);
  const [scores, setScores] = useState({ full_body: 0, upper_body: 0, lower_body: 0 });

  const [feedbackList, setFeedbackList] = useState([]);
  const [displayFeedback, setDisplayFeedback] = useState('Hold pose to get feedback.');
  
  // --- THIS IS THE KEY FIX for flickering dots ---
  // We use a ref to store the highlights. Refs are updated immediately
  // and can be read inside the 30fps `onPoseResults` callback.
  const highlightLandmarksRef = useRef([]);
  // --- END OF KEY FIX ---

  const feedbackIndexRef = useRef(0);
  const feedbackTimerRef = useRef(null);

  // Refs
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const poseInstanceRef = useRef(null);
  const cameraRef = useRef(null);
  const referenceDataRef = useRef(null);
  const lastCheckRef = useRef(0);
  const prevTimeRef = useRef(0); // For FPS calculation

  // --- Data Fetching (no changes) ---
  useEffect(() => {
    if (params.poseName) {
      const poseName = decodeURIComponent(params.poseName);
      fetchFullPoseData(poseName)
        .then(data => {
          setPose(data);
          return parseCsvData(data.csvData);
        })
        .then(parsedData => {
          referenceDataRef.current = parsedData.filter(r => Object.keys(r).length > 0);
        })
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    }
    return () => stopCoaching();
  }, [params.poseName]);

  // --- Feedback cycling logic (This is correct) ---
  useEffect(() => {
    clearInterval(feedbackTimerRef.current);
    feedbackIndexRef.current = 0;

    if (feedbackList.length > 0) {
      setDisplayFeedback(feedbackList[0]);
      if (feedbackList.length > 1) {
        feedbackTimerRef.current = setInterval(() => {
          feedbackIndexRef.current = (feedbackIndexRef.current + 1) % feedbackList.length;
          setDisplayFeedback(feedbackList[feedbackIndexRef.current]);
        }, 2000); // Cycle every 2 seconds
      }
    } else if (scores.full_body > 95) {
        setDisplayFeedback('Excellent Form! Hold it.');
    } else {
        setDisplayFeedback('Hold your pose to get feedback.');
    }

    return () => clearInterval(feedbackTimerRef.current);
  }, [feedbackList, scores.full_body]);


  // --- MediaPipe Logic ---
  const startCoaching = async () => {
    if (!pose || !referenceDataRef.current) return alert('Pose data is not loaded yet.');
    try {
      setIsCoaching(true);
      setFeedbackList(['Initializing camera...']);
      setTimeout(async () => {
        poseInstanceRef.current = await initMediaPipe(onPoseResults);
        cameraRef.current = await initCamera(videoRef, poseInstanceRef.current);
        setFeedbackList(['Hold your pose to get real-time feedback.']);
      }, 100);
    } catch (err) {
      console.error('Failed to start coaching', err);
      setIsCoaching(false);
      alert(err?.message || 'Unable to access camera or load resources.');
    }
  };

  const stopCoaching = () => {
    setIsCoaching(false);
    setFeedbackList([]);
    highlightLandmarksRef.current = []; // Reset the ref
    clearInterval(feedbackTimerRef.current);
    try { cameraRef.current?.stop?.(); } catch {}
    cameraRef.current = null;
    if (poseInstanceRef.current) {
      try { poseInstanceRef.current.close(); } catch {}
      poseInstanceRef.current = null;
    }
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const onPoseResults = (results, drawing, POSE_CONNECTIONS) => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;
    const ctx = canvasEl.getContext('2d');
    if (!ctx) return;

    const videoEl = videoRef.current;
    if (!videoEl || !videoEl.videoWidth) return;
    canvasEl.width = videoEl.videoWidth;
    canvasEl.height = videoEl.videoHeight;
    
    // --- UPDATED LOGIC ---
    // We get the highlights from the ref so it's always up to date.
    let currentHighlights = highlightLandmarksRef.current;
    
    if (results.poseLandmarks) {
      const now = performance.now();
      const CHECK_INTERVAL = 250; // ms
      
      if (now - lastCheckRef.current > CHECK_INTERVAL) {
        lastCheckRef.current = now;
        
        const { scores: newScores, worstAngles } = calculateScores(
          results.poseLandmarks,
          referenceDataRef.current
        );
        setScores(newScores); // Update React UI
        
        // This list will be used by the 2-second text cycler
        const newFeedback = worstAngles.map(angle => ANGLE_TO_TIP_MAP[angle].tip);
        setFeedbackList(newFeedback);
        
        // This list is updated instantly for the drawing loop
        const newHighlights = worstAngles.map(angle => ANGLE_TO_TIP_MAP[angle].landmarkIndex);
        highlightLandmarksRef.current = newHighlights;
        currentHighlights = newHighlights;
      }
    }
    
    // Pass the persistent highlights to drawPose
    drawPose(ctx, results, drawing, POSE_CONNECTIONS, currentHighlights);
    
    const t = performance.now() / 1000;
    const currentFps = 1 / Math.max(1e-3, t - prevTimeRef.current);
    prevTimeRef.current = t;
    const roundedFps = Math.round(currentFps);

    // Draw JUST the FPS
    drawHud(ctx, roundedFps);
  };

  // --- Render Logic (Loading/Error are unchanged) ---
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
          <Link href="/" className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:from-green-600 hover:to-blue-600 transition-all duration-200 shadow-md hover:shadow-lg">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!pose) return null;
  
  // --- Main JSX ---
  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <Link href="/" className="inline-flex items-center text-gray-600 hover:text-green-600 mb-8 transition-colors">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to All Poses
        </Link>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* --- Left Column (Video / Image) --- */}
          <div className="space-y-6">
            {isCoaching ? (
              <>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">{pose.name}</h1>
                  <p className="text-2xl text-gray-600 italic">{pose.sanskritName}</p>
                </div>
                {/* --- VIDEO CONTAINER --- */}
                <div className="relative aspect-video rounded-2xl shadow-2xl overflow-hidden bg-gray-900">
                  <video 
                    ref={videoRef} 
                    className="w-full h-full object-cover" 
                    playsInline 
                    muted 
                  />
                  <canvas 
                    ref={canvasRef} 
                    className="absolute inset-0 w-full h-full pointer-events-none" 
                  />
                </div>
              </>
            ) : (
              <div className="aspect-square relative overflow-hidden rounded-2xl shadow-2xl">
                <Image
                  src={pose.image}
                  alt={pose.name}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            )}
            
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              {isCoaching ? (
                <button onClick={stopCoaching} className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-8 py-3 rounded-lg font-medium hover:from-red-600 hover:to-pink-600 transition-all duration-200 shadow-md hover:shadow-lg inline-flex items-center justify-center w-full">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" /></svg>
                  Stop Practice
                </button>
              ) : (
                <>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Ready to Practice?</h3>
                  <button onClick={startCoaching} className="inline-flex items-center justify-center bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-600 hover:to-indigo-600 transition-all duration-200 shadow-md hover:shadow-lg w-full">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M4 18h11a1 1 0 001-1V7a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1z" /></svg>
                    Make your pose perfect
                  </button>
                </>
              )}
            </div>
          </div>

          {/* --- Right Column (Details / Feedback) --- */}
          <div className="space-y-8">
            {isCoaching ? (
              <>
                <h2 className="text-3xl font-bold text-gray-900">Real-time Feedback</h2>
                
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                    <span className="text-blue-600 mr-2 text-2xl">💡</span>
                    Live Tip
                  </h3>
                  {/* This text will now cycle every 2 seconds */}
                  <p className="text-gray-700 text-lg h-12 flex items-center transition-opacity duration-300">
                    {displayFeedback}
                  </p>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Full Body Score</h3>
                  <div className="text-center">
                    <div className="inline-block relative">
                      <span className="text-6xl font-bold text-green-600">{scores.full_body}</span>
                      <span className="text-2xl font-bold text-green-600 align-top">%</span>
                    </div>
                    <p className="text-gray-600 mt-2">Overall form accuracy</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Upper Body</h4>
                    <span className="text-4xl font-bold text-blue-600">{scores.upper_body}%</span>
                  </div>
                  <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Lower Body</h4>
                    <span className="text-4xl font-bold text-indigo-600">{scores.lower_body}%</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">{pose.name}</h1>
                  <p className="text-2xl text-gray-600 italic">{pose.sanskritName}</p>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="text-green-600 mr-3 text-2xl">✨</span> Benefits
                  </h2>
                  <div className="prose prose-gray max-w-none">
                    <div className="text-gray-700 leading-relaxed whitespace-pre-line">{pose.benefits}</div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="text-blue-600 mr-3 text-2xl">📋</span> Step-by-Step Instructions
                  </h2>
                  <div className="prose prose-gray max-w-none">
                    <div className="text-gray-700 leading-relaxed whitespace-pre-line">{pose.instructions}</div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
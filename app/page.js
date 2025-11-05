'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  const [poses, setPoses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPoses();
  }, []);

  const fetchPoses = async () => {
    try {
      const response = await fetch('/api/poses');
      const data = await response.json();
      setPoses(data);
    } catch (error) {
      console.error('Error fetching poses:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      // Updated Loading Spinner color to pink
      <div className="min-h-screen flex items-center justify-center bg-pink-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
          <p className="mt-4 text-pink-700">Loading yoga poses...</p>
        </div>
      </div>
    );
  }

  return (
    // 1. REMOVED 'min-h-screen' from this div
    <div className="py-8 bg-pink-100 px-8 sm:px-12 lg:px-16">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Discover Your
            {/* 2. Updated Gradient Text to pink/purple */}
            <span className="bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent"> Inner Peace</span>
          </h1>
          <p className="text-xl text-gray-700 mb-8 max-w-3xl mx-auto">
            Explore our collection of yoga poses with detailed guidance, benefits, and step-by-step instructions to enhance your practice.
          </p>
        </div>
      </div>

      {/* Yoga Poses Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {poses.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <span className="text-4xl">🧘‍♀️</span>
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">No Yoga Poses Yet</h3>
            <p className="text-gray-700 mb-8">Start by adding some yoga poses through the admin panel.</p>
            {/* 3. Updated Button Gradient */}
            <Link 
              href="/admin"
              className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-3 rounded-lg font-medium hover:from-pink-600 hover:to-purple-600 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Add Your First Pose
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Yoga Poses</h2>
              <p className="text-gray-700">Click on any pose to learn more about it</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {poses.map((pose) => (
                <Link 
                  key={pose._id} 
                  href={`/pose/${encodeURIComponent(pose.name)}`}
                  className="group"
                >
                  <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group-hover:scale-105">
                    <div className="aspect-square relative overflow-hidden">
                      <div className="relative w-full aspect-square overflow-hidden rounded-2xl">
                        <img
                          src={pose.image}
                          alt={pose.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-all"></div>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    
                    <div className="p-6">
                      {/* 4. Updated Hover Color */}
                      <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-pink-600 transition-colors">
                        {pose.name}
                      </h3>
                      <p className="text-gray-600 text-sm italic mb-3">
                        {pose.sanskritName}
                      </p>
                      {/* 5. Updated Text Color */}
                      <div className="flex items-center text-pink-600 font-medium">
                        <span>Learn More</span>
                        <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
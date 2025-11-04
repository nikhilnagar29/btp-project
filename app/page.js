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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading yoga poses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Discover Your
            <span className="bg-gradient-to-r from-green-500 to-blue-500 bg-clip-text text-transparent"> Inner Peace</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Explore our collection of yoga poses with detailed guidance, benefits, and step-by-step instructions to enhance your practice.
          </p>
        </div>
      </div>

      {/* Yoga Poses Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {poses.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🧘‍♀️</span>
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">No Yoga Poses Yet</h3>
            <p className="text-gray-600 mb-8">Start by adding some yoga poses through the admin panel.</p>
            <Link 
              href="/admin"
              className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:from-green-600 hover:to-blue-600 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Add Your First Pose
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Yoga Poses</h2>
              <p className="text-gray-600">Click on any pose to learn more about it</p>
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
                      <Image
                        src={pose.image}
                        alt={pose.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                    
                    <div className="p-6">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">
                        {pose.name}
                      </h3>
                      <p className="text-gray-600 text-sm italic mb-3">
                        {pose.sanskritName}
                      </p>
                      <div className="flex items-center text-green-600 font-medium">
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

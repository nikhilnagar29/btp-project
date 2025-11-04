'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    sanskritName: '',
    image: '',
    benefits: '',
    instructions: '',
    csvFileName: ''
  });
  const [csvFile, setCsvFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
      setFormData(prev => ({
        ...prev,
        csvFileName: file.name
      }));
    } else {
      alert('Please select a CSV file');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      // We will send everything in one FormData object
      const fullFormData = new FormData();
      
      // Append all text fields
      fullFormData.append('name', formData.name);
      fullFormData.append('sanskritName', formData.sanskritName);
      fullFormData.append('image', formData.image);
      fullFormData.append('benefits', formData.benefits);
      fullFormData.append('instructions', formData.instructions);

      // Append the file if it exists
      if (csvFile) {
        fullFormData.append('file', csvFile);
      } else {
        // You might want to make the CSV required
        throw new Error('CSV file is required');
      }

      // Then create the pose
      const response = await fetch('/api/poses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: fullFormData,
      });

      if (response.ok) {
        setMessage('Yoga pose and CSV data added successfully!');
        setFormData({
          name: '',
          sanskritName: '',
          image: '',
          benefits: '',
          instructions: '',
          csvFileName: ''
        });
        setCsvFile(null);
        document.getElementById('csvFile').value = '';
        
        // Redirect to home page after 2 seconds
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add pose');
      }
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Admin Panel</h1>
          <p className="text-xl text-gray-600">Add new yoga poses to the platform</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.includes('Error') 
                ? 'bg-red-50 text-red-700 border border-red-200' 
                : 'bg-green-50 text-green-700 border border-green-200'
            }`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pose Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Pose Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border text-gray-700 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                  placeholder="e.g., Downward Dog"
                />
              </div>

              {/* Sanskrit Name */}
              <div>
                <label htmlFor="sanskritName" className="block text-sm font-medium text-gray-700 mb-2">
                  Sanskrit Name *
                </label>
                <input
                  type="text"
                  id="sanskritName"
                  name="sanskritName"
                  value={formData.sanskritName}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border text-gray-700 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                  placeholder="e.g., Adho Mukha Svanasana"
                />
              </div>
            </div>

            {/* Image URL */}
            <div>
              <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">
                Image URL *
              </label>
              <input
                type="url"
                id="image"
                name="image"
                value={formData.image}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border text-gray-700 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
                placeholder="https://example.com/yoga-pose-image.jpg"
              />
            </div>

            {/* Benefits */}
            <div>
              <label htmlFor="benefits" className="block text-sm font-medium text-gray-700 mb-2">
                Benefits *
              </label>
              <textarea
                id="benefits"
                name="benefits"
                value={formData.benefits}
                onChange={handleInputChange}
                required
                rows={4}
                className="w-full px-4 py-3 border text-gray-700 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors resize-none"
                placeholder="Describe the benefits of this yoga pose..."
              />
            </div>

            {/* Instructions */}
            <div>
              <label htmlFor="instructions" className="block text-sm font-medium text-gray-700 mb-2">
                Step-by-Step Instructions *
              </label>
              <textarea
                id="instructions"
                name="instructions"
                value={formData.instructions}
                onChange={handleInputChange}
                required
                rows={6}
                className="w-full px-4 py-3 border text-gray-700 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors resize-none"
                placeholder="Provide detailed step-by-step instructions for performing this pose..."
              />
            </div>

            {/* CSV File Upload */}
            <div>
              <label htmlFor="csvFile" className="block text-sm font-medium text-gray-700 mb-2">
                CSV File (Optional)
              </label>
              <input
                type="file"
                id="csvFile"
                accept=".csv"
                onChange={handleFileChange}
                className="w-full px-4 py-3 border text-gray-700 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
              />
              <p className="mt-2 text-sm text-gray-500">
                Upload a CSV file with additional pose information
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-8 py-4 rounded-lg font-medium hover:from-green-600 hover:to-blue-600 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Adding Pose...
                  </>
                ) : (
                  'Add Yoga Pose'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Preview Section */}
        {formData.image && (
          <div className="mt-12 bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Preview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="aspect-square relative overflow-hidden rounded-xl shadow-lg">
                <img
                  src={formData.image}
                  alt={formData.name || 'Preview'}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{formData.name || 'Pose Name'}</h3>
                  <p className="text-gray-600 italic">{formData.sanskritName || 'Sanskrit Name'}</p>
                </div>
                {formData.benefits && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Benefits:</h4>
                    <p className="text-gray-700 text-sm">{formData.benefits}</p>
                  </div>
                )}
                {formData.instructions && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Instructions:</h4>
                    <p className="text-gray-700 text-sm">{formData.instructions}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

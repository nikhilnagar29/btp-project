import Link from 'next/link';
import './globals.css';

export const metadata = {
  title: 'Perfect Yoga Platform',
  description: 'Discover and practice yoga poses with detailed guidance',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      {/* 1. Add 'flex flex-col' to the body */}
      <body className="min-h-screen bg-pink-50 text-gray-900 flex flex-col">
        <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-lg shadow-sm border-b border-pink-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Link href="/" className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">🧘</span>
                  </div>
                  <span className="text-xl font-bold text-gray-800">Perfect Yoga</span>
                </Link>
              </div>
              
              <div className="flex items-center space-x-4">
                <Link 
                  href="/" 
                  className="text-gray-700 hover:text-pink-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Home
                </Link>
                <Link 
                  href="/admin" 
                  className="bg-gradient-to-r from-pink-500 to-purple-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-pink-600 hover:to-purple-600 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Admin Panel
                </Link>
              </div>
            </div>
          </div>
        </nav>
        
        {/* 2. Add 'flex-grow' to main */}
        <main className="flex-grow">
          {children}
        </main>
        
        <footer className="bg-gradient-to-r from-slate-800 via-blue-900 to-indigo-900 text-white py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-blue-200">
              © 2024 Perfect Yoga Platform. Find your inner peace through yoga.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
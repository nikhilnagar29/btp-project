import Link from 'next/link';
import './globals.css';

export const metadata = {
  title: 'Perfect Yoga Platform',
  description: 'Discover and practice yoga poses with detailed guidance',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <nav className="bg-gradient-to-r from-white via-blue-50 to-indigo-50 shadow-lg border-b border-blue-200 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Link href="/" className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">🧘</span>
                  </div>
                  <span className="text-xl font-bold text-gray-800">Perfect Yoga</span>
                </Link>
              </div>
              
              <div className="flex items-center space-x-4">
                <Link 
                  href="/" 
                  className="text-gray-700 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Home
                </Link>
                <Link 
                  href="/admin" 
                  className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-green-600 hover:to-blue-600 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Admin Panel
                </Link>
              </div>
            </div>
          </div>
        </nav>
        
        <main className="min-h-screen">
          {children}
        </main>
        
        <footer className="bg-gradient-to-r from-slate-800 via-blue-900 to-indigo-900 text-white py-8 mt-16">
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

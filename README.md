# Perfect Yoga Platform

A beautiful and modern yoga platform built with Next.js, MongoDB, and Tailwind CSS. This platform allows admins to add yoga poses with detailed information, and users can browse and learn about different poses.

## Features

- 🧘‍♀️ **Beautiful Home Page**: Display all yoga poses in an elegant grid layout
- 📖 **Detailed Pose Pages**: View comprehensive information about each pose including benefits and step-by-step instructions
- 👨‍💼 **Admin Panel**: Add new yoga poses without authentication (prototype-friendly)
- 📁 **CSV File Support**: Upload and download CSV files with additional pose information
- 🎨 **Modern UI**: Beautiful design with Tailwind CSS and smooth animations
- 🗄️ **MongoDB Integration**: Persistent storage for all pose data

## Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose
- **File Storage**: Local file system for CSV files

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set up MongoDB

#### Option A: Local MongoDB

1. Install MongoDB locally
2. Start MongoDB service
3. Create a `.env.local` file in the root directory with:

```
MONGODB_URI=mongodb://localhost:27017/yoga-platform
```

#### Option B: MongoDB Atlas (Cloud)

1. Create a MongoDB Atlas account
2. Create a new cluster
3. Get your connection string
4. Create a `.env.local` file with:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/yoga-platform?retryWrites=true&w=majority
```

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Usage

### For Users

1. **Home Page (`/`)**: Browse all available yoga poses
2. **Pose Details (`/pose/[poseName]`)**: Click on any pose to view detailed information including:
   - Pose image
   - Benefits
   - Step-by-step instructions
   - Sanskrit name
   - CSV file download

### For Admins

1. **Admin Panel (`/admin`)**: Add new yoga poses with:
   - Pose name (English)
   - Sanskrit name
   - Image URL
   - Benefits description
   - Step-by-step instructions
   - Optional CSV file upload

## File Structure

```
perfect-yoga/
├── app/
│   ├── api/
│   │   ├── poses/
│   │   │   ├── route.js          # GET all poses, POST new pose
│   │   │   └── [poseName]/
│   │   │       └── route.js       # GET specific pose
│   │   └── upload/
│   │       └── route.js           # CSV file upload
│   ├── admin/
│   │   └── page.js               # Admin panel
│   ├── pose/
│   │   └── [poseName]/
│   │       └── page.js            # Pose detail page
│   ├── layout.js                 # Root layout with navigation
│   └── page.js                   # Home page
├── lib/
│   └── mongodb.js                # MongoDB connection
├── models/
│   └── YogaPose.js               # Mongoose schema
├── public/
│   └── csv/                      # CSV files storage
└── package.json
```

## API Endpoints

- `GET /api/poses` - Get all yoga poses
- `POST /api/poses` - Create a new yoga pose
- `GET /api/poses/[poseName]` - Get a specific yoga pose
- `POST /api/upload` - Upload CSV file

## Database Schema

```javascript
{
  name: String,           // English name of the pose
  sanskritName: String,   // Sanskrit name
  image: String,          // Image URL
  benefits: String,       // Benefits description
  instructions: String,   // Step-by-step instructions
  csvFileName: String,    // Name of uploaded CSV file
  createdAt: Date         // Creation timestamp
}
```

## Contributing

This is a prototype project. Feel free to:

- Add more features
- Improve the UI/UX
- Add authentication
- Implement pose categories
- Add user favorites

## License

This project is open source and available under the MIT License.
# btp-project
# btp-project

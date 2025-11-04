#!/bin/bash

echo "🧘 Setting up Perfect Yoga Platform..."

# Create .env.local file if it doesn't exist
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    cat > .env.local << EOF
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/yoga-platform

# If you're using MongoDB Atlas, replace the above with your Atlas connection string:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/yoga-platform?retryWrites=true&w=majority
EOF
    echo "✅ .env.local file created!"
else
    echo "✅ .env.local file already exists"
fi

# Create csv directory if it doesn't exist
if [ ! -d "public/csv" ]; then
    echo "📁 Creating public/csv directory..."
    mkdir -p public/csv
    echo "✅ CSV directory created!"
else
    echo "✅ CSV directory already exists"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Make sure MongoDB is running locally, OR"
echo "2. Update MONGODB_URI in .env.local with your MongoDB Atlas connection string"
echo "3. Run: npm run dev"
echo "4. Open: http://localhost:3000"
echo ""
echo "Happy yoga practicing! 🧘‍♀️"

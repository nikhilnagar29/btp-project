import { NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import YogaPose from '../../../models/YogaPose';

export async function GET() {
  try {
    await connectDB();
    const poses = await YogaPose.find({}).select('-csvData').sort({ createdAt: -1 });
    return NextResponse.json(poses);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch poses' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const data = await request.formData()
    
    // Get the file and text fields from FormData
    const file = data.get('file');
    const name = data.get('name');
    const sanskritName = data.get('sanskritName');
    const image = data.get('image');
    const benefits = data.get('benefits');
    const instructions = data.get('instructions');

    if (!file || !name || !sanskritName || !image || !benefits || !instructions) {
      return NextResponse.json({ error: 'All fields, including CSV file, are required' }, { status: 400 });
    }
    
    
    
    // Read the file content
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const csvData = buffer.toString('utf-8'); // This is the text content of the CSV
    const csvFileName = file.name; // Get the file name

    const pose = new YogaPose({
      name,
      sanskritName,
      image,
      benefits,
      instructions,
      csvFileName,
      csvData // Save the CSV content to the new field
    });
    
    await pose.save();
    
    return NextResponse.json(pose, { status: 201 });
  } catch (error) {
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Pose with this name already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create pose' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import YogaPose from '../../../models/YogaPose';

export async function GET() {
  try {
    await connectDB();
    const poses = await YogaPose.find({}).sort({ createdAt: -1 });
    return NextResponse.json(poses);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch poses' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    
    const { name, sanskritName, image, benefits, instructions, csvFileName } = body;
    
    if (!name || !sanskritName || !image || !benefits || !instructions || !csvFileName) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }
    
    const pose = new YogaPose({
      name,
      sanskritName,
      image,
      benefits,
      instructions,
      csvFileName
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

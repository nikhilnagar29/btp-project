import { NextResponse } from 'next/server';
import connectDB from '../../../../lib/mongodb';
import YogaPose from '../../../../models/YogaPose';

export async function GET(request, { params }) {
  try {
    await connectDB();
    const { poseName } = await params;
    
    const pose = await YogaPose.findOne({ name: poseName });
    
    if (!pose) {
      return NextResponse.json({ error: 'Pose not found' }, { status: 404 });
    }
    
    return NextResponse.json(pose);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch pose' }, { status: 500 });
  }
}

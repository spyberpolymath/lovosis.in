import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import NavbarCategory from '@/app/models/NavbarCategory';
import File from '@/app/models/File';

export async function GET() {
  await connectDB();
  const categories = await NavbarCategory.find({}).sort({ name: 1 });
  return NextResponse.json(categories);
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const data = await request.json();
    
    // If the image is a file ID from the upload endpoint, keep it as is
    if (data.image && !data.image.startsWith('/api/files/')) {
      const file = await File.findById(data.image);
      if (file) {
        data.image = `/api/files/${file._id}`;
      }
    }

    const navbarCategory = await NavbarCategory.create(data);
    return NextResponse.json(navbarCategory);
  } catch (error) {
    console.error('Error creating navbar category:', error);
    return NextResponse.json(
      { error: 'Failed to create navbar category' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  await connectDB();
  const { _id, ...data } = await request.json();
  const category = await NavbarCategory.findByIdAndUpdate(_id, data, { new: true });
  return NextResponse.json(category);
}

export async function DELETE(request: Request) {
  await connectDB();
  const { _id } = await request.json();
  await NavbarCategory.findByIdAndDelete(_id);
  return NextResponse.json({ message: 'Category deleted successfully' });
}
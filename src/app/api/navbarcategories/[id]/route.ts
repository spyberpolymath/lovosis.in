import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import NavbarCategory from '@/app/models/NavbarCategory';
import File from '@/app/models/File';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  await connectDB();
  const category = await NavbarCategory.findById(params.id);
  return NextResponse.json(category);
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  await connectDB();
  const body = await request.json();
  const category = await NavbarCategory.findByIdAndUpdate(params.id, body, { new: true });
  return NextResponse.json(category);
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    
    const navbarCategory = await NavbarCategory.findById(params.id);
    
    if (!navbarCategory) {
      return NextResponse.json(
        { error: 'Navbar category not found' },
        { status: 404 }
      );
    }
    
    await NavbarCategory.findByIdAndDelete(params.id);
    
    if (navbarCategory.image && navbarCategory.image.startsWith('/api/files/')) {
      const fileId = navbarCategory.image.split('/').pop();
      if (fileId) {
        await File.findByIdAndDelete(fileId);
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json(
      { error: 'Failed to delete navbar category' },
      { status: 500 }
    );
  }
}

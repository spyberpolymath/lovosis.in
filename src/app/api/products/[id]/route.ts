import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Product from '@/app/models/Product';
import mongoose from 'mongoose';
import File from '@/app/models/File';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const product = await Product.findById(params.id).populate('navbarCategoryId');

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const data = await request.json();
    console.log('Update request data:', data); // Add logging to see incoming data

    // Validate navbarCategoryId if it's being updated
    if (data.navbarCategoryId && !mongoose.Types.ObjectId.isValid(data.navbarCategoryId)) {
      return NextResponse.json(
        { error: 'Invalid navbarCategoryId' },
        { status: 400 }
      );
    }

    // Optional validation for categoryId if it's being updated
    if (data.categoryId && !mongoose.Types.ObjectId.isValid(data.categoryId)) {
      return NextResponse.json(
        { error: 'Invalid categoryId' },
        { status: 400 }
      );
    }

    // FIX: Remove empty subcategoryId to prevent MongoDB casting error
    if (data.subcategoryId === '') {
      data.subcategoryId = undefined;  // Set to undefined so MongoDB will ignore it
    } else if (data.subcategoryId && !mongoose.Types.ObjectId.isValid(data.subcategoryId)) {
      return NextResponse.json(
        { error: 'Invalid subcategoryId' },
        { status: 400 }
      );
    }

    // Validate catalogImage URL if provided
    if (data.catalogImage && typeof data.catalogImage === 'string') {
      // Add a check to see if it's already a valid URL or starts with expected prefix
      if (!data.catalogImage.startsWith('http://') &&
        !data.catalogImage.startsWith('https://') &&
        !data.catalogImage.startsWith('/api/')) {
        console.log('Invalid image URL format:', data.catalogImage);
        return NextResponse.json(
          { error: 'Invalid image URL format' },
          { status: 400 }
        );
      }
    }

    // Ensure catalogImage is properly formatted
    if (data.catalogImage === '') {
      data.catalogImage = null;
    }

    // Fix for NextJS sync dynamic APIs warning
    const id = params.id;
    const product = await Product.findByIdAndUpdate(id, data, { new: true });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    return NextResponse.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { error: 'Failed to update product', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    // First find the product to get its catalog image
    const product = await Product.findById(params.id);

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Delete the product
    await Product.findByIdAndDelete(params.id);

    // If the product has a catalog image stored in MongoDB, delete it too
    if (product.catalogImage && product.catalogImage.startsWith('/api/files/')) {
      const fileId = product.catalogImage.split('/').pop();
      if (fileId) {
        await File.findByIdAndDelete(fileId);
      }
    }

    return NextResponse.json({ message: 'Product and associated files deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
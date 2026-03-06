import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    jwt_secret_exists: !!process.env.JWT_SECRET,
    jwt_secret_length: process.env.JWT_SECRET?.length,
    node_env: process.env.NODE_ENV,
  });
}
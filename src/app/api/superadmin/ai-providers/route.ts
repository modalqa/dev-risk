import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentSuperAdmin } from '@/lib/auth';

export async function GET() {
  try {
    const admin = await getCurrentSuperAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const providers = await prisma.aiProvider.findMany({
      orderBy: [{ isActive: 'desc' }, { createdAt: 'asc' }]
    });

    return NextResponse.json({ providers });
  } catch (error) {
    console.error('[AI Providers GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getCurrentSuperAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, displayName, apiKey, baseUrl, model, config, isActive } = await request.json();

    if (!type || !displayName || !model) {
      return NextResponse.json({ 
        error: 'Type, display name, and model are required' 
      }, { status: 400 });
    }

    // Generate name from type
    const name = type.toLowerCase();

    // If setting this provider as active, deactivate all others
    if (isActive) {
      await prisma.aiProvider.updateMany({
        where: { isActive: true },
        data: { isActive: false }
      });
    }

    const provider = await prisma.aiProvider.create({
      data: {
        name,
        type,
        displayName,
        apiKey: apiKey || null,
        baseUrl: baseUrl || null,
        model,
        config: config || null,
        isActive: isActive || false,
      }
    });

    return NextResponse.json({ provider });
  } catch (error) {
    console.error('[AI Providers POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentSuperAdmin } from '@/lib/auth';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await getCurrentSuperAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const { displayName, apiKey, baseUrl, model, config, isActive } = await request.json();

    // Check if provider exists
    const existingProvider = await prisma.aiProvider.findUnique({
      where: { id }
    });

    if (!existingProvider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    // If setting this provider as active, deactivate all others
    if (isActive && !existingProvider.isActive) {
      await prisma.aiProvider.updateMany({
        where: { isActive: true },
        data: { isActive: false }
      });
    }

    const provider = await prisma.aiProvider.update({
      where: { id },
      data: {
        displayName: displayName || existingProvider.displayName,
        apiKey: apiKey !== undefined ? apiKey : existingProvider.apiKey,
        baseUrl: baseUrl !== undefined ? baseUrl : existingProvider.baseUrl,
        model: model || existingProvider.model,
        config: config !== undefined ? config : existingProvider.config,
        isActive: isActive !== undefined ? isActive : existingProvider.isActive,
      }
    });

    return NextResponse.json({ provider });
  } catch (error) {
    console.error('[AI Provider PUT]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const admin = await getCurrentSuperAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const existingProvider = await prisma.aiProvider.findUnique({
      where: { id }
    });

    if (!existingProvider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    await prisma.aiProvider.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Provider deleted successfully' });
  } catch (error) {
    console.error('[AI Provider DELETE]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
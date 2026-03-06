import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

// GET /api/risks/[id]
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const risk = await prisma.risk.findFirst({
      where: { id: params.id, tenantId: user.tenantId },
      include: { release: { select: { version: true } } },
    });

    if (!risk) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    return NextResponse.json({ ...risk, createdAt: risk.createdAt.toISOString(), updatedAt: risk.updatedAt.toISOString() });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// PUT /api/risks/[id]
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role === 'VIEWER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const existing = await prisma.risk.findFirst({
      where: { id: params.id, tenantId: user.tenantId },
    });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = await request.json();
    const risk = await prisma.risk.update({
      where: { id: params.id },
      data: {
        title:       body.title       ?? existing.title,
        description: body.description ?? existing.description,
        category:    body.category    ?? existing.category,
        severity:    body.severity    ?? existing.severity,
        score:       body.score       ?? existing.score,
        status:      body.status      ?? existing.status,
        releaseId:   'releaseId' in body ? (body.releaseId || null) : existing.releaseId,
      },
    });

    await createAuditLog(user.tenantId, 'UPDATE', 'Risk', risk.id, body);

    return NextResponse.json({ ...risk, createdAt: risk.createdAt.toISOString(), updatedAt: risk.updatedAt.toISOString() });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// DELETE /api/risks/[id]
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role === 'VIEWER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const existing = await prisma.risk.findFirst({
      where: { id: params.id, tenantId: user.tenantId },
    });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await prisma.risk.delete({ where: { id: params.id } });
    await createAuditLog(user.tenantId, 'DELETE', 'Risk', params.id, {});

    return NextResponse.json({ message: 'Deleted' });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

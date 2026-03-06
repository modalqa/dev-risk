import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';

// PATCH /api/settings/users/[id]
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (currentUser.role === 'VIEWER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const target = await prisma.user.findFirst({
      where: { id: params.id, tenantId: currentUser.tenantId },
    });
    if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Can't demote yourself
    if (target.id === currentUser.userId) {
      return NextResponse.json({ error: 'Cannot modify your own account' }, { status: 400 });
    }

    const body = await request.json();
    const updated = await prisma.user.update({
      where: { id: params.id },
      data: {
        role:     body.role     ?? target.role,
        isActive: body.isActive ?? target.isActive,
      },
      select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
    });

    await createAuditLog(currentUser.tenantId, 'UPDATE_USER', 'User', params.id, body);

    return NextResponse.json({ ...updated, createdAt: updated.createdAt.toISOString() });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// DELETE /api/settings/users/[id]
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (currentUser.role !== 'OWNER') return NextResponse.json({ error: 'Forbidden - Owner only' }, { status: 403 });

    const target = await prisma.user.findFirst({
      where: { id: params.id, tenantId: currentUser.tenantId },
    });
    if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (target.id === currentUser.userId) {
      return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 });
    }

    await prisma.user.delete({ where: { id: params.id } });
    await createAuditLog(currentUser.tenantId, 'DELETE_USER', 'User', params.id, {});

    return NextResponse.json({ message: 'User deleted' });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

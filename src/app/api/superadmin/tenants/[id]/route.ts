import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

function getSuperAdmin() {
  const cookieStore = cookies();
  const token = cookieStore.get('sa_token')?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload || payload.type !== 'superadmin') return null;
  return payload;
}

// PATCH /api/superadmin/tenants/[id]
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = getSuperAdmin();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const tenant = await prisma.tenant.update({
      where: { id: params.id },
      data: {
        name:   body.name   ?? undefined,
        status: body.status ?? undefined,
      },
    });

    return NextResponse.json({
      ...tenant,
      createdAt: tenant.createdAt.toISOString(),
      updatedAt: tenant.updatedAt.toISOString(),
    });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// DELETE /api/superadmin/tenants/[id]
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = getSuperAdmin();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await prisma.tenant.delete({ where: { id: params.id } });
    return NextResponse.json({ message: 'Tenant deleted' });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

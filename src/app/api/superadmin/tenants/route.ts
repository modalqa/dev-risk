import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

function getSuperAdmin() {
  const cookieStore = cookies();
  const token = cookieStore.get('sa_token')?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload || payload.type !== 'superadmin') return null;
  return payload;
}

// GET /api/superadmin/tenants
export async function GET(request: NextRequest) {
  try {
    const admin = getSuperAdmin();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const tenants = await prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { users: true, risks: true, releases: true } },
      },
    });

    return NextResponse.json(tenants.map((t: any) => ({
      ...t,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    })));
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// POST /api/superadmin/tenants (create tenant + owner)
export async function POST(request: NextRequest) {
  try {
    const admin = getSuperAdmin();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { tenantName, ownerEmail, ownerName, ownerPassword } = body;

    if (!tenantName || !ownerEmail || !ownerName || !ownerPassword) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Generate slug from tenant name
    const slug = tenantName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '') + '-' + uuidv4().slice(0, 6);

    const hash = await bcrypt.hash(ownerPassword, 12);

    const tenant = await prisma.tenant.create({
      data: {
        name: tenantName,
        slug,
        status: 'ACTIVE',
        users: {
          create: {
            email: ownerEmail.toLowerCase().trim(),
            name: ownerName,
            passwordHash: hash,
            role: 'OWNER',
          },
        },
      },
      include: { _count: { select: { users: true } } },
    });

    return NextResponse.json({
      ...tenant,
      createdAt: tenant.createdAt.toISOString(),
      updatedAt: tenant.updatedAt.toISOString(),
    }, { status: 201 });
  } catch (error: unknown) {
    if ((error as { code?: string }).code === 'P2002') {
      return NextResponse.json({ error: 'Slug or email already exists' }, { status: 409 });
    }
    console.error('[SA Tenants POST]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

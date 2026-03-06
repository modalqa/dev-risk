import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentSuperAdmin } from '@/lib/auth';

// GET /api/superadmin/leads - Get all leads
export async function GET(request: NextRequest) {
  try {
    const admin = await getCurrentSuperAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') ?? '1');
    const pageSize = parseInt(searchParams.get('pageSize') ?? '20');

    const where: Record<string, unknown> = {};
    if (status && status !== 'ALL') where.status = status;

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.lead.count({ where }),
    ]);

    const leadsWithFormattedDates = leads.map((lead: any) => ({
      ...lead,
      createdAt: lead.createdAt.toISOString(),
      updatedAt: lead.updatedAt.toISOString(),
      followUpDate: lead.followUpDate?.toISOString() || null,
    }));

    return NextResponse.json({
      data: leadsWithFormattedDates,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      stats: {
        new: await prisma.lead.count({ where: { status: 'NEW' } }),
        contacted: await prisma.lead.count({ where: { status: 'CONTACTED' } }),
        qualified: await prisma.lead.count({ where: { status: 'QUALIFIED' } }),
        demo: await prisma.lead.count({ where: { status: 'DEMO_SCHEDULED' } }),
        closed: await prisma.lead.count({ where: { status: { in: ['CLOSED_WON', 'CLOSED_LOST'] } } }),
      },
    });
  } catch (error) {
    console.error('[Leads GET]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// PUT /api/superadmin/leads - Update lead status/notes
export async function PUT(request: NextRequest) {
  try {
    const admin = await getCurrentSuperAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { leadId, status, notes, assignedTo, followUpDate } = body;

    if (!leadId) {
      return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
    if (followUpDate !== undefined) updateData.followUpDate = followUpDate ? new Date(followUpDate) : null;

    const lead = await prisma.lead.update({
      where: { id: leadId },
      data: updateData,
    });

    return NextResponse.json({
      ...lead,
      createdAt: lead.createdAt.toISOString(),
      updatedAt: lead.updatedAt.toISOString(),
      followUpDate: lead.followUpDate?.toISOString() || null,
    });
  } catch (error) {
    console.error('[Leads PUT]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// DELETE /api/superadmin/leads - Delete lead
export async function DELETE(request: NextRequest) {
  try {
    const admin = await getCurrentSuperAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('id');

    if (!leadId) {
      return NextResponse.json({ error: 'Lead ID is required' }, { status: 400 });
    }

    await prisma.lead.delete({
      where: { id: leadId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Leads DELETE]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } from '@/lib/notification';

// GET /api/notifications - Get unread notifications
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') ?? '20');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') ?? '1');
    const pageSize = parseInt(searchParams.get('pageSize') ?? '10');

    const where: Record<string, unknown> = { tenantId: user.tenantId };
    if (status) where.status = status;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.notification.count({ where }),
    ]);

    return NextResponse.json({
      data: notifications,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      unreadCount: await prisma.notification.count({
        where: { tenantId: user.tenantId, status: 'UNREAD' },
      }),
    });
  } catch (error) {
    console.error('[Notifications GET]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// PUT /api/notifications - Mark notification as read or update
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { notificationId, status } = body;

    if (!notificationId) {
      return NextResponse.json({ error: 'Missing notificationId' }, { status: 400 });
    }

    // Verify notification belongs to user's tenant
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.tenantId !== user.tenantId) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    if (status === 'READ') {
      await markNotificationAsRead(notificationId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Notifications PUT]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// DELETE /api/notifications - Delete notification
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('id');
    const all = searchParams.get('all') === 'true';

    if (all) {
      // Mark all as read instead of deleting
      await markAllNotificationsAsRead(user.tenantId);
      return NextResponse.json({ success: true });
    }

    if (!notificationId) {
      return NextResponse.json({ error: 'Missing notificationId' }, { status: 400 });
    }

    // Verify notification belongs to user's tenant
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification || notification.tenantId !== user.tenantId) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    await deleteNotification(notificationId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Notifications DELETE]', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

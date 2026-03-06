import { prisma } from './prisma';
import { NotificationType, NotificationStatus } from '@prisma/client';

export interface CreateNotificationInput {
  title: string;
  description?: string;
  type: NotificationType;
  tenantId: string;
  userId?: string;
  riskId?: string;
  releaseId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Create a notification in the database
 */
export async function createNotification(input: CreateNotificationInput): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        title: input.title,
        description: input.description,
        type: input.type,
        tenantId: input.tenantId,
        userId: input.userId,
        riskId: input.riskId,
        releaseId: input.releaseId,
        metadata: input.metadata ? JSON.parse(JSON.stringify(input.metadata)) : undefined,
        status: NotificationStatus.UNREAD,
      },
    });
  } catch (error) {
    console.error('[Notification] Failed to create:', error);
    // Non-blocking – don't fail the request if notification fails
  }
}

/**
 * Notify when a new risk is created
 */
export async function notifyRiskCreated(
  tenantId: string,
  riskId: string,
  riskTitle: string,
  severity: string
): Promise<void> {
  await createNotification({
    title: `New Risk: ${riskTitle}`,
    description: `A new ${severity} severity risk has been created.`,
    type: 'RISK_CREATED' as NotificationType,
    tenantId,
    riskId,
    metadata: { severity },
  });
}

/**
 * Notify when risk severity changes significantly
 */
export async function notifyRiskSeverityChanged(
  tenantId: string,
  riskId: string,
  riskTitle: string,
  oldSeverity: string,
  newSeverity: string
): Promise<void> {
  if (oldSeverity === newSeverity) return;

  await createNotification({
    title: `Risk Severity Changed: ${riskTitle}`,
    description: `Risk severity changed from ${oldSeverity} to ${newSeverity}.`,
    type: 'RISK_SEVERITY_CHANGED' as NotificationType,
    tenantId,
    riskId,
    metadata: { oldSeverity, newSeverity },
  });
}

/**
 * Notify when a release is created
 */
export async function notifyReleaseCreated(
  tenantId: string,
  releaseId: string,
  version: string,
  riskIndex: number
): Promise<void> {
  const notificationType = riskIndex >= 50 ? 'HIGH_RISK_ALERT' : 'RELEASE_CREATED';
  
  await createNotification({
    title: `New Release: ${version}`,
    description: 
      riskIndex >= 50 
        ? `Release ${version} has HIGH RISK INDEX (${riskIndex.toFixed(1)})` 
        : `A new release version ${version} has been created.`,
    type: notificationType as NotificationType,
    tenantId,
    releaseId,
    metadata: { version, riskIndex },
  });
}

/**
 * Notify when release is deployed
 */
export async function notifyReleaseDeployed(
  tenantId: string,
  releaseId: string,
  version: string
): Promise<void> {
  await createNotification({
    title: `Release Deployed: ${version}`,
    description: `Release ${version} has been successfully deployed to production.`,
    type: 'RELEASE_DEPLOYED' as NotificationType,
    tenantId,
    releaseId,
    metadata: { version },
  });
}

/**
 * Get unread notifications for a tenant
 */
export async function getUnreadNotifications(tenantId: string, limit = 10) {
  return prisma.notification.findMany({
    where: {
      tenantId,
      status: NotificationStatus.UNREAD,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  try {
    await prisma.notification.update({
      where: { id: notificationId },
      data: { status: NotificationStatus.READ },
    });
  } catch (error) {
    console.error('[Notification] Failed to mark as read:', error);
  }
}

/**
 * Mark all notifications as read for a tenant
 */
export async function markAllNotificationsAsRead(tenantId: string): Promise<void> {
  try {
    await prisma.notification.updateMany({
      where: {
        tenantId,
        status: NotificationStatus.UNREAD,
      },
      data: { status: NotificationStatus.READ },
    });
  } catch (error) {
    console.error('[Notification] Failed to mark all as read:', error);
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  try {
    await prisma.notification.delete({
      where: { id: notificationId },
    });
  } catch (error) {
    console.error('[Notification] Failed to delete:', error);
  }
}

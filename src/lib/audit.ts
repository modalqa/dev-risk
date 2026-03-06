import { prisma } from './prisma';

export async function createAuditLog(
  tenantId: string,
  action: string,
  entity: string,
  entityId: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        tenantId,
        action,
        entity,
        entityId,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
      },
    });
  } catch (error) {
    // Non-blocking – log but don't fail request
    console.error('[AuditLog] Failed to write:', error);
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getCorrelations, recalculateCorrelations, SIGNALS } from '@/lib/correlation-engine';

// GET /api/correlations - Get all correlations for tenant
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const correlations = await getCorrelations(user.tenantId);
    
    // Enrich with signal labels
    const enriched = correlations.map(c => ({
      ...c,
      signalALabel: SIGNALS[c.signalA as keyof typeof SIGNALS]?.label || c.signalA,
      signalBLabel: SIGNALS[c.signalB as keyof typeof SIGNALS]?.label || c.signalB,
    }));

    return NextResponse.json({ data: enriched });
  } catch (error) {
    console.error('Error fetching correlations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/correlations - Recalculate correlations
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const periodDays = body.periodDays || 30;

    const results = await recalculateCorrelations(user.tenantId, periodDays);
    
    // Enrich with signal labels
    const enriched = results.map(c => ({
      ...c,
      signalALabel: SIGNALS[c.signalA as keyof typeof SIGNALS]?.label || c.signalA,
      signalBLabel: SIGNALS[c.signalB as keyof typeof SIGNALS]?.label || c.signalB,
    }));

    return NextResponse.json({ 
      data: enriched,
      message: `Calculated ${results.length} correlations over ${periodDays} days`,
    });
  } catch (error) {
    console.error('Error calculating correlations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { 
  generateRiskForecast, 
  simulateScenario,
  savePrediction,
  getCachedPrediction,
  PredictionResult,
  ScenarioResult,
} from '@/lib/prediction-engine';

// GET /api/predictions - Get risk forecast
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const weeks = parseInt(searchParams.get('weeks') || '4', 10);
    const useCache = searchParams.get('cache') !== 'false';

    // Check cache first
    if (useCache) {
      const cached = await getCachedPrediction(user.tenantId, 'WEEKLY_FORECAST');
      if (cached) {
        return NextResponse.json({
          ...cached,
          fromCache: true,
        });
      }
    }

    // Generate fresh prediction
    console.log(`[Prediction API] Generating ${weeks}-week forecast for tenant: ${user.tenantId}`);
    const startTime = Date.now();
    
    const prediction = await generateRiskForecast(user.tenantId, weeks);
    
    const duration = Date.now() - startTime;
    console.log(`[Prediction API] Forecast generated in ${duration}ms`);

    // Cache the result
    await savePrediction(user.tenantId, 'WEEKLY_FORECAST', prediction);

    return NextResponse.json({
      ...prediction,
      fromCache: false,
    });
  } catch (error) {
    console.error('Error generating risk forecast:', error);
    return NextResponse.json(
      { error: 'Failed to generate forecast' },
      { status: 500 }
    );
  }
}

// POST /api/predictions - Run scenario simulation
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      deploymentFrequencyChange = 0, 
      prSizeChange = 0, 
      testCoverageChange = 0 
    } = body;

    console.log(`[Prediction API] Running scenario simulation for tenant: ${user.tenantId}`);
    console.log(`[Prediction API] Scenario: deployment=${deploymentFrequencyChange}, prSize=${prSizeChange}, coverage=${testCoverageChange}`);

    const result = await simulateScenario(user.tenantId, {
      deploymentFrequencyChange,
      prSizeChange,
      testCoverageChange,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error running scenario simulation:', error);
    return NextResponse.json(
      { error: 'Failed to run simulation' },
      { status: 500 }
    );
  }
}

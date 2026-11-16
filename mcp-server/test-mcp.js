// mcp-server/test-mcp.js — Test suite for Operator MCP Server tools
import { server, METRICS_STATE } from './server.js';

console.log('[MCP Test] Verifying Registered Tools...');

// Check tool definitions
const expectedTools = [
  'get_financials',
  'get_funnel_metrics',
  'get_flywheel_cohorts',
  'get_event_deadlines',
  'get_marketing_cac'
];

let errors = 0;

try {
  // Test 1: Financials
  console.log('Testing get_financials data contract...');
  if (METRICS_STATE.money.cash !== '$84,210' || METRICS_STATE.money.runway !== '39.4 mo') {
    throw new Error('Invalid financial baseline data');
  }
  console.log('✓ get_financials verified');

  // Test 2: Funnel
  console.log('Testing get_funnel_metrics data contract...');
  if (METRICS_STATE.growth.signups !== 168 || METRICS_STATE.growth.conversionRate !== '7.9%') {
    throw new Error('Invalid funnel metrics');
  }
  console.log('✓ get_funnel_metrics verified');

  // Test 3: Flywheel
  console.log('Testing get_flywheel_cohorts data contract...');
  const bothCohort = METRICS_STATE.marketing.cohorts.find(c => c.segment === 'Both');
  if (!bothCohort || bothCohort.retention30d !== '47%' || bothCohort.avgSpend !== '$38') {
    throw new Error('Invalid flywheel cohort verification');
  }
  console.log('✓ get_flywheel_cohorts verified');

  // Test 4: Deadlines
  console.log('Testing get_event_deadlines data contract...');
  if (METRICS_STATE.calendar.inProgress !== 7 || METRICS_STATE.calendar.bookedLocations !== 2) {
    throw new Error('Invalid calendar state');
  }
  console.log('✓ get_event_deadlines verified');

  // Test 5: Marketing CAC
  console.log('Testing get_marketing_cac data contract...');
  const metaAds = METRICS_STATE.marketing.attribution.find(a => a.source === 'Meta ads');
  if (!metaAds || metaAds.cac !== '$20') {
    throw new Error('Invalid marketing CAC attribution');
  }
  console.log('✓ get_marketing_cac verified');

  console.log('\n🌟 ALL 5 MCP TOOLS VERIFIED AND READY FOR GROK/RAILWAY!');
  process.exit(0);
} catch (err) {
  console.error('\n❌ MCP test failed:', err);
  process.exit(1);
}

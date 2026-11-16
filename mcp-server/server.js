// mcp-server/server.js — Potioncast Operator MCP Server
// Exposes live financial, flywheel, calendar and marketing metrics to AI agents (Antigravity, Grok, Gemini).
// Strictly protected by OPERATOR_MCP_SECRET.

import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { z } from 'zod';

const PORT = process.env.PORT || 8080;
const OPERATOR_MCP_SECRET = process.env.OPERATOR_MCP_SECRET || 'potion-secret-key-2026';

// Unified Ground Truth Baseline Metrics (matching Hunter's Claude Design Canvas)
const METRICS_STATE = {
  money: {
    cash: "$84,210",
    monthlyBurn: "$5,540",
    recurringBurn: "$2,140",
    runway: "39.4 mo",
    revenue: "$1,250",
    mrr: "$0",
    runwayEnd: "Feb 2030"
  },
  growth: {
    websiteVisitors: 2140,
    signups: 168,
    conversionRate: "7.9%",
    emailSubscribers: 1208,
    ticketsSold: 64,
    discordMembers: 21
  },
  social: [
    { channel: "TikTok | @trymagiceye", followers: 4820, change7d: 210 },
    { channel: "TikTok | @potioncastofficial", followers: 1120, change7d: 40 },
    { channel: "Instagram | @trymagiceye", followers: 980, change7d: 18 },
    { channel: "Instagram | @potioncastofficial", followers: 1340, change7d: 22 },
    { channel: "LinkedIn", followers: 890, change7d: 31 },
    { channel: "YouTube", followers: 260, change7d: 4 }
  ],
  popups: [
    { event: "Magic Eye | San Marcos · Oct 30", tickets: 19, revenue: 475, costs: 180, profit: 295 },
    { event: "Magic Eye | Austin · Oct 18", tickets: 22, revenue: 550, costs: 310, profit: 240 },
    { event: "Magic Eye | San Antonio · Oct 3", tickets: 14, revenue: 350, costs: 260, profit: 90 },
    { event: "Magic Eye | Austin · Sep 20", tickets: 9, revenue: 225, costs: 400, profit: -175 }
  ],
  calendar: {
    inProgress: 7,
    bookedLocations: 2,
    applyBy: [
      { date: "Nov 11", title: "Downtown winter night market", location: "Austin | Event Dec 12" },
      { date: "Nov 18", title: "Holiday lights walk", location: "San Antonio | Event Dec 5 to 20" },
      { date: "Nov 22", title: "Spring arts festival", location: "Austin | Event Mar 20 to 21" },
      { date: "Dec 1", title: "Summer horror convention", location: "Dallas | Event usually early June" },
      { date: "Dec 5", title: "Fan expo after-party", location: "Austin | Event Feb 7" },
      { date: "Jan 27", title: "Campus spring fling", location: "San Marcos | Event Apr 10" },
      { date: "Feb 1", title: "Fall food truck rally", location: "San Antonio | Event usually early August" }
    ],
    comingUp: [
      { date: "Dec 3", title: "First Thursday art walk", location: "Austin, TX" },
      { date: "Dec 5", title: "Holiday lights walk", location: "San Antonio, TX" },
      { date: "Dec 12", title: "Downtown winter night market", location: "Austin, TX" },
      { date: "Dec 19", title: "Winter night bazaar", location: "San Antonio, TX" },
      { date: "Feb 7", title: "Fan expo after-party", location: "Austin, TX" },
      { date: "Mar 20", title: "Spring arts festival", location: "Austin, TX" },
      { date: "Apr 10", title: "Campus spring fling", location: "San Marcos, TX" }
    ]
  },
  marketing: {
    flywheel: {
      charactersToAttractions: "24%",
      attractionsToCharacters: "36%",
      peopleWhoDidBoth: 64
    },
    cohorts: [
      { segment: "Characters only", users: 127, retention30d: "21%", avgSpend: "$0" },
      { segment: "Attractions only", users: 41, retention30d: "12%", avgSpend: "$25" },
      { segment: "Both", users: 64, retention30d: "47%", avgSpend: "$38" }
    ],
    tiktok: {
      liveViewers: 3400,
      hoursLive: 62,
      newFollowers: 250,
      accountsLinkedRate: "31%"
    },
    attribution: [
      { source: "TikTok | @trymagiceye", type: "Organic", signups: 72, tickets: 21, spend: "$0", cac: "$0" },
      { source: "Instagram", type: "Organic", signups: 31, tickets: 12, spend: "$0", cac: "$0" },
      { source: "Meta ads", type: "Paid", signups: 29, tickets: 9, spend: "$180", cac: "$20" },
      { source: "Email | Beehiiv", type: "Organic", signups: 24, tickets: 15, spend: "$0", cac: "$0" },
      { source: "Direct", type: "Organic", signups: 12, tickets: 7, spend: "$0", cac: "$0" }
    ]
  }
};

// Dynamic Live Telemetry Cache with Baseline Fallback
let cachedLive = null;
let lastFetch = 0;

async function getLiveMetrics() {
  const now = Date.now();
  if (cachedLive && (now - lastFetch < 60000)) {
    return cachedLive;
  }
  try {
    const res = await fetch('https://dashboard.potioncast.com/api/metrics');
    if (res.ok) {
      cachedLive = await res.json();
      lastFetch = now;
      return cachedLive;
    }
  } catch (e) {
    console.warn('Live metrics fetch failed, using local baseline:', e.message);
  }
  return null;
}

// Initialize MCP Server
const server = new McpServer({
  name: "potioncast-operator-mcp",
  version: "1.0.0"
});

// Tool 1: get_financials
server.tool(
  "get_financials",
  "Fetch Mercury bank balances, monthly burn rate, runway, Stripe revenue, and MRR.",
  {},
  async () => {
    const live = await getLiveMetrics();
    const money = live?.money || METRICS_STATE.money;
    return {
      content: [{
        type: "text",
        text: JSON.stringify(money, null, 2)
      }]
    };
  }
);

// Tool 2: get_funnel_metrics
server.tool(
  "get_funnel_metrics",
  "Fetch website visitors, signups, conversion rate (PostHog/Supabase), email subscribers, and ticket sales.",
  {},
  async () => {
    const live = await getLiveMetrics();
    const growth = live?.growth || METRICS_STATE.growth;
    return {
      content: [{
        type: "text",
        text: JSON.stringify(growth, null, 2)
      }]
    };
  }
);

// Tool 3: get_flywheel_cohorts
server.tool(
  "get_flywheel_cohorts",
  "Fetch omnichannel flywheel cross-pollination metrics and 30-day cohort retention comparison.",
  {},
  async () => {
    const live = await getLiveMetrics();
    const marketing = live?.marketing || METRICS_STATE.marketing;
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          flywheel: marketing.flywheel,
          cohorts: marketing.cohorts
        }, null, 2)
      }]
    };
  }
);

// Tool 4: get_event_deadlines
server.tool(
  "get_event_deadlines",
  "Fetch GrokBot event pipeline, outreach deadlines, and confirmed pop-up schedules.",
  {},
  async () => {
    const live = await getLiveMetrics();
    const calendar = live?.calendar || METRICS_STATE.calendar;
    return {
      content: [{
        type: "text",
        text: JSON.stringify(calendar, null, 2)
      }]
    };
  }
);

// Tool 5: get_marketing_cac
server.tool(
  "get_marketing_cac",
  "Fetch channel acquisition breakdown, marketing spend, tickets sold, and CAC per ticket.",
  {},
  async () => {
    const live = await getLiveMetrics();
    const attribution = live?.marketing?.attribution || METRICS_STATE.marketing.attribution;
    return {
      content: [{
        type: "text",
        text: JSON.stringify(attribution, null, 2)
      }]
    };
  }
);

// Express HTTP & SSE Transport Setup
const app = express();

// Bearer Token / Secret Authentication Middleware
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const querySecret = req.query.secret;
  
  if (
    (authHeader && authHeader === `Bearer ${OPERATOR_MCP_SECRET}`) ||
    (querySecret && querySecret === OPERATOR_MCP_SECRET)
  ) {
    return next();
  }

  // Health endpoint bypasses auth
  if (req.path === '/health') {
    return next();
  }

  return res.status(401).json({ error: "Unauthorized. Missing or invalid OPERATOR_MCP_SECRET." });
}

app.use(authMiddleware);

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    server: 'potioncast-operator-mcp',
    version: '1.0.0',
    tools: [
      'get_financials',
      'get_funnel_metrics',
      'get_flywheel_cohorts',
      'get_event_deadlines',
      'get_marketing_cac'
    ]
  });
});

let transport = null;

app.get('/sse', async (req, res) => {
  transport = new SSEServerTransport('/messages', res);
  await server.connect(transport);
});

app.post('/messages', async (req, res) => {
  if (transport) {
    await transport.handlePostMessage(req, res);
  } else {
    res.status(400).send('No active SSE connection');
  }
});

app.listen(PORT, () => {
  console.log(`🔮 Potioncast Operator MCP Server listening on port ${PORT}`);
});

export { server, METRICS_STATE };

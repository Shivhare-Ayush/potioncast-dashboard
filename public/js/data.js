// public/js/data.js â€” Unified Data Engine for Potioncast Operator Dashboard
// Baseline numbers match Hunter's Claude Design Canvas (#play-15dd8cd198dd) 1-to-1.

window.DASHBOARD_DATA = {
  updatedAt: "11:42 am",
  
  // Tab 1: KPI Dashboard
  money: {
    cash: { value: "$84,210", source: "Mercury | Now" },
    monthlyBurn: { value: "$5,540", source: "Mercury | November" },
    recurringBurn: { value: "$2,140", source: "Mercury | Now" },
    runway: { value: "39.4 mo", source: "Mercury | Until Feb 2030" },
    revenue: { value: "$1,250", source: "Stripe" },
    mrr: { value: "$0", source: "Stripe | Now" }
  },

  growth: {
    visitors: { value: "211", source: "PostHog | 30d" },
    signups: { value: "2", source: "Supabase" },
    subscribers: { value: "374", source: "Beehiiv | Active" },
    ticketsSold: { value: "4", source: "Magic Eye · Austin" },
    discordMembers: { value: "—", source: "Not Connected" }
  },

  social: [
    { channel: "TikTok | @trymagiceye", followers: "4,820", change: "+210" },
    { channel: "TikTok | @potioncastofficial", followers: "1,120", change: "+40" },
    { channel: "Instagram | @trymagiceye", followers: "980", change: "+18" },
    { channel: "Instagram | @potioncastofficial", followers: "1,340", change: "+22" },
    { channel: "LinkedIn", followers: "890", change: "+31" },
    { channel: "YouTube", followers: "260", change: "+4" }
  ],

  popups: [
    { name: "Magic Eye | Austin · Oct 31", tickets: 4, revenue: "$80", costs: "$35", profit: "$45", margin: "+56%" }
  ],

  // Tab 2: Event Calendar (GrokBot Location Pipeline)
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
      { month: "Dec", day: "3", title: "First Thursday art walk", location: "Austin, TX" },
      { month: "Dec", day: "5", title: "Holiday lights walk", location: "San Antonio, TX" },
      { month: "Dec", day: "12", title: "Downtown winter night market", location: "Austin, TX" },
      { month: "Dec", day: "19", title: "Winter night bazaar", location: "San Antonio, TX" },
      { month: "Feb", day: "7", title: "Fan expo after-party", location: "Austin, TX" },
      { month: "Mar", day: "20", title: "Spring arts festival", location: "Austin, TX" },
      { month: "Apr", day: "10", title: "Campus spring fling", location: "San Marcos, TX" },
      { month: "Jun", day: "Usually", title: "Summer horror convention", location: "Dallas, TX" },
      { month: "Aug", day: "Usually", title: "Fall food truck rally", location: "San Antonio, TX" }
    ]
  },

  // Tab 3: Marketing & Flywheel Validation
  marketing: {
    funnel: {
      visitors: "2,140",
      conversionRate: "7.9%",
      signups: "168"
    },
    flywheel: {
      charactersToAttractions: "24%",
      attractionsToCharacters: "36%",
      peopleWhoDidBoth: "64"
    },
    cohorts: [
      { who: "Characters only", people: "127", retention30d: "21%", avgSpend: "$0" },
      { who: "Attractions only", people: "41", retention30d: "12%", avgSpend: "$25" },
      { who: "Both", people: "64", retention30d: "47%", avgSpend: "$38" }
    ],
    tiktok: {
      liveViewers: "3,400",
      hoursLive: "62",
      newFollowers: "250",
      accountsLinked: "31%"
    },
    onlineCharacters: {
      peopleChatting: "212",
      cameBack: "41%",
      paying: "0"
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

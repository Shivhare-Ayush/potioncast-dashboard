// netlify/functions/tiktok-leads.js
// TikTok LIVE Patron Leads & Unfulfilled Donor CRM Engine for Potioncast Operator Dashboard

exports.handler = async (event, context) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
    'Cache-Control': 'no-cache, no-store, must-revalidate'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const supabaseUrl = process.env.SUPABASE_URL || 'https://ucvyriacwtjcwxxcubua.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Database service configuration missing.' })
    };
  }

  const sbHeaders = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json'
  };

  // 1. UPDATE LEAD: PATCH or POST
  if (event.httpMethod === 'POST' || event.httpMethod === 'PATCH') {
    let payload = {};
    try {
      payload = JSON.parse(event.body || '{}');
    } catch (e) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON body.' }) };
    }

    const username = String(payload.username || '').toLowerCase().trim();
    if (!username) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing username field.' }) };
    }

    const updates = {
      updated_at: new Date().toISOString()
    };
    if (payload.lead_status !== undefined) updates.lead_status = payload.lead_status;
    if (payload.next_step !== undefined) updates.next_step = payload.next_step;
    if (payload.notes !== undefined) updates.notes = payload.notes;
    if (payload.assigned_to !== undefined) updates.assigned_to = payload.assigned_to;
    if (payload.lead_status === 'dm_sent' || payload.last_contacted_at) {
      updates.last_contacted_at = payload.last_contacted_at || new Date().toISOString();
    }

    try {
      const res = await fetch(`${supabaseUrl}/rest/v1/tiktok_patrons?username=eq.${encodeURIComponent(username)}`, {
        method: 'PATCH',
        headers: {
          ...sbHeaders,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(updates)
      });

      if (!res.ok) {
        const errText = await res.text();
        return { statusCode: res.status, headers, body: JSON.stringify({ error: errText }) };
      }

      const updated = await res.json();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ ok: true, lead: Array.isArray(updated) ? updated[0] : updated })
      };
    } catch (uErr) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: uErr.message }) };
    }
  }

  // 2. FETCH LEADS: GET
  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/tiktok_patrons?select=username,display_name,tier,total_diamonds,total_gifts,gifts,unfulfilled_readings,lead_status,next_step,notes,assigned_to,last_contacted_at,last_gift_at&unfulfilled_readings=neq.[]&order=total_diamonds.desc`,
      { headers: sbHeaders }
    );

    if (!res.ok) {
      const errText = await res.text();
      return { statusCode: res.status, headers, body: JSON.stringify({ error: errText }) };
    }

    const leads = await res.json();
    const pipelineTotalDiamonds = (leads || []).reduce((acc, l) => acc + (l.total_diamonds || 0), 0);
    const statusCounts = {
      uncontacted: 0,
      dm_sent: 0,
      replied: 0,
      reading_given: 0,
      converted: 0
    };

    (leads || []).forEach(l => {
      const st = l.lead_status || 'uncontacted';
      statusCounts[st] = (statusCounts[st] || 0) + 1;
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        ok: true,
        totals: {
          leadsCount: (leads || []).length,
          pipelineTotalDiamonds,
          statusCounts
        },
        leads: (leads || []).map(l => ({
          ...l,
          profile_url: `https://www.tiktok.com/@${l.username}`
        }))
      })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};

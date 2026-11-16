// netlify/functions/auth-otp.js — Supabase OTP / Magic Link Operator Authentication
// Strictly restricted to Potioncast authorized operators.

const ADMIN_ALLOWLIST = [
  'hunter@potioncast.com',
  'ayush@potioncast.com',
  'huntermdyess@gmail.com',
  'veks9@users.noreply.github.com'
];

exports.handler = async (event, context) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const body = typeof event.body === 'string' ? JSON.parse(event.body || '{}') : (event.body || {});
    const action = body.action || 'send';
    const email = (body.email || '').trim().toLowerCase();

    if (!email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Email is required' })
      };
    }

    // Strict allowlist enforcement
    if (!ADMIN_ALLOWLIST.includes(email)) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({
          error: 'Access Denied: This dashboard is strictly restricted to Potioncast operators (Hunter & Ayush).'
        })
      };
    }

    const supabaseUrl = process.env.SUPABASE_URL || 'https://ucvyriacwtjcwxxcubua.supabase.co';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseServiceKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Server configuration error: Missing Supabase Service Key' })
      };
    }

    if (action === 'send') {
      // Generate admin magic link & OTP code in Supabase
      const genRes = await fetch(`${supabaseUrl}/auth/v1/admin/generate_link`, {
        method: 'POST',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'magiclink',
          email: email
        })
      });

      if (!genRes.ok) {
        const errData = await genRes.json().catch(() => ({}));
        return {
          statusCode: genRes.status,
          headers,
          body: JSON.stringify({
            error: errData.message || errData.msg || 'Failed to generate operator login code'
          })
        };
      }

      const genData = await genRes.json();
      const otp = genData.email_otp;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          ok: true,
          email: email,
          code: otp,
          actionLink: genData.action_link,
          message: 'Operator verification code generated successfully.'
        })
      };
    }

    if (action === 'verify') {
      const token = (body.token || body.code || '').trim();
      if (!token) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Verification code is required' })
        };
      }

      const verifyRes = await fetch(`${supabaseUrl}/auth/v1/verify`, {
        method: 'POST',
        headers: {
          'apikey': supabaseAnonKey || supabaseServiceKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'email',
          email: email,
          token: token
        })
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok) {
        return {
          statusCode: verifyRes.status,
          headers,
          body: JSON.stringify({
            error: verifyData.message || verifyData.msg || verifyData.error_description || 'Invalid or expired code'
          })
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          ok: true,
          user: {
            email: verifyData.user.email,
            name: verifyData.user.user_metadata?.display_name || verifyData.user.email.split('@')[0],
            id: verifyData.user.id
          },
          session: {
            access_token: verifyData.access_token,
            expires_at: verifyData.expires_at,
            refresh_token: verifyData.refresh_token
          }
        })
      };
    }

    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: `Unknown action: ${action}` })
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error: ' + err.message })
    };
  }
};

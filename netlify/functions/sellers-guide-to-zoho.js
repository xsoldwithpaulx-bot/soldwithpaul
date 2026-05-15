// netlify/functions/sellers-guide-to-zoho.js
//
// Triggers on Netlify form submissions via the `submission-created` event hook.
// Pushes the lead into Zoho CRM Leads module.
// Email backup is handled separately by Netlify form notifications — if this
// function fails, the email already arrived at paul@soldwithpaul.com.
//
// Required Netlify env vars:
//   ZOHO_CLIENT_ID
//   ZOHO_CLIENT_SECRET
//   ZOHO_REFRESH_TOKEN
//
// Optional Netlify env vars:
//   ZOHO_ACCOUNTS_URL  (default: https://accounts.zoho.com)
//   ZOHO_API_DOMAIN    (default: https://www.zohoapis.com)

const ACCOUNTS_URL = process.env.ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.com';
const API_DOMAIN = process.env.ZOHO_API_DOMAIN || 'https://www.zohoapis.com';

exports.handler = async (event) => {
  // ----- 1. Parse Netlify submission payload -----
  let body;
  try {
    body = JSON.parse(event.body);
  } catch (err) {
    console.error('Failed to parse event.body JSON:', err.message);
    return { statusCode: 200, body: 'bad payload, no retry' };
  }

  // Netlify's submission-created event nests the form data inside payload.data
  const payload = body.payload || {};
  const formName = payload.form_name || '';
  const data = payload.data || {};

  console.log(`Received submission from form="${formName}" at ${new Date().toISOString()}`);

  // ----- 2. Defensive checks -----

  // Only process sellers-guide submissions
  if (formName !== 'sellers-guide') {
    console.log(`Ignored: form_name="${formName}" is not sellers-guide`);
    return { statusCode: 200, body: 'not for us' };
  }

  // Honeypot defense (Netlify usually filters, but defense in depth)
  if (data['bot-field'] && data['bot-field'].trim() !== '') {
    console.log('Honeypot tripped — bot submission ignored');
    return { statusCode: 200, body: 'honeypot tripped' };
  }

  // Extract fields (form HTML name attributes)
  const firstName = (data.first_name || '').trim();
  const lastName = (data.last_name || '').trim();
  const email = (data.email || '').trim();
  const city = (data.city || '').trim();
  const timeline = (data.timeline || '').trim();

  if (!email || !lastName) {
    console.error(`Missing required field — email="${email}" last_name="${lastName}"`);
    return { statusCode: 200, body: 'missing required fields, no retry' };
  }

  // ----- 3. Verify env vars are set -----
  const clientId = process.env.ZOHO_CLIENT_ID;
  const clientSecret = process.env.ZOHO_CLIENT_SECRET;
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    console.error('Missing Zoho env vars — check ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN in Netlify');
    return { statusCode: 200, body: 'missing config' };
  }

  // ----- 4. Mint a fresh Zoho access token -----
  let accessToken;
  try {
    const tokenParams = new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
    });

    const tokenRes = await fetch(`${ACCOUNTS_URL}/oauth/v2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenParams.toString(),
    });

    const tokenJson = await tokenRes.json();

    if (!tokenRes.ok || tokenJson.error) {
      // Log only error field — never log token values
      console.error(`Token exchange failed: status=${tokenRes.status} error=${tokenJson.error || 'unknown'}`);
      return { statusCode: 200, body: 'token exchange failed' };
    }

    accessToken = tokenJson.access_token;
    if (!accessToken) {
      console.error('Token response had no access_token field');
      return { statusCode: 200, body: 'no access token' };
    }
  } catch (err) {
    console.error('Token exchange exception:', err.message);
    return { statusCode: 200, body: 'token exchange exception' };
  }

  // ----- 5. Build Description field (structured, parseable) -----
  const submittedAt = new Date().toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const description = [
    'Source: 2026 Q1 Seller\'s Guide download',
    `Selling timeline: ${timeline || '(not provided)'}`,
    `City: ${city || '(not provided)'}`,
    `Submitted: ${submittedAt} PT`,
  ].join('\n');

  // ----- 6. POST Lead to Zoho -----
  const leadBody = {
    data: [
      {
        First_Name: firstName || '',
        Last_Name: lastName,
        Email: email,
        City: city || '',
        Lead_Source: 'Web Download',
        Lead_Status: 'Not Contacted',
        Description: description,
      },
    ],
    trigger: ['workflow'], // Fires any Zoho workflows tied to new Lead creation
  };

  try {
    const leadRes = await fetch(`${API_DOMAIN}/crm/v8/Leads`, {
      method: 'POST',
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(leadBody),
    });

    const leadJson = await leadRes.json();

    if (!leadRes.ok) {
      console.error(`Lead create HTTP ${leadRes.status}: ${JSON.stringify(leadJson)}`);
      return { statusCode: 200, body: 'lead create failed' };
    }

    // Zoho returns {data: [{code: "SUCCESS", details: {id: "..."}, ...}]}
    const result = (leadJson.data && leadJson.data[0]) || {};
    if (result.code === 'SUCCESS') {
      console.log(`Lead created: id=${result.details.id} email=${email}`);
      return { statusCode: 200, body: 'lead created' };
    } else {
      console.error(`Lead create non-SUCCESS code=${result.code}: ${JSON.stringify(result)}`);
      return { statusCode: 200, body: 'lead create non-success' };
    }
  } catch (err) {
    console.error('Lead create exception:', err.message);
    return { statusCode: 200, body: 'lead create exception' };
  }
};

import { createClient } from '@supabase/supabase-js';

const json = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  },
  body: JSON.stringify(body)
});

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') return json(200, { ok: true });
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' });

  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return json(500, { error: 'Missing SUPABASE env vars' });
    }

    // Pass user's JWT to Supabase so RLS works
    const authHeader = event.headers.authorization || event.headers.Authorization || '';
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    const payload = JSON.parse(event.body || '{}');
    const {
      listing_id = null,
      type = 'feedback',
      priority = 'normal',
      title = '',
      content = '',
      attachments = null
    } = payload;

    if (!content || String(content).trim().length < 3) {
      return json(400, { error: 'content required' });
    }

    // Get current user
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) return json(401, { error: 'Not logged in' });

    const student_id = userData.user.id;

    const { data, error } = await supabase
      .from('reports')
      .insert([{
        student_id,
        listing_id,
        type,
        priority,
        title,
        content,
        attachments
      }])
      .select('*')
      .single();

    if (error) return json(400, { error: error.message });

    return json(200, { ok: true, report: data });
  } catch (e) {
    return json(500, { error: String(e?.message || e) });
  }
}

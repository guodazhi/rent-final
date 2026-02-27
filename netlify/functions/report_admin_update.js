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
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const ADMIN_PIN = process.env.ADMIN_PIN;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !ADMIN_PIN) {
      return json(500, { error: 'Missing env vars (SUPABASE_URL / SERVICE_ROLE / ADMIN_PIN)' });
    }

    const payload = JSON.parse(event.body || '{}');
    const { pin, report_id, status, priority } = payload;

    if (String(pin || '') !== String(ADMIN_PIN)) return json(403, { error: 'Invalid admin pin' });
    if (!report_id) return json(400, { error: 'report_id required' });

    const allowedStatus = ['open', 'in_progress', 'resolved', 'rejected'];
    const allowedPriority = ['low', 'normal', 'high'];

    const patch = {};
    if (status) {
      if (!allowedStatus.includes(status)) return json(400, { error: 'invalid status' });
      patch.status = status;
    }
    if (priority) {
      if (!allowedPriority.includes(priority)) return json(400, { error: 'invalid priority' });
      patch.priority = priority;
    }
    if (Object.keys(patch).length === 0) return json(400, { error: 'nothing to update' });

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data, error } = await supabaseAdmin
      .from('reports')
      .update(patch)
      .eq('id', report_id)
      .select('*')
      .single();

    if (error) return json(400, { error: error.message });
    return json(200, { ok: true, report: data });
  } catch (e) {
    return json(500, { error: String(e?.message || e) });
  }
}

const { createClient } = require("@supabase/supabase-js");

exports.handler = async (event) => {
  try {
    const url = process.env.SUPABASE_URL;
    const anon = process.env.SUPABASE_ANON_KEY;
    const supabase = createClient(url, anon);

    const qs = event.queryStringParameters || {};
    const campus = (qs.campus || "").trim();
    const q = (qs.q || "").trim();
    const rentType = (qs.rentType || "").trim();
    const bathroom = (qs.bathroom || "").trim();
    const subway = (qs.subway || "").trim();

    let query = supabase
      .from("listings")
      .select("id,title,price,location,contact,description,campus,rent_type,bathroom,subway,photos,approved,status,created_at")
      .eq("approved", true)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(100);

    if (campus) query = query.eq("campus", campus);
    if (rentType) query = query.eq("rent_type", rentType);
    if (bathroom) query = query.eq("bathroom", bathroom);
    if (subway) query = query.eq("subway", subway);
    if (q) query = query.or(`title.ilike.%${q}%,location.ilike.%${q}%,description.ilike.%${q}%`);

    const { data, error } = await query;
    if (error) throw error;

    return resp(200, { items: data || [] });
  } catch (e) {
    return resp(500, { error: e.message || String(e) });
  }
};

function resp(code, body) {
  return {
    statusCode: code,
    headers: corsHeaders(),
    body: JSON.stringify(body),
  };
}
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  };
}

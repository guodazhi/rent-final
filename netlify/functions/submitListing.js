const { createClient } = require("@supabase/supabase-js");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return resp(200, { ok: true });

  try {
    if (event.httpMethod !== "POST") return resp(405, { error: "Method not allowed" });

    const url = process.env.SUPABASE_URL;
    const srv = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(url, srv);

    const body = JSON.parse(event.body || "{}");
    const title = (body.title || "").trim();
    const price = Number(body.price);
    const location = (body.location || "").trim();
    const contact = (body.contact || "").trim();

    if (!title) return resp(400, { error: "title required" });
    if (!Number.isFinite(price)) return resp(400, { error: "price must be number" });
    if (!location) return resp(400, { error: "location required" });
    if (!contact) return resp(400, { error: "contact required" });

    // 这里先不强制登录：直接匿名提交（和你现状一致）
    // 如果你要强制登录，把 landlord_id/student_id 逻辑加进去即可。

    const insert = {
      title,
      price,
      location,
      contact,
      description: (body.description || "").trim() || null,
      campus: body.campus || null,
      rent_type: body.rent_type || null,
      bathroom: body.bathroom || null,
      subway: body.subway || null,
      approved: false,
      status: "active",
      landlord_id: null  // 你之前已允许 landlord_id nullable
    };

    const { error } = await supabase.from("listings").insert(insert);
    if (error) throw error;

    return resp(200, { ok: true });
  } catch (e) {
    return resp(500, { error: e.message || String(e) });
  }
};

function resp(code, body) {
  return { statusCode: code, headers: corsHeaders(), body: JSON.stringify(body) };
}
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  };
}

const { createClient } = require("@supabase/supabase-js");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return resp(200, { ok:true });

  try {
    if (event.httpMethod !== "POST") return resp(405, { error:"Method not allowed" });

    const url = process.env.SUPABASE_URL;
    const srv = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(url, srv);

    const body = JSON.parse(event.body || "{}");
    const content = (body.content || "").trim();
    if (!content) return resp(400, { error:"content required" });

    const { error } = await supabase.from("feedback").insert({
      student_id: null,
      category: body.category || "general",
      content,
      status: "new"
    });
    if (error) throw error;

    return resp(200, { ok:true });
  } catch(e) {
    return resp(500, { error: e.message || String(e) });
  }
};

function resp(code, body){ return { statusCode:code, headers:corsHeaders(), body:JSON.stringify(body)}; }
function corsHeaders(){
  return {
    "Access-Control-Allow-Origin":"*",
    "Access-Control-Allow-Headers":"Content-Type, Authorization",
    "Access-Control-Allow-Methods":"GET,POST,OPTIONS"
  };
}

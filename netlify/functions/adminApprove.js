const { createClient } = require("@supabase/supabase-js");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return resp(200, { ok:true });

  try{
    if (event.httpMethod !== "POST") return resp(405, { error:"Method not allowed" });

    const body = JSON.parse(event.body||"{}");
    const pin = String(body.pin||"").trim();
    if (!pin || pin !== String(process.env.ADMIN_PIN || "")) return resp(401, { error:"Unauthorized" });

    const id = body.id;
    if (!id) return resp(400, { error:"id required" });

    const url = process.env.SUPABASE_URL;
    const srv = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(url, srv);

    const { error } = await supabase.from("listings").update({ approved:true }).eq("id", id);
    if (error) throw error;

    return resp(200, { ok:true });
  }catch(e){
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

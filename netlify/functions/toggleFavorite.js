const { createClient } = require("@supabase/supabase-js");

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return resp(200, { ok:true });

  try{
    if (event.httpMethod !== "POST") return resp(405, { error:"Method not allowed" });

    const url = process.env.SUPABASE_URL;
    const srv = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(url, srv);

    const body = JSON.parse(event.body||"{}");
    const listing_id = body.listing_id;
    if (!listing_id) return resp(400, { error:"listing_id required" });

    // 匿名版本：用 user_id = null（你要强制登录再改）
    const user_id = null;

    const { data: existed } = await supabase
      .from("favorites").select("id").eq("listing_id", listing_id).is("user_id", null).limit(1);

    if (existed && existed.length) {
      const { error } = await supabase.from("favorites").delete().eq("id", existed[0].id);
      if (error) throw error;
      return resp(200, { ok:true, removed:true });
    } else {
      const { error } = await supabase.from("favorites").insert({ user_id, listing_id });
      if (error) throw error;
      return resp(200, { ok:true, added:true });
    }
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

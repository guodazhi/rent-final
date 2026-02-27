const { createClient } = require("@supabase/supabase-js");

exports.handler = async (event) => {
  try{
    const pin = (event.queryStringParameters?.pin || "").trim();
    if (!pin || pin !== String(process.env.ADMIN_PIN || "")) return resp(401, { error:"Unauthorized" });

    const url = process.env.SUPABASE_URL;
    const srv = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(url, srv);

    const { data, error } = await supabase
      .from("listings")
      .select("id,title,price,location,contact,description,created_at,approved")
      .eq("approved", false)
      .order("created_at", { ascending:false })
      .limit(200);

    if (error) throw error;
    return resp(200, { items: data||[] });
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

const { createClient } = require("@supabase/supabase-js");

exports.handler = async (event) => {
  try{
    const url = process.env.SUPABASE_URL;
    const anon = process.env.SUPABASE_ANON_KEY;
    const supabase = createClient(url, anon);

    // 匿名版本：user_id = null
    const { data, error } = await supabase
      .from("favorites")
      .select("listing_id, listings(id,title,price,location)")
      .is("user_id", null)
      .order("created_at", { ascending:false })
      .limit(100);

    if (error) throw error;

    const items = (data||[]).map(x=>({
      id: x.listings?.id,
      title: x.listings?.title,
      price: x.listings?.price,
      location: x.listings?.location
    })).filter(x=>x.id);

    return resp(200, { items });
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

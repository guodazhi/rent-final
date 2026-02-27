// netlify/functions/submit.js
const { createClient } = require("@supabase/supabase-js");

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
  "Content-Type": "application/json",
};

exports.handler = async (event) => {
  try {
    // CORS preflight
    if (event.httpMethod === "OPTIONS") {
      return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
    }

    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: "Method Not Allowed" }),
      };
    }

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: "Missing env vars: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY",
        }),
      };
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = event.body ? JSON.parse(event.body) : {};
    const title = (body.title || "").trim();
    const price = Number(body.price);
    const location = (body.location || "").trim();
    const contact = (body.contact || "").trim();
    const description = (body.description || "").trim();

    if (!title || Number.isNaN(price)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "title and price are required" }),
      };
    }

    const insertData = {
      title,
      price,
      location: location || null,
      contact: contact || null,
      description: description || null,
      approved: false,
      // landlord_id 现在你已经允许 null 了，所以不传也可以
    };

    const { data, error } = await supabase
      .from("listings")
      .insert([insertData])
      .select()
      .single();

    if (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: error.message, detail: error.details || null }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: true, listing: data }),
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: String(e && e.message ? e.message : e) }),
    };
  }
};

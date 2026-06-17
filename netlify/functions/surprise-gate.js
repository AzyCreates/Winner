const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

exports.handler = async (event, context) => {
    // 1. Check if the surprise is still active
    const { data, error } = await supabase
        .from('surprise_status')
        .select('is_active')
        .eq('id', 1)
        .single();

    if (!data || !data.is_active) {
        // Surprise is already gone! Redirect to Facebook.
        return { statusCode: 302, headers: { Location: 'https://facebook.com/otwlimay' } };
    }

    // 2. DISABLE the surprise immediately (The "One-Time" Lock)
    await supabase.from('surprise_status').update({ is_active: false }).eq('id', 1);

    // 3. Return the Surprise HTML
    return {
        statusCode: 200,
        headers: { "Content-Type": "text/html" },
        body: `<!DOCTYPE html>... (Insert the surprise.html code here) ...`
    };
};

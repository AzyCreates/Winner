const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

exports.handler = async (event, context) => {
    // 1. Check if the surprise is active
    const { data } = await supabase
        .from('surprise_status')
        .select('is_active')
        .eq('id', 1)
        .single();

    if (!data || !data.is_active) {
        // Surprise already claimed or inactive: Redirect to Facebook
        return { statusCode: 302, headers: { Location: 'https://facebook.com/otwlimay' } };
    }

    // 2. Flip the switch to FALSE (One-time use)
    await supabase.from('surprise_status').update({ is_active: false }).eq('id', 1);

    // 3. Return your Surprise HTML
    return {
        statusCode: 200,
        headers: { "Content-Type": "text/html" },
        body: `<!DOCTYPE html>
        <html>
        <head>
            <meta http-equiv="refresh" content="10;url=https://facebook.com/otwlimay">
            <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js"></script>
            <style>
                body { background: #1a1a2e; color: white; text-align: center; font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
                .container { padding: 40px; border: 2px solid #fff; border-radius: 20px; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🎉 You won the surprise!</h1>
                <p>Screenshot this: <b>SURPRISE-WINNER</b></p>
                <script>confetti();</script>
            </div>
        </body>
        </html>`
    };
};

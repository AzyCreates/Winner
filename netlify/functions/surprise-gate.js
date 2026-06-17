const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

exports.handler = async (event, context) => {
    // Attempt to update the row ONLY if is_active is currently true
    const { data, error } = await supabase
        .from('surprise_status')
        .update({ is_active: false })
        .eq('id', 1)        // Target your specific row
        .eq('is_active', true) // Only update if it is still true
        .select();          // Check if any row was updated

    // If 'data' is empty or null, it means no row was updated (already false)
    if (!data || data.length === 0) {
        return { 
            statusCode: 302, 
            headers: { Location: 'https://facebook.com/otwlimay' } 
        };
    }

    // IF WE ARE HERE: The update was successful! This is the ONE winner.
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

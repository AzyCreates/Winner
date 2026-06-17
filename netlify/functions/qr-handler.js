const express = require('express');
const serverless = require('serverless-http');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

app.get('/.netlify/functions/qr-handler', async (req, res) => {
    const FACEBOOK_URL = 'https://facebook.com/otwlimay';
    const WINNING_SCAN = 100;

    // 1. Log the scan
    await supabase.from('qr_analytics').insert([{ user_agent: req.headers['user-agent'] }]);

    // 2. Get count
    const { count } = await supabase.from('qr_analytics').select('*', { count: 'exact', head: true });

    // 3. Conditional logic
    if (count === WINNING_SCAN) {
        return res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta http-equiv="refresh" content="10;url=${FACEBOOK_URL}">
                <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js"></script>
                <style>body{background:#1a1a2e;color:white;text-align:center;font-family:sans-serif;padding:20px;}</style>
            </head>
            <body>
                <h1>🎉 You're the winner!</h1>
                <p>Screenshot this: <b>SURPRISE100</b></p>
                <div id="timer">10</div>
                <script>
                    confetti();
                    let t=10; setInterval(() => { t--; document.getElementById('timer').innerText=t; if(t<=0) window.location='${FACEBOOK_URL}'; }, 1000);
                </script>
            </body>
            </html>
        `);
    }
    return res.redirect(FACEBOOK_URL);
});

module.exports.handler = serverless(app);

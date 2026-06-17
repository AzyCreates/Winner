const express = require('express');
const mysql = require('mysql2/promise');
const app = express();
const PORT = process.env.PORT || 3000;

// --- Configuration ---
const TARGET_WINNING_SCAN = 100; // The exact scan number that gets the surprise
const FACEBOOK_PAGE_URL = 'https://facebook.com/otwlimay';

// --- Database Connection Pool ---
// Replace these values with your actual database credentials
const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'process.env.DB_PASSWORD',
    database: 'your_database_name',
    waitForConnections: true,
    connectionLimit: 10
});

// Trust proxies if you are deploying on a service like Render, Heroku, etc.
app.set('trust proxy', true);

// --- Core QR Routing Endpoint ---
app.get('/qr-handler', async (req, res) => {
    try {
        const ip = req.ip || req.headers['x-forwarded-for'] || 'Unknown';
        const userAgent = req.headers['user-agent'] || 'Unknown';

        // 1. Log the scan into the database
        const [insertResult] = await pool.execute(
            'INSERT INTO qr_analytics (user_agent, ip_address) VALUES (?, ?)',
            [userAgent, ip]
        );
        
        // 2. Check the current total scan count
        const [[countResult]] = await pool.execute(
            'SELECT COUNT(*) as total_scans FROM qr_analytics'
        );
        const currentScanCount = countResult.total_scans;

        // 3. Conditional Routing (The Surprise Trigger)
        if (currentScanCount === TARGET_WINNING_SCAN) {
            
            // Mark this scan as the winner in the database
            await pool.execute(
                'UPDATE qr_analytics SET is_winner = 1 WHERE id = ?',
                [insertResult.insertId]
            );

            // Serve the mobile-optimized, 10-second timer page with confetti
            return res.send(`
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
                    <meta http-equiv="refresh" content="10;url=${FACEBOOK_PAGE_URL}">
                    <title>Surprise!</title>
                    <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js"></script>
                    <style>
                        body {
                            margin: 0;
                            padding: 0;
                            background-color: #1a1a2e;
                            color: white;
                            font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                            height: 100vh;
                            display: flex;
                            flex-direction: column;
                            justify-content: center;
                            align-items: center;
                            text-align: center;
                            overflow: hidden;
                        }
                        .container {
                            padding: 30px;
                            max-width: 90%;
                            background: rgba(255, 255, 255, 0.1);
                            border-radius: 20px;
                            backdrop-filter: blur(10px);
                            box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
                            border: 1px solid rgba(255, 255, 255, 0.18);
                            z-index: 10;
                        }
                        .timer-container {
                            margin-bottom: 20px;
                        }
                        #timer {
                            font-size: 5rem;
                            font-weight: 900;
                            color: #ff4757;
                            text-shadow: 2px 2px 10px rgba(255, 71, 87, 0.5);
                            line-height: 1;
                        }
                        .timer-label {
                            font-size: 1rem;
                            text-transform: uppercase;
                            letter-spacing: 2px;
                            color: #a4b0be;
                            margin-top: 5px;
                        }
                        h1 {
                            font-size: 1.8rem;
                            line-height: 1.4;
                            margin: 20px 0;
                            color: #f1f2f6;
                        }
                        .urgent-text {
                            color: #ffa502;
                            font-weight: bold;
                            font-size: 1.2rem;
                            animation: pulse 1s infinite alternate;
                        }
                        @keyframes pulse {
                            from { opacity: 1; transform: scale(1); }
                            to { opacity: 0.8; transform: scale(1.05); }
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="timer-container">
                            <div id="timer">10</div>
                            <div class="timer-label">Seconds Left</div>
                        </div>
                        
                        <div class="urgent-text">QUICK!</div>
                        <h1>Screenshot this and show in the counter for a surprise</h1>
                    </div>

                    <script>
                        // Continuous Confetti Logic
                        const end = Date.now() + 10 * 1000;
                        const colors = ['#ff4757', '#ffa502', '#2ed573', '#1e90ff', '#ffffff'];

                        (function frame() {
                            confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0 }, colors: colors });
                            confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1 }, colors: colors });
                            if (Date.now() < end) {
                                requestAnimationFrame(frame);
                            }
                        }());

                        // Countdown Timer and Redirect Logic
                        let timeLeft = 10;
                        const timerElement = document.getElementById('timer');
                        const targetUrl = '${FACEBOOK_PAGE_URL}';
                        
                        const countdownInterval = setInterval(() => {
                            timeLeft--;
                            timerElement.innerText = timeLeft;
                            
                            if (timeLeft <= 3) {
                                timerElement.style.color = '#ff6348'; 
                            }

                            if (timeLeft <= 0) {
                                clearInterval(countdownInterval);
                                window.location.href = targetUrl;
                            }
                        }, 1000);
                    </script>
                </body>
                </html>
            `);
        }

        // 4. Default Action: Redirect everyone else (or the winner if they refresh) to Facebook
        return res.redirect(302, FACEBOOK_PAGE_URL);

    } catch (error) {
        console.error('Database routing error:', error);
        // Fallback to Facebook if the database connection fails
        return res.redirect(302, FACEBOOK_PAGE_URL);
    }
});

// --- Start the Server ---
app.listen(PORT, () => {
    console.log(`QR Router Server running on port ${PORT}`);
    console.log(`Target Facebook Page: ${FACEBOOK_PAGE_URL}`);
    console.log(`Winning scan configured for scan #${TARGET_WINNING_SCAN}`);
});

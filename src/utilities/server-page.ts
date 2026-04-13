import 'dotenv/config';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { env, prefix } from './env';

const homePage = (app: FastifyInstance, apiPaths: string[]) => {
	app.get('/', async (_request: FastifyRequest, reply: FastifyReply) => {
		const htmlString = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>OmniMock Dashboard</title>
        <style>
            :root {
                --bg-main: #23272F;
                --bg-card: #2D333B;
                --accent: #4F8A8B;
                --accent2:rgb(1, 25, 75);
                --text-main: #F9F9F9;
                --text-muted: #A7A9BE;
                --border-radius: 14px;
                --shadow: 0 4px 24px rgba(0,0,0,0.3);
            }
            html, body {
                margin: 0;
                padding: 0;
                min-height: 100vh;
                color: var(--text-main);
                font-family: 'Segoe UI', 'Roboto', 'Arial', sans-serif;
                background: linear-gradient(120deg, #20232a 0%, #23272F 70%, #0d1117 100%);
            }
            body {
                min-height: 100vh;
                width: 100vw;
       
            }
            main {
               
                padding: 56px 3vw 40px 3vw;
                width: 95vw;
                max-width: 800px;
                min-width: 320px;
                margin: 48px auto 32px auto;
                display: flex;
                flex-direction: column;
                align-items: stretch;
                gap: 32px;
                transition: box-shadow 0.2s, background 0.2s, max-width 0.2s;
            }
            @media (max-width: 700px) {
                main {
                    max-width: 99vw;
                    padding: 18px 2vw;
                    gap: 16px;
                }
            }
            .info-sticky {
                position: sticky;
                top: 0;
                z-index: 2;
              
                border-radius: 12px;
             
                padding: 16px 0 10px 0;
                margin-bottom: 18px;
                backdrop-filter: blur(2px);
            }
            @media (max-width: 700px) {
                .info-sticky {
                    margin-left: -2vw;
                    margin-right: -2vw;
                    padding-left: 2vw;
                    padding-right: 2vw;
                }
            }
            .running-dots {
                display: inline-block;
                width: 2.2em;
                min-width: 2.2em;
                letter-spacing: 0.2em;
                vertical-align: middle;
                font-family: monospace;
                font-size: 1.1em;
                text-align: left;
                overflow: hidden;
                white-space: pre;
                
            }
            h1 {
                text-align: center;
                
            }
            .status-box {
                display: flex;
                justify-content: center;
                align-items: center;
                margin: 0 auto 0.2em auto;
                padding-bottom:0.9em;
               
            }
            .status {
                display: inline-flex;
                align-items: center;
              
              
            }
            .status-tick {
                display: inline-block;
                width: 1.1em;
                height: 1.1em;
                padding-right:0.2em;
          
            }
            .status-online {
                background: var(--accent);
            }
            .status-offline {
                background:rgb(126, 80, 78); /* Red color for offline */
            }

            @media (max-width: 700px) {
                main {
                    max-width: 99vw;
                    padding: 18px 1vw;
                    gap: 16px;
                }
                h1 {
                    font-size: 1.5rem;
                }
            }
            @media (min-width: 900px) {
                main {
                    width: 60vw;
                    max-width: 600px;
                    padding: 64px 56px 48px 56px;
                }
                h1 {
                    font-size: 2.4rem;
                }
            }
            @media (min-width: 1200px) {
                main {
                    width: 40vw;
                    max-width: 800px;
                    padding: 72px 80px 56px 80px;
                }
                h1 {
                    font-size: 2.8rem;
                }
            }
            @media (min-width: 1600px) {
                main {
                    width: 32vw;
                    max-width: 900px;
                    padding: 84px 120px 72px 120px;
                }
                h1 {
                    font-size: 3.2rem;
                }
            }
            .endpoints {
                display: flex;
                flex-direction: column;
                gap: 14px;
                margin: 18px 0 12px 0;
                align-items: center;
            }
            .endpoint-link {
                display: block;
                background: #5b8ca6;
                color: #fff;
                text-decoration: none;
                padding: 12px 0;
                border-radius: 8px;
                font-size: 1.06rem;
                font-weight: 500;
                border: 1.5px solid #446a7c;
                box-shadow: 0 1.5px 6px rgba(30,60,90,0.07);
                transition: 1s ease-in-out;
                width: 100%;
                max-width: 520px;
                text-align: center;
                letter-spacing: 0.5px;
                cursor: pointer;
            }
            .endpoint-link:hover, .endpoint-link:focus {
                background: #22496a;
                color: #fff;
                box-shadow: 0 4px 16px rgba(1,25,75,0.14);
                outline: none;
                
            }
            h1 {
                font-size: 2.4rem;
                font-weight: 700;
                letter-spacing: 1px;
                text-align: center;
            }

            h6 {
            text-align:right;
            font-style:italic;
            font-weight:normal;
            margin-top:0;
            margin-right:50px;
            color:var(--text-muted);
            }

            .status {
                display: inline-block;
                color: #fff; /* Removed background here to be set dynamically */
                border-radius: 8px;
                padding: 8px 16px;
                font-size: 1.1rem;
                font-weight: 600;
                margin-left: 10px;
                letter-spacing: 0.5px;
                box-shadow: 0 2px 8px rgba(79,138,139,0.12);
                position: relative;
            }
            section.info {
                margin-bottom: 16px;
            }
            .info-list {
                list-style: none;
                padding: 0;
                margin: 0;
            }
            .info-list li {
                margin-bottom: 10px;
                font-size: 1.1rem;
                color: var(--text-main);
            }
            .info-label {
                color: var(--text-muted);
                font-weight: 500;
                margin-right: 8px;
            }
            .highlight {
                background: var(--accent2);
                padding: 4px 10px;
                border-radius: 6px;
                color: #fff;
                font-weight: 600;
                letter-spacing: 0.5px;
                font-size: 1rem;
            }
            .endpoints {
                display: flex;
                flex-direction: column;
                gap: 12px;
                margin: 18px 0 12px 0;
            }
            .endpoint-link {
                display: inline-block;
                background: var(--accent);
                color: #fff;
                text-decoration: none;
                padding: 10px 18px;
                border-radius: 8px;
                font-size: 1.04rem;
                font-weight: 500;
                box-shadow: 0 2px 8px rgba(79,138,139,0.06);
                transition: background 0.2s, color 0.2s, box-shadow 0.2s;
                border: none;
            }
            .endpoint-link:hover, .endpoint-link:focus {
                background: var(--accent2);
                color: #fff;
                box-shadow: 0 4px 16px rgba(255,92,88,0.14);
                outline: none;
            }
            .logs-link {
                color: var(--accent1);
                text-decoration: underline;
                font-weight: 500;
                transition: color 0.2s;
                
            }
            .logs-link:hover, .logs-link:focus {
                color: var(--accent);
            }
            .note {
                color: var(--text-muted);
                font-size: 0.98rem;
                margin-top: 18px;
                text-align: center;
            }
            .mcp-connect-btn {
                display: inline-block;
                margin: 12px auto 0 auto;
                padding: 10px 22px;
                background: var(--accent2);
                color: #fff;
                border: none;
                border-radius: 8px;
                font-size: 1.08rem;
                font-weight: 600;
                letter-spacing: 0.5px;
                box-shadow: 0 2px 8px rgba(1,25,75,0.10);
                cursor: pointer;
                transition: background 0.2s, color 0.2s, box-shadow 0.2s;
            }
            .mcp-connect-btn:hover, .mcp-connect-btn:focus {
                background: var(--accent);
                color: #fff;
                box-shadow: 0 4px 16px rgba(79,138,139,0.18);
                outline: none;
            }
            .mcp-modal {
                display: none;
                position: fixed;
                z-index: 1000;
                left: 0;
                top: 0;
                width: 100vw;
                height: 100vh;
                background: rgba(0,0,0,0.45);
                justify-content: center;
                align-items: center;
            }
            .mcp-modal.active {
                display: flex;
            }
            .mcp-modal-content {
                background: var(--bg-card);
                color: var(--text-main);
                padding: 32px 24px 24px 24px;
                border-radius: 14px;
                box-shadow: 0 8px 32px rgba(0,0,0,0.25);
                max-width: 480px;
                width: 95vw;
                text-align: left;
                position: relative;
            }
            .mcp-modal-content pre {
                background: #181c23;
                color: #fff;
                padding: 14px;
                border-radius: 8px;
                font-size: 0.98rem;
                overflow-x: auto;
                margin-bottom: 18px;
            }
            .mcp-modal-content button.copy-btn {
                background: var(--accent);
                color: #fff;
                border: none;
                border-radius: 6px;
                padding: 7px 16px;
                font-size: 1rem;
                font-weight: 500;
                cursor: pointer;
                margin-right: 8px;
            }
            .mcp-modal-content button.close-btn {
                background: #444;
                color: #fff;
                border: none;
                border-radius: 6px;
                padding: 7px 16px;
                font-size: 1rem;
                font-weight: 500;
                cursor: pointer;
                position: absolute;
                top: 12px;
                right: 12px;
            }
        </style>
        <main>
            <section class="info-sticky">
              <h6 cy-data="server_version">Version: ${process.env?.npm_package_version ?? 'N/A'}</h6>
                <h1>OmniMock Server</h1>
                <div class="status-box" cy-data="server_status">
                    <span class="status" id="server-status">
                        <span class="status-tick" id="status-icon" aria-label="running" title="Running">
                            <!-- SVG will be dynamically updated here -->
                        </span>
                        <span id="status-text">Checking...</span>
                        <span class="running-dots"></span>
                    </span>
                </div>
                <ul class="info-list">
                    <li><span class="info-label" cy-data="server_address">Server Address:</span><span class="highlight" cy-data="server_address">localhost</span></li>
                    <li><span class="info-label" cy-data="server_port">Server Port:</span><span class="highlight" cy-data="server_port">${env?.SERVER_PORT?.toUpperCase() ?? 'NONE'}</span></li>
                    <li><span class="info-label" cy-data="server_prefix">Server URL Prefix:</span><span class="highlight" cy-data="url_prefix">${env?.USE_API_URL_PREFIX?.toLowerCase() ?? 'NONE'}</span></li>
                </ul>
            </section>
            <section>
                <div style="margin-bottom: 8px; font-size: 1.13rem; color: var(--text-muted); font-weight: 600;" cy-data="server_label">API endpoints*</div>
                <div class="endpoints">
                    ${apiPaths.map((path) => `<a class="endpoint-link" cy-data="endpoint" href="/${prefix}${path}">/${prefix}${path}</a>`).join('')}
                </div>
            </section>
            <section>
                <div style="margin-bottom: 6px; font-size: 1.13rem; color: var(--text-muted); font-weight: 600;">Logs URL:&nbsp; <span><a class="logs-link" href="/logs">localhost:${process.env?.SERVER_PORT}/logs</a> </span></div>
                
            </section>
            <div class="note">
                * Add new API endpoints to the <b>api</b> folder.<br/>
                For media endpoints, include the media name in the URL (e.g., <code>/images/placeholder.png</code>).
            </div>
            <button class="mcp-connect-btn" id="mcp-connect-btn">Connect to MCP Server</button>
            <div class="mcp-modal" id="mcp-modal">
              <div class="mcp-modal-content">
                <button class="close-btn" id="mcp-modal-close">Close</button>
                <h2 style="margin-top:0;">Connect to MCP Server</h2>
                <p>Copy and paste the following configuration into your client (Claude, Windsurf, Cursor, etc.):</p>
                <pre id="mcp-config-json">{
  "mcpServers": {
    "LocalMockAPIServer": {
      "command": "node",
      "args": [
        "&lt;absolute-path-to-your-project&gt;/src/mcp/server.js"
      ]
    }
  }
}</pre>
                <button class="copy-btn" id="mcp-copy-btn">Copy</button>
                <span id="mcp-copy-status" style="font-size:0.98rem;"></span>
                <p style="margin-top:18px;font-size:0.98rem;color:var(--text-muted);">Replace <code>&lt;absolute-path-to-your-project&gt;</code> with the full path to your project directory and remember to use the path format suitable for your system (E.g &#92;&#92; on Windows).</p>
              </div>
            </div>
        </main>
        <script>
        document.addEventListener('DOMContentLoaded', function() {
            var dots = document.querySelector('.running-dots');
            let dotsInterval = null; // Declare dotsInterval here

            const statusIcon = document.getElementById('status-icon');
            const statusText = document.getElementById('status-text');
            const serverStatus = document.getElementById('server-status');
           
            const onlineSvg = '<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="10" fill="#2ecc40"/><path d="M6 10.5l3 3 5-6.5" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
            const offlineSvg = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" fill="#ff4136"/><path d="M15 9L9 15M9 9L15 15" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
           
            async function checkServerStatus() {
                try {
                    const response = await fetch('/ping'); // Assuming a /ping endpoint for status
                    if (response.ok) {
                        statusIcon.innerHTML = onlineSvg;
                        statusText.textContent = 'Running';
                        serverStatus.classList.remove('status-offline');
                        serverStatus.classList.add('status-online');
                        if (dots) {
                            dots.style.display = 'inline-block'; // Show dots
                            if (!dotsInterval) { // Start animation only if not already running
                                let count = 1, step = 1;
                                dotsInterval = setInterval(() => {
                                    dots.textContent = '.'.repeat(count);
                                    count += step;
                                    if (count === 3 || count === 1) step *= -1;
                                }, 300);
                            }
                        }
                    } else {
                        throw new Error('Server not OK');
                    }
                } catch (error) {
                    statusIcon.innerHTML = offlineSvg;
                    statusText.textContent = 'Not Running';
                    serverStatus.classList.remove('status-online');
                    serverStatus.classList.add('status-offline');
                    if (dots) {
                        if (dotsInterval) { // Stop animation if running
                            clearInterval(dotsInterval);
                            dotsInterval = null;
                        }
                        dots.textContent = ''; // Clear dots
                        dots.style.display = 'none'; // Hide dots
                    }
                }
            }
           
            // Initial check
            checkServerStatus();
           
            // Check every 10 seconds
            setInterval(checkServerStatus, 2000);
        });
        const mcpBtn = document.getElementById('mcp-connect-btn');
        const mcpModal = document.getElementById('mcp-modal');
        const mcpModalClose = document.getElementById('mcp-modal-close');
        const mcpCopyBtn = document.getElementById('mcp-copy-btn');
        const mcpCopyStatus = document.getElementById('mcp-copy-status');
        if (mcpBtn && mcpModal && mcpModalClose) {
            mcpBtn.addEventListener('click', function() {
                mcpModal.classList.add('active');
            });
            mcpModalClose.addEventListener('click', function() {
                mcpModal.classList.remove('active');
                mcpCopyStatus.textContent = '';
            });
            mcpModal.addEventListener('click', function(e) {
                if (e.target === mcpModal) {
                    mcpModal.classList.remove('active');
                    mcpCopyStatus.textContent = '';
                }
            });
        }
        if (mcpCopyBtn) {
            mcpCopyBtn.addEventListener('click', function() {
                const configText = document.getElementById('mcp-config-json').innerText;
                navigator.clipboard.writeText(configText).then(function() {
                    mcpCopyStatus.textContent = 'Copied!';
                    setTimeout(() => { mcpCopyStatus.textContent = ''; }, 1500);
                }, function() {
                    mcpCopyStatus.textContent = 'Failed to copy.';
                });
            });
        }
        </script>
    </body>
    </html>
    `;

		reply.header('Content-Type', 'text/html').send(htmlString);
	});

	app.get('/ping', async (_request: FastifyRequest, reply: FastifyReply) => {
		reply.code(200).send({ response: 'server is running' });
	});
};

export default homePage;

import { NewSession } from "./auth";

export function ConsolePage(): Response {
    const token = NewSession()
    const page = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>URL Shortener Console</title>
  <style>
    :root {
      --bg: #f2efe9;
      --surface: #fffaf2;
      --text: #2a241f;
      --muted: #6b5e50;
      --accent: #16666b;
      --accent-2: #f3a447;
      --border: #d8cbbd;
      --danger: #9f2a2a;
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      min-height: 100vh;
      font-family: "Trebuchet MS", "Segoe UI", sans-serif;
      background:
        radial-gradient(circle at 10% 10%, #fff7eb 0%, transparent 32%),
        radial-gradient(circle at 90% 90%, #e8f5f5 0%, transparent 30%),
        var(--bg);
      color: var(--text);
      display: grid;
      place-items: center;
      padding: 24px;
    }

    .panel {
      width: min(560px, 100%);
      background: linear-gradient(180deg, #fffdf9 0%, var(--surface) 100%);
      border: 1px solid var(--border);
      border-radius: 14px;
      box-shadow: 0 18px 40px rgba(58, 46, 32, 0.12);
      padding: 24px;
      animation: fade-in 350ms ease-out;
    }

    h1 {
      margin: 0 0 8px;
      font-size: 1.6rem;
      letter-spacing: 0.02em;
    }

    p {
      margin: 0 0 18px;
      color: var(--muted);
    }

    form {
      display: grid;
      gap: 12px;
    }

    label {
      display: grid;
      gap: 6px;
      font-size: 0.95rem;
      font-weight: 600;
    }

    input {
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 10px 12px;
      font-size: 1rem;
      color: var(--text);
      background: #fff;
    }

    input:focus {
      outline: 2px solid color-mix(in srgb, var(--accent) 30%, white);
      border-color: var(--accent);
    }

    button {
      border: 0;
      border-radius: 10px;
      padding: 11px 14px;
      font-size: 1rem;
      font-weight: 700;
      color: #fff;
      background: linear-gradient(90deg, var(--accent), #1e7f86);
      cursor: pointer;
      transition: transform 120ms ease, box-shadow 120ms ease;
    }

    button:hover {
      transform: translateY(-1px);
      box-shadow: 0 10px 20px rgba(22, 102, 107, 0.25);
    }

    .note {
      margin-top: 8px;
      font-size: 0.85rem;
      color: var(--muted);
    }

    #status {
      margin-top: 12px;
      padding: 10px 12px;
      border-radius: 10px;
      background: #fff;
      border: 1px solid var(--border);
      min-height: 40px;
      white-space: pre-wrap;
    }

    .ok {
      border-color: #7db58a !important;
      color: #245c31;
    }

    .err {
      border-color: #d79797 !important;
      color: var(--danger);
    }

    @keyframes fade-in {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
  </style>
</head>
<body>
  <main class="panel">
    <h1>Create a short URL</h1>
    <p>Set your short path and destination URL. A session token is stored in the browser and sent with each submission.</p>

    <form id="create-form">
      <label>
        Short path
        <input id="alias_path" name="alias_path" placeholder="my-link" required />
      </label>

      <label>
        Destination URL
        <input id="dest" name="dest" type="url" placeholder="https://example.com" required />
      </label>

      <button type="submit">Create / Update Link</button>
      <div class="note">Allowed path chars: letters, numbers, and URL-safe symbols.</div>
    </form>

    <div id="status" aria-live="polite">Ready.</div>
  </main>

  <script>
    const SESSION_KEY = "urlshortener_session";
    const issuedToken = "${token}";

    if (!localStorage.getItem(SESSION_KEY)) {
      localStorage.setItem(SESSION_KEY, issuedToken);
    }

    const form = document.getElementById("create-form");
    const statusBox = document.getElementById("status");

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      statusBox.classList.remove("ok", "err");
      statusBox.textContent = "Submitting...";

      const aliasPath = document.getElementById("alias_path").value.trim();
      const dest = document.getElementById("dest").value.trim();

      const token = localStorage.getItem(SESSION_KEY) || issuedToken;
      localStorage.setItem(SESSION_KEY, token);

      try {
        const response = await fetch("/api/v1/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Session-Token": token
          },
          body: JSON.stringify({ alias_path: aliasPath, dest })
        });

        const message = await response.text();
        statusBox.textContent = response.ok
          ? "Saved. Alias available at /url/" + aliasPath
          : "Request failed (" + response.status + "): " + message;
        statusBox.classList.add(response.ok ? "ok" : "err");
      } catch (error) {
        statusBox.textContent = "Network error: " + (error && error.message ? error.message : String(error));
        statusBox.classList.add("err");
      }
    });
  </script>
</body>
</html>`;

    return new Response(page, {
        headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-store"
        }
    })
}

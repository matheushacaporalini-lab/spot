import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config(); // carrega variáveis do .env

const app = express();
app.use(cors());
app.use(express.json());

// 🔑 Variáveis vindas do .env
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const SCOPES = "user-read-currently-playing user-read-playback-state";

// -------------------------
// ROTAS DE API
// -------------------------

// 1) Login → redireciona para o Spotify
app.get("/login", (req, res) => {
  const authUrl = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES)}`;
  res.redirect(authUrl);
});

// 2) Callback → troca "code" por tokens
app.get("/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.redirect("/?error=missing_code");

  const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");

  const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": `Basic ${basic}`
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI
    }),
  });

  const data = await tokenResponse.json();

  if (data.error) {
    return res.redirect(`/?error=${encodeURIComponent(data.error_description || data.error)}`);
  }

  const q = new URLSearchParams({
    access_token: data.access_token || "",
    refresh_token: data.refresh_token || "",
    expires_in: String(data.expires_in || 0)
  }).toString();

  res.redirect(`/?${q}`);
});

// 3) Refresh → pega novo access_token
app.post("/refresh", async (req, res) => {
  let body = "";
  req.on("data", chunk => body += chunk.toString());
  req.on("end", async () => {
    try {
      const { refresh_token } = JSON.parse(body || "{}");
      if (!refresh_token) {
        return res.status(400).json({ error: "missing_refresh_token" });
      }

      const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");

      const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": `Basic ${basic}`
        },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token
        }),
      });

      const data = await tokenResponse.json();
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: "refresh_failed", detail: String(e) });
    }
  });
});

// -------------------------
// SERVIR FRONTEND
// -------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// serve arquivos estáticos (index.html e outros)
app.use(express.static(__dirname));

// fallback → qualquer rota não encontrada retorna index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

const PORT = process.env.PORT || 8800;
app.listen(PORT, () => console.log("Servidor rodando na porta " + PORT));


const PORT = process.env.PORT || 8800;
app.listen(PORT, () => console.log("Servidor rodando na porta " + PORT));

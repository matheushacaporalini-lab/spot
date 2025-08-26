import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// 🔑 coloque seus dados aqui direto
const CLIENT_ID = "SEU_CLIENT_ID_AQUI";
const CLIENT_SECRET = "SEU_CLIENT_SECRET_AQUI";
const REDIRECT_URI = "https://spoty2.onrender.com/callback"; // precisa estar cadastrado no Spotify dashboard

// 1) Login → redireciona pro Spotify
app.get("/login", (req, res) => {
  const scopes = "user-read-currently-playing user-read-playback-state";
  const authUrl = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(scopes)}`;
  res.redirect(authUrl);
});

// 2) Callback → troca "code" por tokens
app.get("/callback", async (req, res) => {
  const code = req.query.code;

  const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": "Basic " + Buffer.from(CLIENT_ID + ":" + CLIENT_SECRET).toString("base64"),
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: REDIRECT_URI,
    }),
  });

  const data = await tokenResponse.json();
  console.log("Tokens recebidos:", data);

  res.redirect(`/?access_to_

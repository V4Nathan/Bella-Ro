// POST /api/admin/foto?produto=ID&tam=s|l  — corpo: imagem (já redimensionada no navegador)
import { put } from "@vercel/blob";
import crypto from "node:crypto";
import { exigirLogin, json } from "../_lib.js";

const TIPOS = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png" };

export async function POST(request) {
  const bloqueio = exigirLogin(request);
  if (bloqueio) return bloqueio;
  const url = new URL(request.url);
  const produto = (url.searchParams.get("produto") || "novo").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 60) || "novo";
  const tam = url.searchParams.get("tam") === "s" ? "s" : "l";
  const tipo = (request.headers.get("content-type") || "").split(";")[0];
  if (!TIPOS[tipo]) return json({ erro: "Formato de imagem não aceito." }, 415);
  const corpo = await request.arrayBuffer();
  if (!corpo.byteLength) return json({ erro: "Imagem vazia." }, 400);
  if (corpo.byteLength > 4 * 1024 * 1024) return json({ erro: "Imagem grande demais (máx. 4 MB)." }, 413);
  const nome = `fotos/${produto}/${Date.now()}-${crypto.randomBytes(4).toString("hex")}-${tam}.${TIPOS[tipo]}`;
  try {
    // Fotos precisam ser públicas para aparecer no site
    const res = await put(nome, Buffer.from(corpo), { access: "public", contentType: tipo, addRandomSuffix: false, cacheControlMaxAge: 31536000 });
    return json({ ok: true, url: res.url });
  } catch (e) {
    return json({ erro: "Falha ao enviar a foto: " + e.message }, 500);
  }
}

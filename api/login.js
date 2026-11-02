// POST /api/login  { senha }
import { senhaConfere, cookieSessao, json } from "./_lib.js";

export async function POST(request) {
  if (!process.env.ADMIN_PASSWORD) return json({ erro: "A senha do admin ainda não foi configurada na Vercel." }, 503);
  let corpo = {};
  try { corpo = await request.json(); } catch {}
  await new Promise((r) => setTimeout(r, 400)); // freia tentativas
  if (!senhaConfere(corpo.senha)) return json({ erro: "Senha incorreta." }, 401);
  return json({ ok: true }, 200, { "set-cookie": cookieSessao() });
}

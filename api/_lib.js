// Funções compartilhadas da API (arquivos que começam com _ não viram rotas na Vercel)
import { put, get } from "@vercel/blob";
import crypto from "node:crypto";

export const ACCESS = process.env.BLOB_ACCESS === "private" ? "private" : "public";
const CAMINHO = "data/catalogo.json";
const COOKIE = "br_admin";
const DURACAO = 60 * 60 * 24 * 14; // 14 dias

export function json(dados, status = 200, extra = {}) {
  return new Response(JSON.stringify(dados), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...extra }
  });
}

function chave() {
  const base = process.env.SESSION_SECRET || (process.env.ADMIN_PASSWORD || "") + "::bella-ro";
  return crypto.createHash("sha256").update(base).digest();
}
function assinar(txt) {
  return crypto.createHmac("sha256", chave()).update(txt).digest("base64url");
}
export function senhaConfere(senha) {
  const certa = process.env.ADMIN_PASSWORD || "";
  if (!certa) return false;
  const a = crypto.createHash("sha256").update(String(senha || "")).digest();
  const b = crypto.createHash("sha256").update(certa).digest();
  return crypto.timingSafeEqual(a, b);
}
export function cookieSessao() {
  const exp = String(Math.floor(Date.now() / 1000) + DURACAO);
  const token = exp + "." + assinar(exp);
  return `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${DURACAO}`;
}
export function cookieSair() {
  return `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}
export function logado(request) {
  const c = request.headers.get("cookie") || "";
  const m = c.match(new RegExp("(?:^|;\\s*)" + COOKIE + "=([^;]+)"));
  if (!m) return false;
  const [exp, sig] = m[1].split(".");
  if (!exp || !sig || Number(exp) < Date.now() / 1000) return false;
  const esperado = assinar(exp);
  return sig.length === esperado.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(esperado));
}
export function exigirLogin(request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN && !process.env.BLOB_STORE_ID) return json({ erro: "O armazenamento (Vercel Blob) ainda não está ligado a este projeto." }, 503);
  if (!process.env.ADMIN_PASSWORD) return json({ erro: "A senha do admin (ADMIN_PASSWORD) não foi configurada na Vercel." }, 503);
  if (!logado(request)) return json({ erro: "Sessão expirada. Entre de novo." }, 401);
  return null;
}

export async function lerCatalogo() {
  const r = await get(CAMINHO, { access: ACCESS, useCache: false });
  if (!r || r.statusCode !== 200) return { dados: null, etag: null };
  const texto = await new Response(r.stream).text();
  return { dados: JSON.parse(texto), etag: r.blob.etag };
}

export async function salvarCatalogo(dados, etag) {
  dados.atualizadoEm = new Date().toISOString();
  const opcoes = { access: ACCESS, contentType: "application/json", addRandomSuffix: false, cacheControlMaxAge: 60 };
  if (etag) opcoes.ifMatch = etag; else opcoes.allowOverwrite = true;
  const res = await put(CAMINHO, JSON.stringify(dados), opcoes);
  return res;
}

// Lê, altera e salva com controle de versão (tenta de novo se alguém salvou no meio)
export async function alterarCatalogo(fn) {
  for (let tentativa = 0; tentativa < 3; tentativa++) {
    const { dados, etag } = await lerCatalogo();
    const base = dados || { versao: 1, config: {}, produtos: [] };
    const resultado = await fn(base);
    try {
      await salvarCatalogo(base, etag);
      return { dados: base, resultado };
    } catch (e) {
      if (!/precondition/i.test(String(e && (e.name + e.message)))) throw e;
    }
  }
  throw new Error("Não foi possível salvar: o catálogo foi alterado ao mesmo tempo. Tente de novo.");
}

export function limparProduto(p) {
  const txt = (v, max = 4000) => String(v == null ? "" : v).slice(0, max).trim();
  const lista = (v) => (Array.isArray(v) ? v : []).map((x) => txt(x, 60)).filter(Boolean);
  const estoque = {};
  if (p.estoque && typeof p.estoque === "object") {
    for (const [k, v] of Object.entries(p.estoque)) {
      const n = parseInt(v, 10);
      if (Number.isFinite(n) && n >= 0) estoque[txt(k, 130)] = n;
    }
  }
  const fotos = (Array.isArray(p.fotos) ? p.fotos : [])
    .map((f) => ({ s: txt(f && f.s, 600), l: txt(f && f.l, 600) }))
    .filter((f) => f.s || f.l);
  return {
    id: txt(p.id, 80),
    ref: txt(p.ref, 30),
    tipo: txt(p.tipo, 60),
    categoria: txt(p.categoria, 40),
    estacao: txt(p.estacao, 20),
    data: txt(p.data, 10) || new Date().toISOString().slice(0, 10),
    descricao: txt(p.descricao),
    cores: lista(p.cores),
    tamanhos: lista(p.tamanhos),
    estoque,
    fotos,
    visivel: p.visivel !== false,
    esgotado: !!p.esgotado,
    destaque: !!p.destaque
  };
}

export function limparConfig(c) {
  const out = {};
  const campos = ["whatsapp", "whatsappExibicao", "instagram", "email", "endereco", "horario", "pedidoMinimo", "pagamento", "envio"];
  for (const k of campos) if (c && c[k] != null) out[k] = String(c[k]).slice(0, 300).trim();
  if (c && Array.isArray(c.avisos)) out.avisos = c.avisos.map((a) => String(a).slice(0, 120).trim()).filter(Boolean).slice(0, 8);
  if (c && c.banner && typeof c.banner === "object") {
    const b = c.banner, t = (v, n) => String(v == null ? "" : v).slice(0, n).trim();
    out.banner = {
      ativo: !!b.ativo,
      selo: t(b.selo, 60), titulo: t(b.titulo, 60), data: t(b.data, 60), horario: t(b.horario, 60),
      local: t(b.local, 80), endereco: t(b.endereco, 140), texto: t(b.texto, 300), botao: t(b.botao, 40),
      ate: /^\d{4}-\d{2}-\d{2}$/.test(b.ate || "") ? b.ate : "",
      imagem: t(b.imagem, 600),
      marcas: (Array.isArray(b.marcas) ? b.marcas : []).map((m) => t(m, 600)).filter(Boolean).slice(0, 12)
    };
  }
  return out;
}

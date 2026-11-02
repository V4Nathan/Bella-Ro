// GET  /api/admin/catalogo  — catálogo completo (inclui ocultos)
// PUT  /api/admin/catalogo  — { produtos?, config? } substitui a lista e/ou as configurações
import { exigirLogin, lerCatalogo, alterarCatalogo, limparProduto, limparConfig, json } from "../_lib.js";

export async function GET(request) {
  const bloqueio = exigirLogin(request);
  if (bloqueio) return bloqueio;
  try {
    const { dados } = await lerCatalogo();
    return json(dados || { versao: 1, config: {}, produtos: [], vazio: true });
  } catch (e) {
    return json({ erro: "Erro ao ler o catálogo: " + e.message }, 500);
  }
}

export async function PUT(request) {
  const bloqueio = exigirLogin(request);
  if (bloqueio) return bloqueio;
  let corpo;
  try { corpo = await request.json(); } catch { return json({ erro: "Dados inválidos." }, 400); }
  try {
    const { dados } = await alterarCatalogo((cat) => {
      if (Array.isArray(corpo.produtos)) {
        const vistos = new Set();
        cat.produtos = corpo.produtos.map(limparProduto).filter((p) => p.id && !vistos.has(p.id) && vistos.add(p.id));
      }
      if (corpo.config) cat.config = { ...(cat.config || {}), ...limparConfig(corpo.config) };
    });
    return json({ ok: true, total: dados.produtos.length, atualizadoEm: dados.atualizadoEm });
  } catch (e) {
    return json({ erro: e.message }, 500);
  }
}

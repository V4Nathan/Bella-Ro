// PUT    /api/admin/produto  { produto }  — cria ou atualiza um produto
// DELETE /api/admin/produto?id=...        — remove um produto
import { exigirLogin, alterarCatalogo, limparProduto, json } from "../_lib.js";

export async function PUT(request) {
  const bloqueio = exigirLogin(request);
  if (bloqueio) return bloqueio;
  let corpo;
  try { corpo = await request.json(); } catch { return json({ erro: "Dados inválidos." }, 400); }
  const p = limparProduto(corpo.produto || {});
  if (!p.id) return json({ erro: "Produto sem código." }, 400);
  if (!p.ref) return json({ erro: "Informe a referência." }, 400);
  try {
    const { dados } = await alterarCatalogo((cat) => {
      const conflito = cat.produtos.find((x) => x.ref.toLowerCase() === p.ref.toLowerCase() && x.id !== p.id);
      if (conflito) throw new Error("Já existe outro produto com a referência " + p.ref + ".");
      const i = cat.produtos.findIndex((x) => x.id === p.id);
      if (i >= 0) cat.produtos[i] = p; else cat.produtos.unshift(p);
    });
    return json({ ok: true, produto: p, atualizadoEm: dados.atualizadoEm });
  } catch (e) {
    return json({ erro: e.message }, /referência/.test(e.message) ? 409 : 500);
  }
}

export async function DELETE(request) {
  const bloqueio = exigirLogin(request);
  if (bloqueio) return bloqueio;
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return json({ erro: "Informe o produto." }, 400);
  try {
    await alterarCatalogo((cat) => { cat.produtos = cat.produtos.filter((x) => x.id !== id); });
    return json({ ok: true });
  } catch (e) {
    return json({ erro: e.message }, 500);
  }
}

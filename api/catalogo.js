// GET /api/catalogo — catálogo público (só produtos visíveis)
import { lerCatalogo, json } from "./_lib.js";

export async function GET() {
  try {
    const { dados } = await lerCatalogo();
    if (!dados) return json({ produtos: [] }, 404);
    const publico = {
      atualizadoEm: dados.atualizadoEm,
      config: dados.config || {},
      produtos: (dados.produtos || []).filter((p) => p.visivel !== false)
    };
    return json(publico, 200, { "cache-control": "public, max-age=0, s-maxage=15, stale-while-revalidate=300" });
  } catch (e) {
    return json({ erro: "Catálogo indisponível" }, 500);
  }
}

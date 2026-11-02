/* Painel de administração — Atacado Bella Rô */
(function () {
  "use strict";

  var ESTACOES = { primavera: ["Primavera", "PR"], verao: ["Verão", "VE"], outono: ["Outono", "OU"], inverno: ["Inverno", "IN"] };
  var CATEGORIAS = {
    vestidos: "Vestidos", conjuntos: "Conjuntos", blusas: "Blusas e camisas", tricos: "Tricôs e casacos",
    calcas: "Calças e bermudas", saias: "Saias", macacoes: "Macacões", moletons: "Moletons",
    masculino: "Masculino", praia: "Praia e acessórios"
  };
  var CORES_BASE = ["Preto", "Branco", "Off-white", "Bege", "Nude", "Caramelo", "Marrom", "Terracota", "Cinza", "Azul-marinho", "Azul",
    "Azul-claro", "Jeans", "Verde", "Verde-claro", "Vermelho", "Vinho", "Rosa", "Pink", "Laranja", "Amarelo", "Lilás", "Roxo",
    "Estampado", "Listrado", "Poá"];
  var CFG = window.BELLA_CONFIG || {};
  var POR_PAGINA = 60;

  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function sem(s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }

  var estado = { produtos: [], config: {}, vazio: false, pagina: 1 };

  /* ---------------- API ---------------- */
  function api(metodo, url, corpo, tipo) {
    var op = { method: metodo, credentials: "same-origin", headers: {} };
    if (corpo !== undefined) {
      if (tipo) { op.headers["content-type"] = tipo; op.body = corpo; }
      else { op.headers["content-type"] = "application/json"; op.body = JSON.stringify(corpo); }
    }
    return fetch(url, op).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) {
        if (r.status === 401 && url !== "/api/login") { mostrarLogin(); throw new Error(d.erro || "Sessão expirada. Entre de novo."); }
        if (!r.ok) {
          var e = new Error(d.erro || ("Erro " + r.status)); e.status = r.status; throw e;
        }
        return d;
      });
    });
  }

  /* ---------------- telas ---------------- */
  function tela(id) {
    ["tela-login", "tela-aviso", "tela-app"].forEach(function (t) { $("#" + t).hidden = t !== id; });
  }
  function mostrarLogin() { tela("tela-login"); setTimeout(function () { var i = $("#form-login input"); if (i) i.focus(); }, 50); }
  function mostrarAviso(txt) { tela("tela-aviso"); $("#aviso-texto").textContent = txt; }

  var toastT;
  function toast(msg, erro) {
    var t = $("#toast"); t.textContent = msg; t.className = "toast is-on" + (erro ? " toast--erro" : "");
    clearTimeout(toastT); toastT = setTimeout(function () { t.className = "toast"; }, erro ? 6000 : 2800);
  }

  function carregar() {
    return api("GET", "/api/admin/catalogo").then(function (d) {
      estado.produtos = d.produtos || [];
      estado.config = d.config || {};
      estado.vazio = !!d.vazio || !estado.produtos.length;
      tela("tela-app");
      renderVazio(); renderLista(); preencherConfig();
    }).catch(function (e) {
      if (e.status === 503) mostrarAviso(e.message + " Avise o suporte técnico para concluir a configuração.");
      else if (e.status !== 401 && !/Sessão/.test(e.message)) { mostrarAviso("Não foi possível abrir o painel: " + e.message); }
    });
  }

  $("#form-login").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var btn = ev.target.querySelector("button"), err = $("#login-erro");
    err.textContent = ""; btn.disabled = true; btn.textContent = "Entrando…";
    api("POST", "/api/login", { senha: ev.target.senha.value }).then(function () {
      ev.target.reset(); return carregar();
    }).catch(function (e) { err.textContent = e.message; }).then(function () { btn.disabled = false; btn.textContent = "Entrar"; });
  });

  $("#btn-sair").addEventListener("click", function () {
    api("POST", "/api/logout").catch(function () {}).then(mostrarLogin);
  });

  $$(".aba").forEach(function (b) {
    b.addEventListener("click", function () {
      $$(".aba").forEach(function (x) { x.classList.toggle("is-on", x === b); });
      $("#aba-produtos").hidden = b.dataset.aba !== "produtos";
      $("#aba-config").hidden = b.dataset.aba !== "config";
      window.scrollTo(0, 0);
    });
  });

  /* ---------------- importar ---------------- */
  function doEstatico(p) {
    return {
      id: p.id, ref: p.ref, tipo: p.t, categoria: p.c, estacao: p.e, data: p.d, descricao: "",
      cores: p.k || [], tamanhos: p.z || [], estoque: {}, visivel: true, esgotado: false, destaque: false,
      fotos: p.f.map(function (f) { return { s: "img/" + p.e + "/s/" + f + ".webp", l: "img/" + p.e + "/l/" + f + ".webp" }; })
    };
  }
  function renderVazio() {
    var est = window.BELLA_PRODUTOS || [];
    $("#qtd-estatico").textContent = est.length;
    $("#estado-vazio").hidden = !(estado.vazio && est.length);
  }
  $("#btn-importar").addEventListener("click", function () {
    var btn = this, lista = (window.BELLA_PRODUTOS || []).map(doEstatico);
    var cfg = {};
    ["whatsapp", "whatsappExibicao", "instagram", "email", "endereco", "horario", "pedidoMinimo", "pagamento", "envio", "avisos"].forEach(function (k) {
      if (CFG[k] != null && CFG[k] !== "" && !/^\(00\)/.test(CFG[k])) cfg[k] = CFG[k];
    });
    btn.disabled = true; btn.textContent = "Importando " + lista.length + " modelos…";
    api("PUT", "/api/admin/catalogo", { produtos: lista, config: cfg }).then(function (d) {
      toast(d.total + " modelos importados.");
      return carregar();
    }).catch(function (e) { toast(e.message, true); }).then(function () { btn.disabled = false; btn.textContent = "Importar catálogo atual"; });
  });

  /* ---------------- lista ---------------- */
  function opcoes(sel, mapa, nomeFn) {
    Object.keys(mapa).forEach(function (k) {
      var o = document.createElement("option"); o.value = k; o.textContent = nomeFn ? nomeFn(mapa[k]) : mapa[k]; sel.appendChild(o);
    });
  }
  opcoes($("#f-estacao"), ESTACOES, function (v) { return v[0]; });
  opcoes($("#f-categoria"), CATEGORIAS);
  opcoes($("#ed-estacao"), ESTACOES, function (v) { return v[0]; });
  (function () { var s = $("#ed-categoria"); var o = document.createElement("option"); o.value = ""; o.textContent = "Sem categoria"; s.appendChild(o); opcoes(s, CATEGORIAS); })();

  function totalEstoque(p) {
    var ks = Object.keys(p.estoque || {});
    if (!ks.length) return null;
    return ks.reduce(function (s, k) { return s + (p.estoque[k] || 0); }, 0);
  }
  function minimoEstoque(p) {
    var ks = Object.keys(p.estoque || {});
    if (!ks.length) return null;
    return Math.min.apply(null, ks.map(function (k) { return p.estoque[k]; }));
  }
  function fotoCapa(p) { var f = (p.fotos || [])[0]; return f ? (f.s || f.l) : "assets/favicon.svg"; }

  function filtrados() {
    var q = sem($("#busca").value.trim()), e = $("#f-estacao").value, c = $("#f-categoria").value, st = $("#f-status").value;
    return estado.produtos.filter(function (p) {
      if (e && p.estacao !== e) return false;
      if (c && p.categoria !== c) return false;
      if (st === "visivel" && p.visivel === false) return false;
      if (st === "oculto" && p.visivel !== false) return false;
      if (st === "esgotado" && !p.esgotado) return false;
      if (st === "destaque" && !p.destaque) return false;
      if (st === "sem-estoque" && totalEstoque(p) !== null) return false;
      if (st === "baixo") { var m = minimoEstoque(p); if (m === null || m > 5) return false; }
      if (q) {
        var alvo = sem([p.ref, p.tipo, CATEGORIAS[p.categoria], (p.cores || []).join(" "), p.descricao].join(" "));
        if (q.split(/\s+/).some(function (w) { return alvo.indexOf(w) < 0; })) return false;
      }
      return true;
    }).sort(function (a, b) { return a.data < b.data ? 1 : a.data > b.data ? -1 : (a.ref < b.ref ? 1 : -1); });
  }

  function renderLista() {
    var lista = filtrados(), ate = estado.pagina * POR_PAGINA;
    $("#contagem").textContent = lista.length + (lista.length === 1 ? " produto" : " produtos") +
      (lista.length !== estado.produtos.length ? " de " + estado.produtos.length : "");
    $("#lista").innerHTML = lista.slice(0, ate).map(function (p) {
      var tot = totalEstoque(p), min = minimoEstoque(p), tags = [];
      if (p.visivel === false) tags.push('<span class="tag tag--cinza">Oculto</span>');
      if (p.esgotado) tags.push('<span class="tag tag--vermelho">Esgotado</span>');
      if (p.destaque) tags.push('<span class="tag">Destaque</span>');
      var est = tot === null ? '<span class="item__est item__est--nada">Sem estoque cadastrado</span>'
        : '<span class="item__est' + (min <= 5 ? " item__est--baixo" : "") + '">' + tot + " peças" + (min === 0 ? " · algum tamanho zerado" : min <= 5 ? " · estoque baixo" : "") + "</span>";
      return '<li><button class="item" data-id="' + esc(p.id) + '">' +
        '<img src="' + esc(fotoCapa(p)) + '" alt="" loading="lazy">' +
        '<span class="item__info"><span class="item__nome"><strong>' + esc(p.ref) + "</strong> " + esc(p.tipo || "") + "</span>" +
        '<small>' + esc(CATEGORIAS[p.categoria] || "Sem categoria") + " · " + esc((ESTACOES[p.estacao] || ["—"])[0]) +
        ((p.cores || []).length ? " · " + esc(p.cores.join(", ")) : "") + "</small>" + est + "</span>" +
        '<span class="item__tags">' + tags.join("") + "</span></button></li>";
    }).join("") || '<li class="nada">Nenhum produto encontrado.</li>';
    $("#btn-mais").hidden = lista.length <= ate;
  }
  var buscaT;
  $("#busca").addEventListener("input", function () { clearTimeout(buscaT); buscaT = setTimeout(function () { estado.pagina = 1; renderLista(); }, 150); });
  ["#f-estacao", "#f-categoria", "#f-status"].forEach(function (s) { $(s).addEventListener("change", function () { estado.pagina = 1; renderLista(); }); });
  $("#btn-mais").addEventListener("click", function () { estado.pagina++; renderLista(); });
  $("#lista").addEventListener("click", function (ev) {
    var b = ev.target.closest(".item"); if (!b) return;
    var p = estado.produtos.find(function (x) { return x.id === b.dataset.id; });
    if (p) abrirEditor(p, false);
  });
  $("#btn-novo").addEventListener("click", function () { abrirEditor(novoProduto(), true); });

  /* ---------------- editor ---------------- */
  var ed = null, edNovo = false, sujo = false, enviando = 0;
  var form = $("#form-produto");

  function proximaRef(estacao) {
    var pre = (ESTACOES[estacao] || ESTACOES.primavera)[1], max = 0;
    estado.produtos.forEach(function (p) {
      var m = String(p.ref || "").match(new RegExp("^" + pre + "(\\d+)$", "i"));
      if (m) max = Math.max(max, parseInt(m[1], 10));
    });
    return pre + String(max + 1).padStart(3, "0");
  }
  function estacaoAtual() {
    var m = new Date().getMonth() + 1, d = new Date().getDate(), md = m * 100 + d;
    if (md >= 1221 || md < 320) return "verao";
    if (md < 621) return "outono";
    if (md < 923) return "inverno";
    return "primavera";
  }
  function novoProduto() {
    var e = estacaoAtual();
    return {
      id: "n" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      ref: proximaRef(e), tipo: "", categoria: "", estacao: e, data: new Date().toISOString().slice(0, 10),
      descricao: "", cores: [], tamanhos: ["P", "M", "G", "GG"], estoque: {}, fotos: [], visivel: true, esgotado: false, destaque: false
    };
  }

  function abrirEditor(p, novo) {
    ed = JSON.parse(JSON.stringify(p));
    ed.cores = ed.cores || []; ed.tamanhos = ed.tamanhos || []; ed.estoque = ed.estoque || {}; ed.fotos = ed.fotos || [];
    if (!ed.tamanhos.length) ed.tamanhos = ((CFG.gradePadrao || {})[ed.categoria] || (CFG.gradePadrao || {})._ || ["P", "M", "G", "GG"]).slice();
    edNovo = novo; sujo = false;
    $("#ed-titulo").textContent = novo ? "Novo produto" : (ed.ref + (ed.tipo ? " · " + ed.tipo : ""));
    $("#ed-ver").hidden = novo; $("#ed-ver").href = "produto.html?id=" + encodeURIComponent(ed.id);
    $("#ed-zona-excluir").hidden = novo;
    form.tipo.value = ed.tipo || ""; form.ref.value = ed.ref || ""; form.categoria.value = ed.categoria || "";
    form.estacao.value = ESTACOES[ed.estacao] ? ed.estacao : "primavera"; form.data.value = ed.data || "";
    form.descricao.value = ed.descricao || "";
    form.visivel.checked = ed.visivel !== false; form.esgotado.checked = !!ed.esgotado; form.destaque.checked = !!ed.destaque;
    $("#ed-erro").textContent = ""; $("#ed-envio").textContent = "";
    preencherSugestoes();
    renderFotos(); renderChips(); renderEstoque();
    $("#gaveta").hidden = false; document.body.classList.add("trava");
    $(".gaveta__corpo").scrollTop = 0;
    if (novo) setTimeout(function () { form.tipo.focus(); }, 60);
  }
  function fecharEditor(forcar) {
    if (!forcar && enviando) { toast("Espere as fotos terminarem de enviar.", true); return; }
    if (!forcar && sujo && !confirm("Sair sem salvar as alterações?")) return;
    $("#gaveta").hidden = true; document.body.classList.remove("trava"); ed = null;
  }
  $$("[data-fechar]").forEach(function (b) { b.addEventListener("click", function () { fecharEditor(false); }); });
  document.addEventListener("keydown", function (ev) { if (ev.key === "Escape" && ed) fecharEditor(false); });
  form.addEventListener("input", function () { sujo = true; });
  form.estacao.addEventListener("change", function () {
    if (edNovo && /^(PR|VE|OU|IN)\d+$/i.test(form.ref.value)) form.ref.value = proximaRef(form.estacao.value);
  });

  function preencherSugestoes() {
    var tipos = {}, cores = {};
    estado.produtos.forEach(function (p) { if (p.tipo) tipos[p.tipo] = 1; (p.cores || []).forEach(function (c) { cores[c] = 1; }); });
    CORES_BASE.forEach(function (c) { cores[c] = 1; });
    $("#tipos").innerHTML = Object.keys(tipos).sort().map(function (t) { return '<option value="' + esc(t) + '">'; }).join("");
    $("#cores-sugestao").innerHTML = Object.keys(cores).sort().map(function (t) { return '<option value="' + esc(t) + '">'; }).join("");
  }

  /* fotos */
  function renderFotos() {
    var n = ed.fotos.length;
    $("#ed-fotos").innerHTML = ed.fotos.map(function (f, i) {
      return '<li class="foto' + (i === 0 ? " foto--capa" : "") + '"><img src="' + esc(f.s || f.l) + '" alt="Foto ' + (i + 1) + '">' +
        (i === 0 ? '<span class="foto__capa">Capa</span>' : "") +
        '<span class="foto__acoes">' +
        '<button type="button" data-mover="-1" data-i="' + i + '" aria-label="Mover para a esquerda"' + (i === 0 ? " disabled" : "") + ">&larr;</button>" +
        '<button type="button" data-remover data-i="' + i + '" aria-label="Remover foto">&times;</button>' +
        '<button type="button" data-mover="1" data-i="' + i + '" aria-label="Mover para a direita"' + (i === n - 1 ? " disabled" : "") + ">&rarr;</button>" +
        "</span></li>";
    }).join("") || '<li class="fotos__vazio">Nenhuma foto ainda.</li>';
  }
  $("#ed-fotos").addEventListener("click", function (ev) {
    var b = ev.target.closest("button"); if (!b) return;
    var i = +b.dataset.i;
    if (b.hasAttribute("data-remover")) {
      if (!confirm("Remover esta foto?")) return;
      ed.fotos.splice(i, 1);
    } else {
      var j = i + (+b.dataset.mover); if (j < 0 || j >= ed.fotos.length) return;
      var t = ed.fotos[i]; ed.fotos[i] = ed.fotos[j]; ed.fotos[j] = t;
    }
    sujo = true; renderFotos();
  });

  function carregarImagem(arquivo) {
    return new Promise(function (ok, falha) {
      var url = URL.createObjectURL(arquivo), img = new Image();
      img.onload = function () { ok(img); setTimeout(function () { URL.revokeObjectURL(url); }, 1000); };
      img.onerror = function () { URL.revokeObjectURL(url); falha(new Error("Não consegui abrir " + arquivo.name + ". Use JPG, PNG ou WEBP.")); };
      img.src = url;
    });
  }
  function redimensionar(img, largura) {
    var w = Math.min(largura, img.naturalWidth), h = Math.round(img.naturalHeight * w / img.naturalWidth);
    var c = document.createElement("canvas"); c.width = w; c.height = h;
    var ctx = c.getContext("2d"); ctx.imageSmoothingQuality = "high"; ctx.drawImage(img, 0, 0, w, h);
    return new Promise(function (ok) {
      c.toBlob(function (b) {
        if (b && b.type === "image/webp") return ok(b);
        c.toBlob(function (j) { ok(j); }, "image/jpeg", 0.86);
      }, "image/webp", 0.84);
    });
  }
  function enviarArquivo(arquivo) {
    var id = ed.id;
    return carregarImagem(arquivo).then(function (img) {
      return Promise.all([redimensionar(img, 520), redimensionar(img, 1100)]);
    }).then(function (bs) {
      var base = "/api/admin/foto?produto=" + encodeURIComponent(id) + "&tam=";
      return Promise.all([api("POST", base + "s", bs[0], bs[0].type), api("POST", base + "l", bs[1], bs[1].type)]);
    }).then(function (rs) { return { s: rs[0].url, l: rs[1].url }; });
  }
  $("#ed-arquivo").addEventListener("change", function () {
    var arquivos = Array.prototype.slice.call(this.files || []); this.value = "";
    if (!arquivos.length || !ed) return;
    var alvo = ed, total = arquivos.length, feitos = 0, info = $("#ed-envio");
    enviando += total; sujo = true;
    info.textContent = "Enviando " + total + (total > 1 ? " fotos…" : " foto…");
    // envia uma de cada vez para manter a ordem
    arquivos.reduce(function (cadeia, arq) {
      return cadeia.then(function () {
        return enviarArquivo(arq).then(function (f) {
          alvo.fotos.push(f); feitos++;
          if (ed === alvo) { renderFotos(); info.textContent = feitos < total ? "Enviando… " + feitos + " de " + total : ""; }
        }).catch(function (e) { toast(e.message, true); }).then(function () { enviando--; });
      });
    }, Promise.resolve()).then(function () {
      if (ed === alvo) info.textContent = feitos ? (feitos + (feitos > 1 ? " fotos enviadas." : " foto enviada.") + " Lembre de salvar.") : "";
    });
  });

  /* cores e tamanhos */
  function renderChips() {
    $("#ed-cores").innerHTML = ed.cores.map(function (c, i) {
      return '<span class="chip">' + esc(c) + '<button type="button" data-tipo="cores" data-i="' + i + '" aria-label="Remover ' + esc(c) + '">&times;</button></span>';
    }).join("") || '<span class="ajuda">Sem cores cadastradas (o site não mostra o seletor de cor).</span>';
    $("#ed-tams").innerHTML = ed.tamanhos.map(function (t, i) {
      return '<span class="chip">' + esc(t) + '<button type="button" data-tipo="tamanhos" data-i="' + i + '" aria-label="Remover ' + esc(t) + '">&times;</button></span>';
    }).join("") || '<span class="ajuda">Adicione pelo menos um tamanho.</span>';
  }
  function removerChip(ev) {
    var b = ev.target.closest("button[data-tipo]"); if (!b) return;
    ed[b.dataset.tipo].splice(+b.dataset.i, 1); sujo = true; limparEstoqueOrfao(); renderChips(); renderEstoque();
  }
  $("#ed-cores").addEventListener("click", removerChip);
  $("#ed-tams").addEventListener("click", removerChip);
  function adicionar(campo, input) {
    var vals = input.value.split(/[,;]/).map(function (v) { return v.trim(); }).filter(Boolean);
    vals.forEach(function (v) {
      if (campo === "cores") v = v.charAt(0).toUpperCase() + v.slice(1);
      if (!ed[campo].some(function (x) { return sem(x) === sem(v); })) ed[campo].push(v);
    });
    input.value = ""; sujo = true; renderChips(); renderEstoque(); input.focus();
  }
  $("#ed-cor-add").addEventListener("click", function () { adicionar("cores", $("#ed-cor-nova")); });
  $("#ed-tam-add").addEventListener("click", function () { adicionar("tamanhos", $("#ed-tam-novo")); });
  $("#ed-cor-nova").addEventListener("keydown", function (ev) { if (ev.key === "Enter") { ev.preventDefault(); adicionar("cores", this); } });
  $("#ed-tam-novo").addEventListener("keydown", function (ev) { if (ev.key === "Enter") { ev.preventDefault(); adicionar("tamanhos", this); } });
  $$(".preset").forEach(function (b) {
    b.addEventListener("click", function () {
      ed.tamanhos = b.dataset.grade.split(","); sujo = true; limparEstoqueOrfao(); renderChips(); renderEstoque();
    });
  });

  /* estoque */
  function chave(cor, tam) { return cor + "|" + tam; }
  function linhasCores() { return ed.cores.length ? ed.cores : [""]; }
  function limparEstoqueOrfao() {
    var validas = {};
    linhasCores().forEach(function (c) { ed.tamanhos.forEach(function (t) { validas[chave(c, t)] = 1; }); });
    Object.keys(ed.estoque).forEach(function (k) { if (!validas[k]) delete ed.estoque[k]; });
  }
  function renderEstoque() {
    var cores = linhasCores();
    if (!ed.tamanhos.length) { $("#ed-estoque").innerHTML = '<p class="ajuda">Cadastre os tamanhos para preencher o estoque.</p>'; return; }
    var h = '<table><thead><tr><th>' + (ed.cores.length ? "Cor" : "") + "</th>" +
      ed.tamanhos.map(function (t) { return "<th>" + esc(t) + "</th>"; }).join("") + "<th>Total</th></tr></thead><tbody>";
    cores.forEach(function (c) {
      var tot = 0, tem = false;
      h += "<tr><th>" + (c ? esc(c) : "Quantidade") + "</th>";
      ed.tamanhos.forEach(function (t) {
        var v = ed.estoque[chave(c, t)];
        if (v != null) { tot += v; tem = true; }
        h += '<td><input type="number" min="0" step="1" inputmode="numeric" data-k="' + esc(chave(c, t)) + '" value="' + (v != null ? v : "") + '" aria-label="' + esc((c ? c + " " : "") + t) + '"></td>';
      });
      h += '<td class="estoque__tot">' + (tem ? tot : "–") + "</td></tr>";
    });
    $("#ed-estoque").innerHTML = h + "</tbody></table>";
  }
  $("#ed-estoque").addEventListener("input", function (ev) {
    var i = ev.target.closest("input[data-k]"); if (!i) return;
    var n = parseInt(i.value, 10);
    if (i.value === "" || !isFinite(n)) delete ed.estoque[i.dataset.k]; else ed.estoque[i.dataset.k] = Math.max(0, n);
    sujo = true;
    var linha = i.closest("tr"), tot = 0, tem = false;
    $$("input[data-k]", linha).forEach(function (x) { if (x.value !== "") { tot += Math.max(0, parseInt(x.value, 10) || 0); tem = true; } });
    $(".estoque__tot", linha).textContent = tem ? tot : "–";
  });
  $("#ed-todos-btn").addEventListener("click", function () {
    var n = parseInt($("#ed-todos").value, 10);
    if (!isFinite(n) || n < 0) { $("#ed-todos").focus(); return; }
    linhasCores().forEach(function (c) { ed.tamanhos.forEach(function (t) { ed.estoque[chave(c, t)] = n; }); });
    sujo = true; renderEstoque();
  });
  $("#ed-limpar-btn").addEventListener("click", function () {
    if (!Object.keys(ed.estoque).length || confirm("Apagar todas as quantidades deste produto?")) { ed.estoque = {}; sujo = true; renderEstoque(); }
  });

  /* salvar / excluir */
  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    if (enviando) { toast("Espere as fotos terminarem de enviar.", true); return; }
    var err = $("#ed-erro"); err.textContent = "";
    // adiciona o que ficou digitado nos campos de cor/tamanho
    if ($("#ed-cor-nova").value.trim()) adicionar("cores", $("#ed-cor-nova"));
    if ($("#ed-tam-novo").value.trim()) adicionar("tamanhos", $("#ed-tam-novo"));
    ed.tipo = form.tipo.value.trim(); ed.ref = form.ref.value.trim().toUpperCase(); ed.categoria = form.categoria.value;
    ed.estacao = form.estacao.value; ed.data = form.data.value || new Date().toISOString().slice(0, 10);
    ed.descricao = form.descricao.value.trim();
    ed.visivel = form.visivel.checked; ed.esgotado = form.esgotado.checked; ed.destaque = form.destaque.checked;
    if (!ed.tipo) { err.textContent = "Informe o tipo de peça (ex.: Vestido)."; form.tipo.focus(); return; }
    if (!ed.ref) { err.textContent = "Informe a referência."; form.ref.focus(); return; }
    if (!ed.tamanhos.length) { err.textContent = "Cadastre pelo menos um tamanho."; return; }
    if (!ed.fotos.length && ed.visivel && !confirm("Este produto está sem fotos. Salvar mesmo assim?")) return;
    limparEstoqueOrfao();
    var btn = $("#ed-salvar"); btn.disabled = true; btn.textContent = "Salvando…";
    api("PUT", "/api/admin/produto", { produto: ed }).then(function (d) {
      var i = estado.produtos.findIndex(function (x) { return x.id === d.produto.id; });
      if (i >= 0) estado.produtos[i] = d.produto; else estado.produtos.unshift(d.produto);
      estado.vazio = false; renderVazio();
      toast(edNovo ? "Produto criado." : "Alterações salvas.");
      fecharEditor(true); renderLista();
    }).catch(function (e) { err.textContent = e.message; }).then(function () { btn.disabled = false; btn.textContent = "Salvar"; });
  });

  $("#ed-excluir").addEventListener("click", function () {
    if (!ed || !confirm("Excluir " + ed.ref + " de vez? Para só tirar do site, desmarque \"Mostrar no site\".")) return;
    var id = ed.id, b = this; b.disabled = true;
    api("DELETE", "/api/admin/produto?id=" + encodeURIComponent(id)).then(function () {
      estado.produtos = estado.produtos.filter(function (x) { return x.id !== id; });
      toast("Produto excluído."); fecharEditor(true); renderLista();
    }).catch(function (e) { toast(e.message, true); }).then(function () { b.disabled = false; });
  });

  window.addEventListener("beforeunload", function (ev) { if (ed && (sujo || enviando)) { ev.preventDefault(); ev.returnValue = ""; } });

  /* ---------------- configurações ---------------- */
  var CAMPOS_CFG = ["whatsapp", "whatsappExibicao", "instagram", "email", "endereco", "horario", "pedidoMinimo", "pagamento", "envio"];
  function preencherConfig() {
    var f = $("#form-config"), c = estado.config;
    CAMPOS_CFG.forEach(function (k) { var v = c[k] != null ? c[k] : (CFG[k] || ""); f[k].value = /^\(00\)/.test(v) ? "" : v; });
    f.avisos.value = (c.avisos || CFG.avisos || []).join("\n");
  }
  $("#form-config").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var f = ev.target, cfg = {};
    CAMPOS_CFG.forEach(function (k) { cfg[k] = f[k].value.trim(); });
    cfg.whatsapp = cfg.whatsapp.replace(/\D/g, "");
    cfg.instagram = cfg.instagram.replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/\/.*$/, "");
    cfg.avisos = f.avisos.value.split("\n").map(function (s) { return s.trim(); }).filter(Boolean);
    if (cfg.whatsapp && cfg.whatsapp.length < 12) { toast("Confira o WhatsApp: use 55 + DDD + número.", true); f.whatsapp.focus(); return; }
    var b = f.querySelector("button[type=submit]"); b.disabled = true; b.textContent = "Salvando…";
    api("PUT", "/api/admin/catalogo", { config: cfg }).then(function () {
      estado.config = cfg; preencherConfig(); toast("Configurações salvas. O site atualiza em até 1 minuto.");
    }).catch(function (e) { toast(e.message, true); }).then(function () { b.disabled = false; b.textContent = "Salvar configurações"; });
  });

  carregar();
})();

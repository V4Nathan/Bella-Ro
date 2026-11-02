/* Painel de administração — Atacado Bella Rô */
(function () {
  "use strict";

  var ESTACOES = { primavera: ["Primavera", "PR"], verao: ["Verão", "VE"], outono: ["Outono", "OU"], inverno: ["Inverno", "IN"] };
  var CATEGORIAS = {
    vestidos: "Vestidos", conjuntos: "Conjuntos", blusas: "Blusas e camisas", tricos: "Tricôs e casacos",
    calcas: "Calças e bermudas", saias: "Saias", macacoes: "Macacões", moletons: "Moletons",
    masculino: "Masculino", praia: "Praia e acessórios"
  };
  var CORES_HEX = {
    "preto": "#1E1E1E", "branco": "#FFFFFF", "off-white": "#F3EFE6", "bege": "#D9C7AE", "nude": "#E3C2AE", "caramelo": "#B9773F",
    "marrom": "#6B4A35", "terracota": "#B4532A", "cinza": "#9A9A9A", "azul-marinho": "#1F2A44", "azul": "#2F5DC8", "azul-claro": "#A9C8E8",
    "jeans": "#4F6F94", "verde": "#4E7A4B", "verde-claro": "#B9D7A8", "vermelho": "#C62828", "vinho": "#6D1F2C", "rosa": "#F2B8C6",
    "pink": "#E2357D", "laranja": "#F08A3C", "amarelo": "#F4D35E", "lilás": "#C3A6DA", "roxo": "#6A3D9A"
  };
  var CORES_BASE = ["Preto", "Branco", "Off-white", "Bege", "Nude", "Caramelo", "Marrom", "Terracota", "Cinza", "Azul-marinho", "Azul",
    "Azul-claro", "Jeans", "Verde", "Verde-claro", "Vermelho", "Vinho", "Rosa", "Pink", "Laranja", "Amarelo", "Lilás", "Roxo",
    "Estampado", "Listrado", "Poá"];
  var STATUS = [
    ["", "Todos"], ["visivel", "No site"], ["oculto", "Ocultos"], ["esgotado", "Esgotados"],
    ["baixo", "Estoque baixo"], ["sem-estoque", "Sem estoque"], ["destaque", "Destaques"]
  ];
  var CFG = window.BELLA_CONFIG || {};
  var POR_PAGINA = 50;

  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function sem(s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
  function ic(n) { return '<svg class="i" aria-hidden="true"><use href="#i-' + n + '"/></svg>'; }
  function swatch(nome) {
    var k = String(nome).toLowerCase(), hex = CORES_HEX[k];
    var cls = k === "estampado" ? " sw--estampa" : k === "listrado" ? " sw--listra" : k === "poá" ? " sw--poa" : "";
    return '<span class="sw' + cls + '"' + (hex ? ' style="background:' + hex + '"' : "") + "></span>";
  }
  function plural(n, um, varios) { return n.toLocaleString("pt-BR") + " " + (n === 1 ? um : varios); }
  var SPIN_BRANCO = '<span class="spinner" style="width:16px;height:16px;border-color:rgba(255,255,255,.35);border-top-color:#fff"></span>';

  var estado = { produtos: [], config: {}, vazio: false, pagina: 1, status: "", atualizadoEm: "" };

  /* ---------------- API ---------------- */
  function api(metodo, url, corpo, tipo) {
    var op = { method: metodo, credentials: "same-origin", headers: {} };
    if (corpo !== undefined) {
      if (tipo) { op.headers["content-type"] = tipo; op.body = corpo; }
      else { op.headers["content-type"] = "application/json"; op.body = JSON.stringify(corpo); }
    }
    return fetch(url, op).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) {
        if (r.status === 401 && url !== "/api/login") { mostrarLogin(); var e1 = new Error(d.erro || "Sessão expirada. Entre de novo."); e1.status = 401; throw e1; }
        if (!r.ok) { var e = new Error(d.erro || ("Erro " + r.status)); e.status = r.status; throw e; }
        return d;
      });
    });
  }

  /* ---------------- telas, toast, diálogo ---------------- */
  function tela(id) {
    ["tela-carregando", "tela-login", "tela-aviso", "tela-app"].forEach(function (t) { $("#" + t).hidden = t !== id; });
  }
  function mostrarLogin() { tela("tela-login"); setTimeout(function () { $("#senha").focus(); }, 60); }
  function mostrarAviso(txt) { tela("tela-aviso"); $("#aviso-texto").textContent = txt; }

  var toastT;
  function toast(msg, erro) {
    var t = $("#toast"); $("span", t).textContent = msg; t.className = "toast is-on" + (erro ? " toast--erro" : "");
    clearTimeout(toastT); toastT = setTimeout(function () { t.className = "toast"; }, erro ? 6000 : 2800);
  }

  function confirmar(titulo, texto, rotulo, perigo) {
    return new Promise(function (ok) {
      var d = $("#dialogo"), sim = $("#dlg-sim"), nao = $("#dlg-nao");
      $("#dlg-titulo").textContent = titulo; $("#dlg-texto").textContent = texto || "";
      sim.textContent = rotulo || "Confirmar"; sim.className = "btn " + (perigo ? "btn--perigo" : "btn--primario");
      d.hidden = false; setTimeout(function () { (perigo ? nao : sim).focus(); }, 30);
      function fim(v) {
        d.hidden = true; sim.onclick = nao.onclick = null; $(".dialogo__fundo", d).onclick = null;
        document.removeEventListener("keydown", tecla, true); ok(v);
      }
      function tecla(ev) { if (ev.key === "Escape") { ev.stopPropagation(); fim(false); } }
      sim.onclick = function () { fim(true); }; nao.onclick = function () { fim(false); };
      $(".dialogo__fundo", d).onclick = function () { fim(false); };
      document.addEventListener("keydown", tecla, true);
    });
  }

  /* ---------------- carregar ---------------- */
  function carregar() {
    return api("GET", "/api/admin/catalogo").then(function (d) {
      estado.produtos = d.produtos || [];
      estado.config = d.config || {};
      estado.atualizadoEm = d.atualizadoEm || "";
      estado.vazio = !!d.vazio || !estado.produtos.length;
      tela("tela-app");
      renderVazio(); renderLista(); preencherConfig(); preencherBanner();
      // primeira vez: traz sozinho os modelos que já estão no site
      if (estado.vazio && (window.BELLA_PRODUTOS || []).length && !importando) importar();
    }).catch(function (e) {
      if (e.status === 401) return;
      if (e.status === 503) mostrarAviso(e.message + " Avise o suporte técnico para concluir a configuração.");
      else mostrarAviso("Não foi possível abrir o painel: " + e.message);
    });
  }

  /* ---------------- login ---------------- */
  $("#form-login").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var f = ev.target, btn = f.querySelector("button[type=submit]"), err = $("#login-erro");
    err.textContent = ""; f.senha.classList.remove("is-erro");
    btn.disabled = true; btn.innerHTML = SPIN_BRANCO + " Entrando";
    api("POST", "/api/login", { senha: f.senha.value }).then(function () {
      f.reset(); tela("tela-carregando"); return carregar();
    }).catch(function (e) { err.textContent = e.message; f.senha.classList.add("is-erro"); f.senha.select(); })
      .then(function () { btn.disabled = false; btn.textContent = "Entrar"; });
  });
  $("#senha-ver").addEventListener("click", function () {
    var i = $("#senha"), ver = i.type === "password";
    i.type = ver ? "text" : "password"; this.classList.toggle("is-on", ver);
    this.setAttribute("aria-label", ver ? "Esconder senha" : "Mostrar senha");
  });
  $$("[data-sair]").forEach(function (b) {
    b.addEventListener("click", function () { api("POST", "/api/logout").catch(function () {}).then(mostrarLogin); });
  });

  /* ---------------- navegação ---------------- */
  function irPara(aba) {
    $$("[data-aba]").forEach(function (x) { x.classList.toggle("is-on", x.dataset.aba === aba); });
    ["produtos", "banner", "config"].forEach(function (a) { $("#aba-" + a).hidden = aba !== a; });
    window.scrollTo(0, 0);
  }
  $$("[data-aba]").forEach(function (b) { b.addEventListener("click", function () { irPara(b.dataset.aba); }); });

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
  var importando = false;
  function importar() {
    if (importando) return; importando = true;
    var btn = $("#btn-importar"), lista = (window.BELLA_PRODUTOS || []).map(doEstatico), cfg = {};
    ["whatsapp", "whatsappExibicao", "instagram", "email", "endereco", "horario", "pedidoMinimo", "pagamento", "envio", "avisos"].forEach(function (k) {
      if (CFG[k] != null && CFG[k] !== "" && !/^\(00\)/.test(CFG[k])) cfg[k] = CFG[k];
    });
    btn.disabled = true; btn.innerHTML = SPIN_BRANCO + " Importando " + lista.length + " modelos";
    renderEsqueleto();
    api("PUT", "/api/admin/catalogo", { produtos: lista, config: cfg }).then(function (d) {
      toast(plural(d.total, "modelo importado", "modelos importados") + ".");
      return carregar();
    }).catch(function (e) { toast(e.message, true); renderLista(); })
      .then(function () { importando = false; btn.disabled = false; btn.textContent = "Importar agora"; });
  }
  $("#btn-importar").addEventListener("click", importar);

  /* ---------------- lista ---------------- */
  function opcoes(sel, mapa, nomeFn) {
    Object.keys(mapa).forEach(function (k) {
      var o = document.createElement("option"); o.value = k; o.textContent = nomeFn ? nomeFn(mapa[k]) : mapa[k]; sel.appendChild(o);
    });
  }
  opcoes($("#f-estacao"), ESTACOES, function (v) { return v[0]; });
  opcoes($("#f-categoria"), CATEGORIAS);
  opcoes($("#ed-estacao"), ESTACOES, function (v) { return v[0]; });
  (function () { var s = $("#ed-categoria"), o = document.createElement("option"); o.value = ""; o.textContent = "Sem categoria"; s.appendChild(o); opcoes(s, CATEGORIAS); })();

  function totalEstoque(p) {
    var ks = Object.keys(p.estoque || {});
    return ks.length ? ks.reduce(function (s, k) { return s + (p.estoque[k] || 0); }, 0) : null;
  }
  function minimoEstoque(p) {
    var ks = Object.keys(p.estoque || {});
    return ks.length ? Math.min.apply(null, ks.map(function (k) { return p.estoque[k]; })) : null;
  }
  function fotoCapa(p) { var f = (p.fotos || [])[0]; return f ? (f.s || f.l) : "assets/favicon.svg"; }

  function passaStatus(p, st) {
    if (st === "visivel") return p.visivel !== false;
    if (st === "oculto") return p.visivel === false;
    if (st === "esgotado") return !!p.esgotado;
    if (st === "destaque") return !!p.destaque;
    if (st === "sem-estoque") return totalEstoque(p) === null;
    if (st === "baixo") { var m = minimoEstoque(p); return m !== null && m <= 5; }
    return true;
  }
  function filtrados(ignorarStatus) {
    var q = sem($("#busca").value.trim()), e = $("#f-estacao").value, c = $("#f-categoria").value;
    var palavras = q ? q.split(/\s+/) : [];
    return estado.produtos.filter(function (p) {
      if (e && p.estacao !== e) return false;
      if (c && p.categoria !== c) return false;
      if (!ignorarStatus && !passaStatus(p, estado.status)) return false;
      if (palavras.length) {
        var alvo = sem([p.ref, p.tipo, CATEGORIAS[p.categoria], (p.cores || []).join(" "), p.descricao].join(" "));
        if (palavras.some(function (w) { return alvo.indexOf(w) < 0; })) return false;
      }
      return true;
    }).sort(function (a, b) { return a.data < b.data ? 1 : a.data > b.data ? -1 : (a.ref < b.ref ? 1 : -1); });
  }

  function renderChipsStatus() {
    var base = filtrados(true);
    $("#f-status").innerHTML = STATUS.map(function (s) {
      var n = base.filter(function (p) { return passaStatus(p, s[0]); }).length;
      if (s[0] && !n && estado.status !== s[0]) return "";
      return '<button type="button" class="chip-f' + (estado.status === s[0] ? " is-on" : "") + '" data-st="' + s[0] + '" aria-pressed="' + (estado.status === s[0]) + '">' +
        esc(s[1]) + " <b>" + n.toLocaleString("pt-BR") + "</b></button>";
    }).join("");
  }

  function linhaHTML(p) {
    var tot = totalEstoque(p), min = minimoEstoque(p), cores = p.cores || [];
    var st = p.visivel === false ? '<span class="status status--oculto">Oculto</span>'
      : p.esgotado ? '<span class="status status--esgotado">Esgotado</span>'
      : '<span class="status status--ok">No site</span>';
    var est = tot === null ? '<span class="est est--nada">Sem controle</span>'
      : '<span class="est ' + (min === 0 ? "est--zero" : min <= 5 ? "est--baixo" : "est--ok") + '">' + plural(tot, "peça", "peças") +
        "<small>" + (min === 0 ? "Tamanho zerado" : min <= 5 ? "Estoque baixo" : "Em estoque") + "</small></span>";
    var coresH = cores.length ? '<span class="linha__cores">' + cores.slice(0, 3).map(swatch).join("") +
      "<span>" + esc(cores.join(", ")) + "</span></span>" : '<span class="linha__cel" style="color:var(--muda-2)">—</span>';
    return '<li><button class="linha" data-id="' + esc(p.id) + '">' +
      '<span class="linha__prod"><img src="' + esc(fotoCapa(p)) + '" alt="" loading="lazy" width="44" height="56">' +
      '<span class="linha__nome"><span class="linha__ref">' + esc(p.ref) + (p.destaque ? ic("star") : "") + "</span>" +
      '<span class="linha__tipo">' + esc(p.tipo || "Sem tipo") + "</span></span></span>" +
      '<span class="linha__cel col-cat">' + esc(CATEGORIAS[p.categoria] || "Sem categoria") + "<small>" + esc((ESTACOES[p.estacao] || ["—"])[0]) + "</small></span>" +
      '<span class="col-cores" style="min-width:0">' + coresH + "</span>" +
      '<span class="col-est">' + est + "</span>" +
      '<span class="col-sit">' + st + "</span></button></li>";
  }

  function renderEsqueleto() {
    var h = "";
    for (var i = 0; i < 6; i++) h += '<li class="esqueleto"><i style="width:44px;height:56px"></i><span style="flex:1;display:grid;gap:8px"><i style="width:30%;height:12px"></i><i style="width:18%;height:10px"></i></span></li>';
    $("#lista").innerHTML = h; $("#btn-mais").hidden = true; $("#contagem").textContent = "";
  }

  function renderResumo() {
    var n = estado.produtos.length, vis = estado.produtos.filter(function (p) { return p.visivel !== false; }).length;
    var t = n ? plural(n, "modelo", "modelos") + " · " + vis.toLocaleString("pt-BR") + " no site" : "Nenhum modelo ainda";
    if (estado.atualizadoEm) {
      var d = new Date(estado.atualizadoEm);
      if (!isNaN(d)) t += " · salvo em " + d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) + " às " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    }
    $("#resumo").textContent = t;
  }

  function renderLista() {
    renderResumo(); renderChipsStatus();
    var lista = filtrados(false), ate = estado.pagina * POR_PAGINA;
    if (!lista.length) {
      var temFiltro = $("#busca").value || $("#f-estacao").value || $("#f-categoria").value || estado.status;
      $("#lista").innerHTML = '<li class="nada">' + ic("search") + "<strong>Nenhum produto encontrado</strong>" +
        (temFiltro ? '<span>Tente outra busca ou limpe os filtros.</span><button class="btn btn--sec" id="limpar-filtros">Limpar filtros</button>'
          : "<span>Cadastre o primeiro produto no botão “Novo produto”.</span>") + "</li>";
    } else {
      $("#lista").innerHTML = lista.slice(0, ate).map(linhaHTML).join("");
    }
    var mostrando = Math.min(ate, lista.length);
    $("#contagem").textContent = lista.length ? "Mostrando " + mostrando.toLocaleString("pt-BR") + " de " + plural(lista.length, "produto", "produtos") : "";
    $("#btn-mais").hidden = lista.length <= ate;
  }

  function limparFiltros() {
    $("#busca").value = ""; $("#f-estacao").value = ""; $("#f-categoria").value = ""; estado.status = ""; estado.pagina = 1; renderLista();
  }
  var buscaT;
  $("#busca").addEventListener("input", function () { clearTimeout(buscaT); buscaT = setTimeout(function () { estado.pagina = 1; renderLista(); }, 150); });
  ["#f-estacao", "#f-categoria"].forEach(function (s) { $(s).addEventListener("change", function () { estado.pagina = 1; renderLista(); }); });
  $("#f-status").addEventListener("click", function (ev) {
    var b = ev.target.closest("[data-st]"); if (!b) return;
    estado.status = b.dataset.st; estado.pagina = 1; renderLista();
  });
  $("#btn-mais").addEventListener("click", function () { estado.pagina++; renderLista(); });
  $("#lista").addEventListener("click", function (ev) {
    if (ev.target.closest("#limpar-filtros")) { limparFiltros(); return; }
    var b = ev.target.closest(".linha"); if (!b) return;
    var p = estado.produtos.find(function (x) { return x.id === b.dataset.id; });
    if (p) abrirEditor(p, false);
  });
  $("#btn-novo").addEventListener("click", function () { abrirEditor(novoProduto(), true); });

  /* ---------------- editor ---------------- */
  var ed = null, edNovo = false, sujo = false, enviando = 0, pendentes = 0;
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
    var d = new Date(), md = (d.getMonth() + 1) * 100 + d.getDate();
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

  function erroCampo(nome, msg) {
    var i = form[nome], p = $('[data-erro="' + nome + '"]', form);
    if (i) i.classList.toggle("is-erro", !!msg);
    if (p) p.textContent = msg || "";
  }
  function erroGeral(msg) {
    var b = $("#ed-erro"); b.hidden = !msg; $("p", b).textContent = msg || "";
  }
  function subtitulo() {
    if (edNovo) return "Ainda não salvo";
    return (CATEGORIAS[ed.categoria] || "Sem categoria") + " · " + ((ESTACOES[ed.estacao] || ["—"])[0]);
  }

  function abrirEditor(p, novo) {
    ed = JSON.parse(JSON.stringify(p));
    ed.cores = ed.cores || []; ed.tamanhos = ed.tamanhos || []; ed.estoque = ed.estoque || {}; ed.fotos = ed.fotos || [];
    if (!ed.tamanhos.length) ed.tamanhos = ((CFG.gradePadrao || {})[ed.categoria] || (CFG.gradePadrao || {})._ || ["P", "M", "G", "GG"]).slice();
    edNovo = novo; sujo = false;
    $("#ed-titulo").textContent = novo ? "Novo produto" : (ed.ref + (ed.tipo ? " · " + ed.tipo : ""));
    $("#ed-sub").textContent = subtitulo();
    $("#ed-ver").hidden = novo; $("#ed-ver").href = "produto.html?id=" + encodeURIComponent(ed.id);
    $("#ed-excluir").hidden = novo;
    form.tipo.value = ed.tipo || ""; form.ref.value = ed.ref || ""; form.categoria.value = ed.categoria || "";
    form.estacao.value = ESTACOES[ed.estacao] ? ed.estacao : "primavera"; form.data.value = ed.data || "";
    form.descricao.value = ed.descricao || "";
    form.visivel.checked = ed.visivel !== false; form.esgotado.checked = !!ed.esgotado; form.destaque.checked = !!ed.destaque;
    erroCampo("tipo"); erroCampo("ref"); erroGeral();
    preencherSugestoes(); renderFotos(); renderChips(); renderEstoque();
    var g = $("#gaveta"); g.classList.remove("is-saindo"); g.hidden = false; document.body.classList.add("trava");
    $(".gaveta__corpo").scrollTop = 0;
    setTimeout(function () { (novo ? form.tipo : $(".gaveta__topo .btn-icone")).focus(); }, 60);
  }
  function fecharEditor(forcar) {
    if (!ed) return;
    if (!forcar && enviando) { toast("Espere as fotos terminarem de enviar.", true); return; }
    var fechar = function () {
      var g = $("#gaveta"); g.classList.add("is-saindo");
      setTimeout(function () { g.hidden = true; g.classList.remove("is-saindo"); document.body.classList.remove("trava"); }, 190);
      ed = null;
    };
    if (!forcar && sujo) {
      confirmar("Sair sem salvar?", "As alterações deste produto serão perdidas.", "Sair sem salvar", true).then(function (s) { if (s) fechar(); });
    } else fechar();
  }
  $$("[data-fechar]").forEach(function (b) { b.addEventListener("click", function () { fecharEditor(false); }); });
  document.addEventListener("keydown", function (ev) { if (ev.key === "Escape" && ed && $("#dialogo").hidden) fecharEditor(false); });
  form.addEventListener("input", function (ev) {
    sujo = true;
    if (ev.target.name === "tipo" || ev.target.name === "ref") erroCampo(ev.target.name);
  });
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
    var n = ed.fotos.length, h = ed.fotos.map(function (f, i) {
      return '<li class="foto"><img src="' + esc(f.s || f.l) + '" alt="Foto ' + (i + 1) + '">' +
        (i === 0 ? '<span class="foto__capa">Capa</span>' : "") +
        '<span class="foto__acoes">' +
        '<button type="button" data-mover="-1" data-i="' + i + '" aria-label="Mover para a esquerda"' + (i === 0 ? " disabled" : "") + ">" + ic("left") + "</button>" +
        '<button type="button" data-remover data-i="' + i + '" aria-label="Remover foto">' + ic("trash") + "</button>" +
        '<button type="button" data-mover="1" data-i="' + i + '" aria-label="Mover para a direita"' + (i === n - 1 ? " disabled" : "") + ">" + ic("right") + "</button>" +
        "</span></li>";
    }).join("");
    for (var k = 0; k < pendentes; k++) h += '<li class="foto foto--enviando"><span class="spinner"></span></li>';
    h += '<li><label class="foto-add">' + ic("upload") + "<span>" + (n ? "Adicionar fotos" : "Adicionar a primeira foto") + "</span>" +
      '<input type="file" id="ed-arquivo" accept="image/*" multiple aria-label="Adicionar fotos"></label></li>';
    $("#ed-fotos").innerHTML = h;
  }
  $("#ed-fotos").addEventListener("click", function (ev) {
    var b = ev.target.closest("button"); if (!b) return;
    var i = +b.dataset.i;
    if (b.hasAttribute("data-remover")) {
      confirmar("Remover esta foto?", "Ela sai do produto quando você salvar.", "Remover", true).then(function (s) {
        if (!s || !ed) return; ed.fotos.splice(i, 1); sujo = true; renderFotos();
      });
      return;
    }
    var j = i + (+b.dataset.mover); if (j < 0 || j >= ed.fotos.length) return;
    var t = ed.fotos[i]; ed.fotos[i] = ed.fotos[j]; ed.fotos[j] = t;
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
  function enviarArquivo(arquivo, id) {
    return carregarImagem(arquivo).then(function (img) {
      return Promise.all([redimensionar(img, 520), redimensionar(img, 1100)]);
    }).then(function (bs) {
      var base = "/api/admin/foto?produto=" + encodeURIComponent(id) + "&tam=";
      return Promise.all([api("POST", base + "s", bs[0], bs[0].type), api("POST", base + "l", bs[1], bs[1].type)]);
    }).then(function (rs) { return { s: rs[0].url, l: rs[1].url }; });
  }
  $("#ed-fotos").addEventListener("change", function (ev) {
    var inp = ev.target; if (inp.id !== "ed-arquivo") return;
    var arquivos = Array.prototype.slice.call(inp.files || []);
    if (!arquivos.length || !ed) return;
    var alvo = ed, feitos = 0;
    enviando += arquivos.length; pendentes += arquivos.length; sujo = true; renderFotos();
    // uma de cada vez, para manter a ordem
    arquivos.reduce(function (cadeia, arq) {
      return cadeia.then(function () {
        return enviarArquivo(arq, alvo.id).then(function (f) { alvo.fotos.push(f); feitos++; })
          .catch(function (e) { toast(e.message, true); })
          .then(function () { enviando--; pendentes--; if (ed === alvo) renderFotos(); });
      });
    }, Promise.resolve()).then(function () {
      if (feitos) toast(plural(feitos, "foto enviada", "fotos enviadas") + ". Lembre de salvar.");
    });
  });

  /* cores e tamanhos */
  function renderChips() {
    $("#ed-cores").innerHTML = ed.cores.map(function (c, i) {
      return '<span class="chip">' + swatch(c) + esc(c) + '<button type="button" data-tipo="cores" data-i="' + i + '" aria-label="Remover ' + esc(c) + '">' + ic("x") + "</button></span>";
    }).join("");
    $("#ed-tams").innerHTML = ed.tamanhos.map(function (t, i) {
      return '<span class="chip">' + esc(t) + '<button type="button" data-tipo="tamanhos" data-i="' + i + '" aria-label="Remover ' + esc(t) + '">' + ic("x") + "</button></span>";
    }).join("");
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
  function somar(lista) {
    var tot = 0, tem = false;
    lista.forEach(function (k) { var v = ed.estoque[k]; if (v != null) { tot += v; tem = true; } });
    return tem ? tot.toLocaleString("pt-BR") : "–";
  }
  function renderEstoque() {
    var cores = linhasCores();
    if (!ed.tamanhos.length) { $("#ed-estoque").innerHTML = '<p class="chips-vazio" style="padding:16px">Cadastre os tamanhos para preencher o estoque.</p>'; return; }
    var h = '<table><thead><tr><th scope="col" style="text-align:left;padding-left:14px">' + (ed.cores.length ? "Cor" : "") + "</th>" +
      ed.tamanhos.map(function (t) { return '<th scope="col">' + esc(t) + "</th>"; }).join("") + '<th scope="col">Total</th></tr></thead><tbody>';
    cores.forEach(function (c) {
      h += '<tr><th scope="row">' + (c ? swatch(c) + esc(c) : "Quantidade") + "</th>";
      ed.tamanhos.forEach(function (t) {
        var v = ed.estoque[chave(c, t)];
        h += '<td><input type="number" min="0" step="1" inputmode="numeric" data-k="' + esc(chave(c, t)) + '" value="' + (v != null ? v : "") + '"' +
          (v === 0 ? ' class="is-zero"' : "") + ' placeholder="–" aria-label="' + esc((c ? c + ", " : "") + "tamanho " + t) + '"></td>';
      });
      h += '<td class="estoque__tot" data-tot-linha>' + somar(ed.tamanhos.map(function (t) { return chave(c, t); })) + "</td></tr>";
    });
    h += "</tbody>";
    if (cores.length > 1) {
      h += "<tfoot><tr><th>Total</th>" + ed.tamanhos.map(function (t) {
        return '<td data-tot-col="' + esc(t) + '">' + somar(cores.map(function (c) { return chave(c, t); })) + "</td>";
      }).join("") + "<td data-tot-geral>" + somar(Object.keys(ed.estoque)) + "</td></tr></tfoot>";
    }
    $("#ed-estoque").innerHTML = h + "</table>";
  }
  $("#ed-estoque").addEventListener("input", function (ev) {
    var i = ev.target.closest("input[data-k]"); if (!i) return;
    var n = parseInt(i.value, 10);
    if (i.value === "" || !isFinite(n)) delete ed.estoque[i.dataset.k]; else ed.estoque[i.dataset.k] = Math.max(0, n);
    i.classList.toggle("is-zero", ed.estoque[i.dataset.k] === 0);
    sujo = true;
    var partes = i.dataset.k.split("|"), cor = partes[0], tam = partes.slice(1).join("|");
    $("[data-tot-linha]", i.closest("tr")).textContent = somar(ed.tamanhos.map(function (t) { return chave(cor, t); }));
    var col = $$("[data-tot-col]", $("#ed-estoque")).find(function (x) { return x.dataset.totCol === tam; });
    if (col) col.textContent = somar(linhasCores().map(function (c) { return chave(c, tam); }));
    var g = $("[data-tot-geral]", $("#ed-estoque")); if (g) g.textContent = somar(Object.keys(ed.estoque));
  });
  $("#ed-todos-btn").addEventListener("click", function () {
    var n = parseInt($("#ed-todos").value, 10);
    if (!isFinite(n) || n < 0) { $("#ed-todos").focus(); return; }
    linhasCores().forEach(function (c) { ed.tamanhos.forEach(function (t) { ed.estoque[chave(c, t)] = n; }); });
    $("#ed-todos").value = ""; sujo = true; renderEstoque();
  });
  $("#ed-limpar-btn").addEventListener("click", function () {
    if (!Object.keys(ed.estoque).length) return;
    confirmar("Limpar as quantidades?", "O produto fica sem controle de estoque até você preencher de novo.", "Limpar", true).then(function (s) {
      if (s && ed) { ed.estoque = {}; sujo = true; renderEstoque(); }
    });
  });

  /* salvar / excluir */
  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    if (enviando) { toast("Espere as fotos terminarem de enviar.", true); return; }
    erroGeral();
    if ($("#ed-cor-nova").value.trim()) adicionar("cores", $("#ed-cor-nova"));
    if ($("#ed-tam-novo").value.trim()) adicionar("tamanhos", $("#ed-tam-novo"));
    ed.tipo = form.tipo.value.trim(); ed.ref = form.ref.value.trim().toUpperCase(); ed.categoria = form.categoria.value;
    ed.estacao = form.estacao.value; ed.data = form.data.value || new Date().toISOString().slice(0, 10);
    ed.descricao = form.descricao.value.trim();
    ed.visivel = form.visivel.checked; ed.esgotado = form.esgotado.checked; ed.destaque = form.destaque.checked;
    var falhou = false;
    if (!ed.tipo) { erroCampo("tipo", "Informe o tipo de peça, por exemplo Vestido."); falhou = true; }
    if (!ed.ref) { erroCampo("ref", "Informe a referência."); falhou = true; }
    if (falhou) {
      var alvoErro = $(".is-erro", form);
      $(".gaveta__corpo").scrollTo({ top: alvoErro.closest(".painel").offsetTop - 12, behavior: "smooth" });
      alvoErro.focus({ preventScroll: true }); return;
    }
    if (!ed.tamanhos.length) { erroGeral("Cadastre pelo menos um tamanho."); return; }
    var seguir = (!ed.fotos.length && ed.visivel)
      ? confirmar("Salvar sem fotos?", "O produto vai aparecer no site sem imagem.", "Salvar assim")
      : Promise.resolve(true);
    seguir.then(function (ok) {
      if (!ok) return;
      limparEstoqueOrfao();
      var btn = $("#ed-salvar"); btn.disabled = true; btn.innerHTML = SPIN_BRANCO + " Salvando";
      api("PUT", "/api/admin/produto", { produto: ed }).then(function (d) {
        var i = estado.produtos.findIndex(function (x) { return x.id === d.produto.id; });
        if (i >= 0) estado.produtos[i] = d.produto; else estado.produtos.unshift(d.produto);
        estado.atualizadoEm = d.atualizadoEm || estado.atualizadoEm;
        estado.vazio = false; renderVazio();
        toast(edNovo ? "Produto criado." : "Alterações salvas.");
        fecharEditor(true); renderLista();
      }).catch(function (e) {
        if (/referência/i.test(e.message)) erroCampo("ref", e.message); else erroGeral(e.message);
      }).then(function () { btn.disabled = false; btn.textContent = "Salvar"; });
    });
  });

  $("#ed-excluir").addEventListener("click", function () {
    if (!ed) return;
    var id = ed.id, ref = ed.ref, b = this;
    confirmar("Excluir " + ref + "?", "Essa ação não pode ser desfeita. Para só tirar do site, desligue “Mostrar no site”.", "Excluir", true).then(function (s) {
      if (!s) return;
      b.disabled = true;
      api("DELETE", "/api/admin/produto?id=" + encodeURIComponent(id)).then(function () {
        estado.produtos = estado.produtos.filter(function (x) { return x.id !== id; });
        toast(ref + " excluído."); fecharEditor(true); renderLista();
      }).catch(function (e) { erroGeral(e.message); }).then(function () { b.disabled = false; });
    });
  });

  /* ---------------- configurações ---------------- */
  var CAMPOS_CFG = ["whatsapp", "whatsappExibicao", "instagram", "email", "endereco", "horario", "pedidoMinimo", "pagamento", "envio"];
  var cfgSujo = false;
  function marcarCfg(s) {
    cfgSujo = s; $("#cfg-barra").classList.toggle("is-sujo", s);
    $("#cfg-estado").textContent = s ? "Alterações não salvas" : "Tudo salvo";
  }
  function preencherConfig() {
    var f = $("#form-config"), c = estado.config;
    CAMPOS_CFG.forEach(function (k) { var v = c[k] != null ? c[k] : (CFG[k] || ""); f[k].value = /^\(00\)/.test(v) ? "" : v; });
    f.avisos.value = (c.avisos || CFG.avisos || []).join("\n");
    marcarCfg(false);
  }
  $("#form-config").addEventListener("input", function () { marcarCfg(true); });
  $("#form-config").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var f = ev.target, cfg = {};
    CAMPOS_CFG.forEach(function (k) { cfg[k] = f[k].value.trim(); });
    cfg.whatsapp = cfg.whatsapp.replace(/\D/g, "");
    cfg.instagram = cfg.instagram.replace(/^@/, "").replace(/^https?:\/\/(www\.)?instagram\.com\//, "").replace(/\/.*$/, "");
    cfg.avisos = f.avisos.value.split("\n").map(function (s) { return s.trim(); }).filter(Boolean);
    if (cfg.whatsapp && cfg.whatsapp.length < 12) {
      toast("Confira o WhatsApp: use 55 + DDD + número.", true); f.whatsapp.classList.add("is-erro"); f.whatsapp.focus(); return;
    }
    f.whatsapp.classList.remove("is-erro");
    var b = f.querySelector("button[type=submit]"); b.disabled = true; b.innerHTML = SPIN_BRANCO + " Salvando";
    api("PUT", "/api/admin/catalogo", { config: cfg }).then(function (d) {
      estado.config = cfg; estado.atualizadoEm = d.atualizadoEm || estado.atualizadoEm;
      preencherConfig(); renderResumo(); toast("Configurações salvas. O site atualiza em até 1 minuto.");
    }).catch(function (e) { toast(e.message, true); }).then(function () { b.disabled = false; b.textContent = "Salvar configurações"; });
  });


  /* ---------------- banner ---------------- */
  var BN_TXT = ["selo", "titulo", "data", "horario", "local", "endereco", "texto", "botao", "ate"];
  var bn = null, bnSujo = false, bnEnviando = 0;
  function marcarBn(v) {
    bnSujo = v; $("#bn-barra").classList.toggle("is-sujo", v);
    $("#bn-estado").textContent = v ? "Alterações não salvas" : "Tudo salvo";
    statusBanner();
  }
  function statusBanner() {
    var f = $("#form-banner"), el = $("#bn-status"), ate = f.ate.value;
    var hoje = new Date().toISOString().slice(0, 10);
    if (!f.ativo.checked) el.textContent = "Desligado. Ninguém vê o banner no site.";
    else if (ate && ate < hoje) el.innerHTML = '<span style="color:var(--alerta)">A data “Mostrar até” já passou (' + ate.split("-").reverse().join("/") + '). Atualize para o banner voltar a aparecer.</span>';
    else el.textContent = ate ? "No ar até " + ate.split("-").reverse().join("/") + "." : "No ar.";
  }
  function preencherBanner() {
    bn = JSON.parse(JSON.stringify(estado.config.banner || CFG.banner || {}));
    bn.marcas = bn.marcas || [];
    var f = $("#form-banner");
    f.ativo.checked = !!bn.ativo;
    BN_TXT.forEach(function (k) { f[k].value = bn[k] || ""; });
    renderBnImagens(); marcarBn(false);
  }
  function itemImg(url, i, tipo, total) {
    return '<li class="foto"><img src="' + esc(url) + '" alt="">' +
      '<span class="foto__acoes">' +
      (tipo === "marcas" && i > 0 ? '<button type="button" data-bn="' + tipo + '" data-mover="-1" data-i="' + i + '" aria-label="Mover para a esquerda">' + ic("left") + "</button>" : "") +
      '<button type="button" data-bn="' + tipo + '" data-remover data-i="' + i + '" aria-label="Remover">' + ic("trash") + "</button>" +
      (tipo === "marcas" && i < total - 1 ? '<button type="button" data-bn="' + tipo + '" data-mover="1" data-i="' + i + '" aria-label="Mover para a direita">' + ic("right") + "</button>" : "") +
      "</span></li>";
  }
  function addTile(tipo, txt, multiplo) {
    return '<li><label class="foto-add">' + ic("upload") + "<span>" + txt + "</span>" +
      '<input type="file" accept="image/*" data-bn-up="' + tipo + '"' + (multiplo ? " multiple" : "") + ' aria-label="' + txt + '"></label></li>';
  }
  function renderBnImagens() {
    $("#bn-foto").innerHTML = (bn.imagem ? itemImg(bn.imagem, 0, "imagem", 1) : "") +
      (bnEnviando && !bn.imagem ? '<li class="foto foto--enviando"><span class="spinner"></span></li>' : "") +
      addTile("imagem", bn.imagem ? "Trocar foto" : "Enviar foto", false);
    $("#bn-marcas").innerHTML = bn.marcas.map(function (m, i) { return itemImg(m, i, "marcas", bn.marcas.length); }).join("") +
      addTile("marcas", "Adicionar", true);
  }
  $("#form-banner").addEventListener("click", function (ev) {
    var b = ev.target.closest("button[data-bn]"); if (!b) return;
    var tipo = b.dataset.bn, i = +b.dataset.i;
    if (b.hasAttribute("data-remover")) {
      if (tipo === "imagem") bn.imagem = ""; else bn.marcas.splice(i, 1);
    } else {
      var j = i + (+b.dataset.mover), t = bn.marcas[i]; bn.marcas[i] = bn.marcas[j]; bn.marcas[j] = t;
    }
    renderBnImagens(); marcarBn(true);
  });
  $("#form-banner").addEventListener("change", function (ev) {
    var inp = ev.target;
    if (!inp.dataset.bnUp) return;
    var tipo = inp.dataset.bnUp, arquivos = Array.prototype.slice.call(inp.files || []);
    if (!arquivos.length) return;
    bnEnviando += arquivos.length; renderBnImagens();
    arquivos.reduce(function (cadeia, arq) {
      return cadeia.then(function () {
        return carregarImagem(arq).then(function (img) { return redimensionar(img, tipo === "imagem" ? 1100 : 240); })
          .then(function (blob) { return api("POST", "/api/admin/foto?produto=banner&tam=" + (tipo === "imagem" ? "l" : "s"), blob, blob.type); })
          .then(function (r) { if (tipo === "imagem") bn.imagem = r.url; else bn.marcas.push(r.url); marcarBn(true); })
          .catch(function (e) { toast(e.message, true); })
          .then(function () { bnEnviando--; renderBnImagens(); });
      });
    }, Promise.resolve());
  });
  $("#form-banner").addEventListener("input", function (ev) { if (!ev.target.dataset.bnUp) marcarBn(true); });
  $("#form-banner").addEventListener("submit", function (ev) {
    ev.preventDefault();
    if (bnEnviando) { toast("Espere as imagens terminarem de enviar.", true); return; }
    var f = ev.target;
    bn.ativo = f.ativo.checked;
    BN_TXT.forEach(function (k) { bn[k] = f[k].value.trim(); });
    if (bn.ativo && !bn.titulo) { toast("Escreva um título para o banner.", true); f.titulo.focus(); return; }
    var b = f.querySelector("button[type=submit]"); b.disabled = true; b.innerHTML = SPIN_BRANCO + " Salvando";
    api("PUT", "/api/admin/catalogo", { config: { banner: bn } }).then(function (d) {
      estado.config.banner = JSON.parse(JSON.stringify(bn)); estado.atualizadoEm = d.atualizadoEm || estado.atualizadoEm;
      marcarBn(false); renderResumo(); toast("Banner salvo. O site atualiza em até 1 minuto.");
    }).catch(function (e) { toast(e.message, true); }).then(function () { b.disabled = false; b.textContent = "Salvar banner"; });
  });

  window.addEventListener("beforeunload", function (ev) {
    if ((ed && (sujo || enviando)) || cfgSujo || bnSujo) { ev.preventDefault(); ev.returnValue = ""; }
  });

  carregar();
})();

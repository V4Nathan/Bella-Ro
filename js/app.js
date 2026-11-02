/* Atacado Bella Rô — catálogo digital (sem dependências) */
(function () {
  "use strict";
  var C = window.BELLA_CONFIG || {};
  var RAW = window.BELLA_PRODUTOS || [];
  var PAGE = document.body.getAttribute("data-page");

  var ESTACOES = {
    primavera: { nome: "Primavera", prefixo: "PR" },
    verao: { nome: "Verão", prefixo: "VE" },
    outono: { nome: "Outono", prefixo: "OU" },
    inverno: { nome: "Inverno", prefixo: "IN" }
  };
  var ORDEM_ESTACOES = ["primavera", "verao", "outono", "inverno"];
  var CATEGORIAS = {
    vestidos: "Vestidos", conjuntos: "Conjuntos", blusas: "Blusas e camisas", tricos: "Tricôs e casacos",
    calcas: "Calças e bermudas", saias: "Saias", macacoes: "Macacões", moletons: "Moletons",
    masculino: "Masculino", praia: "Praia e acessórios"
  };
  var ORDEM_CATEGORIAS = ["vestidos", "conjuntos", "blusas", "tricos", "calcas", "saias", "macacoes", "moletons", "masculino", "praia"];

  /* ---------------- dados ---------------- */
  var PRODUTOS = RAW.map(function (p) {
    return {
      id: p.id, ref: p.ref, estacao: p.e, categoria: CATEGORIAS[p.c] ? p.c : "", data: p.d, fotos: p.f,
      nome: (p.t || "Modelo") + " " + p.ref,
      thumb: function (i) { return "img/" + p.e + "/s/" + p.f[i || 0] + ".webp"; },
      foto: function (i) { return "img/" + p.e + "/l/" + p.f[i || 0] + ".webp"; }
    };
  }).sort(function (a, b) { return a.data < b.data ? 1 : a.data > b.data ? -1 : (a.ref < b.ref ? 1 : -1); });
  var POR_ID = {};
  PRODUTOS.forEach(function (p) { POR_ID[p.id] = p; });
  var DATA_MAIS_RECENTE = PRODUTOS.length ? PRODUTOS[0].data : "";
  function ehNovo(p) {
    if (!DATA_MAIS_RECENTE) return false;
    var diff = (new Date(DATA_MAIS_RECENTE) - new Date(p.data)) / 864e5;
    return diff <= (C.diasNovidade || 45);
  }

  /* ---------------- utilidades ---------------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function qs(k) { return new URLSearchParams(location.search).get(k); }
  function urlWpp(msg) {
    var n = String(C.whatsapp || "").replace(/\D/g, "");
    return (n ? "https://wa.me/" + n : "https://wa.me/") + "?text=" + encodeURIComponent(msg);
  }
  function linkProduto(p) {
    if (!/^https?:/.test(location.protocol)) return "";
    return new URL("produto.html?id=" + p.id, location.href).href;
  }
  function plural(n, s, p) { return n + " " + (n === 1 ? s : p); }

  var I = {
    menu: '<svg viewBox="0 0 24 24"><path d="M3 7h18M3 12h18M3 17h18"/></svg>',
    bag: '<svg viewBox="0 0 24 24"><path d="M5 8h14l-1 13H6L5 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
    close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    arrowL: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
    arrowR: '<svg viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>',
    insta: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".6"/></svg>',
    wpp: '<svg viewBox="0 0 32 32"><path d="M16.04 3C9.02 3 3.3 8.7 3.3 15.72c0 2.24.59 4.43 1.7 6.36L3.2 28.8l6.9-1.8a12.7 12.7 0 0 0 5.94 1.5h.01c7.02 0 12.74-5.7 12.74-12.72C28.79 8.7 23.07 3 16.04 3zm0 23.3h-.01a10.6 10.6 0 0 1-5.4-1.48l-.39-.23-4.1 1.07 1.1-3.99-.25-.41a10.5 10.5 0 0 1-1.62-5.62c0-5.84 4.76-10.58 10.68-10.58 5.84 0 10.6 4.74 10.6 10.58 0 5.85-4.76 10.66-10.6 10.66zm5.82-7.93c-.32-.16-1.88-.93-2.17-1.03-.29-.11-.5-.16-.71.16-.21.32-.82 1.03-1 1.24-.18.21-.37.24-.69.08-.32-.16-1.34-.5-2.56-1.58-.94-.84-1.58-1.88-1.77-2.2-.18-.32-.02-.49.14-.65.14-.14.32-.37.48-.56.16-.18.21-.32.32-.53.1-.21.05-.4-.03-.56-.08-.16-.71-1.71-.98-2.34-.26-.62-.52-.53-.71-.54h-.61c-.21 0-.56.08-.85.4-.29.32-1.11 1.09-1.11 2.65 0 1.56 1.14 3.07 1.3 3.28.16.21 2.24 3.42 5.43 4.8.76.33 1.35.52 1.81.67.76.24 1.45.2 2 .12.61-.09 1.88-.77 2.14-1.51.27-.74.27-1.38.19-1.51-.08-.13-.29-.21-.61-.37z"/></svg>',
    truck: '<svg viewBox="0 0 32 32"><path d="M3 8h16v14H3zM19 13h6l4 5v4h-10"/><circle cx="9" cy="24" r="2.5"/><circle cx="24" cy="24" r="2.5"/></svg>',
    box: '<svg viewBox="0 0 32 32"><path d="M4 10l12-6 12 6v12l-12 6-12-6z"/><path d="M4 10l12 6 12-6M16 16v12"/></svg>',
    card: '<svg viewBox="0 0 32 32"><rect x="3" y="7" width="26" height="18" rx="2"/><path d="M3 12h26M7 20h6"/></svg>',
    spark: '<svg viewBox="0 0 32 32"><path d="M16 3v8M16 21v8M3 16h8M21 16h8M7 7l5 5M20 20l5 5M25 7l-5 5M12 20l-5 5"/></svg>'
  };

  /* ---------------- cabeçalho / rodapé ---------------- */
  function linkCat(c) { return "catalogo.html?categoria=" + c; }
  function linkEst(e) { return "catalogo.html?estacao=" + e; }
  var NAV = [
    { href: "catalogo.html", txt: "Novidades", key: "todas" },
    { href: linkCat("vestidos"), txt: "Vestidos", key: "vestidos" },
    { href: linkCat("conjuntos"), txt: "Conjuntos", key: "conjuntos" },
    { href: linkCat("blusas"), txt: "Blusas", key: "blusas" },
    { href: linkCat("tricos"), txt: "Tricôs", key: "tricos" },
    { href: linkCat("calcas"), txt: "Calças", key: "calcas" },
    { href: "catalogo.html", txt: "Categorias", key: "cats", filhos: ORDEM_CATEGORIAS.map(function (c) { return { href: linkCat(c), txt: CATEGORIAS[c] }; }) },
    { href: "catalogo.html", txt: "Coleções", key: "colecoes", filhos: ORDEM_ESTACOES.map(function (e) { return { href: linkEst(e), txt: ESTACOES[e].nome }; }) },
    { href: "como-comprar.html", txt: "Como comprar", key: "comprar" }
  ];
  function navAtivo() {
    if (PAGE === "comprar") return "comprar";
    if (PAGE === "catalogo") {
      var c = qs("categoria"), e = qs("estacao");
      if (c && !e) return ["vestidos", "conjuntos", "blusas", "tricos", "calcas"].indexOf(c) >= 0 ? c : "cats";
      if (e && !c) return "colecoes";
      if (!c && !e) return "todas";
    }
    return "";
  }
  function itemNav(n, ativo) {
    var cur = n.key === ativo ? ' aria-current="page"' : "";
    if (!n.filhos) return '<li><a href="' + n.href + '"' + cur + ">" + n.txt + "</a></li>";
    return '<li class="has-sub"><a href="' + n.href + '"' + cur + ' aria-haspopup="true">' + n.txt + ' <span class="caret">▾</span></a><div class="sub"><ul>' +
      n.filhos.map(function (f) { return '<li><a href="' + f.href + '">' + f.txt + "</a></li>"; }).join("") + "</ul></div></li>";
  }
  function renderChrome() {
    var ativo = navAtivo();
    var avisos = (C.avisos || []).map(function (a) { return "<span>" + esc(a) + "</span>"; }).join("");
    var header =
      '<div class="topbar" aria-hidden="true"><div class="topbar__track">' + avisos + avisos + avisos + avisos + "</div></div>" +
      '<header class="header"><div class="wrap"><div class="header__row">' +
      '<div class="header__left"><button class="icon-btn menu-toggle" data-open="menu" aria-label="Abrir menu">' + I.menu + "</button>" +
      '<a class="header__wpp" href="' + urlWpp("Olá! Vim pelo catálogo da Bella Rô e gostaria de atendimento.") + '" target="_blank" rel="noopener">' + I.wpp.replace("<svg", '<svg fill="currentColor"') + " Fale conosco</a></div>" +
      '<a class="header__logo" href="index.html" aria-label="Atacado Bella Rô — início"><img src="assets/bella-ro-logo-preto.svg" alt="Atacado Bella Rô" width="153" height="54"></a>' +
      '<div class="header__right"><button class="icon-btn" data-open="bag" aria-label="Abrir sacola de pedido">' + I.bag + '<span class="badge-count" data-bag-count data-n="0">0</span></button></div>' +
      '</div></div><nav class="nav" aria-label="Principal"><ul>' +
      NAV.map(function (n) { return itemNav(n, ativo); }).join("") +
      "</ul></nav></header>";
    $("#site-header").outerHTML = header;

    var ig = C.instagram ? "https://instagram.com/" + C.instagram : "#";
    var footer =
      '<footer class="footer"><div class="wrap"><div class="footer__grid">' +
      '<div><img class="footer__logo" src="assets/bella-ro-logo-branco.svg" alt="Atacado Bella Rô" width="164" height="58">' +
      "<p>Moda feminina no atacado para lojistas e revendedoras de todo o Brasil.</p>" +
      '<div class="footer__social"><a href="' + ig + '" target="_blank" rel="noopener" aria-label="Instagram">' + I.insta + "</a>" +
      '<a href="' + urlWpp("Olá! Vim pelo catálogo da Bella Rô.") + '" target="_blank" rel="noopener" aria-label="WhatsApp">' + I.wpp.replace("<svg", '<svg style="fill:currentColor;stroke:none"') + "</a></div></div>" +
      "<div><h4>Categorias</h4><ul>" + ORDEM_CATEGORIAS.slice(0, 6).map(function (c) { return '<li><a href="' + linkCat(c) + '">' + CATEGORIAS[c] + "</a></li>"; }).join("") +
      '<li><a href="catalogo.html">Ver tudo</a></li></ul></div>' +
      "<div><h4>Coleções</h4><ul>" + ORDEM_ESTACOES.map(function (e) { return '<li><a href="' + linkEst(e) + '">' + ESTACOES[e].nome + "</a></li>"; }).join("") + "</ul></div>" +
      '<div><h4>Atacado</h4><ul><li><a href="como-comprar.html">Como comprar</a></li><li><a href="como-comprar.html#duvidas">Dúvidas frequentes</a></li><li><a href="#" data-open="bag">Minha sacola</a></li></ul></div>' +
      "<div><h4>Fale conosco</h4><ul>" +
      '<li><a href="' + urlWpp("Olá! Vim pelo catálogo da Bella Rô.") + '" target="_blank" rel="noopener">WhatsApp ' + esc(C.whatsappExibicao || "") + "</a></li>" +
      (C.email ? '<li><a href="mailto:' + esc(C.email) + '">' + esc(C.email) + "</a></li>" : "") +
      (C.endereco ? "<li>" + esc(C.endereco) + "</li>" : "") +
      (C.horario ? "<li>" + esc(C.horario) + "</li>" : "") +
      "</ul></div></div>" +
      '<div class="footer__bottom"><span>© ' + new Date().getFullYear() + " " + esc(C.marca || "Atacado Bella Rô") + ". Todos os direitos reservados.</span><span>Venda exclusiva para atacado</span></div></div></footer>";
    $("#site-footer").outerHTML = footer;

    var extra =
      '<div class="drawer drawer--left" id="drawer-menu" aria-hidden="true"><div class="drawer__bg" data-close></div><div class="drawer__panel" role="dialog" aria-label="Menu">' +
      '<div class="drawer__head"><span class="drawer__title">Menu</span><button class="icon-btn" data-close aria-label="Fechar">' + I.close + "</button></div>" +
      '<div class="drawer__body"><nav class="mnav"><a href="catalogo.html">Novidades<span>›</span></a>' +
      '<p class="mnav__label">Categorias</p>' + ORDEM_CATEGORIAS.map(function (c) { return '<a href="' + linkCat(c) + '">' + CATEGORIAS[c] + "<span>›</span></a>"; }).join("") +
      '<p class="mnav__label">Coleções</p>' + ORDEM_ESTACOES.map(function (e) { return '<a href="' + linkEst(e) + '">' + ESTACOES[e].nome + "<span>›</span></a>"; }).join("") +
      '<p class="mnav__label">Atacado</p><a href="como-comprar.html">Como comprar<span>›</span></a></nav>' +
      '<div style="margin-top:28px"><a class="btn btn--wpp btn--block" href="' + urlWpp("Olá! Vim pelo catálogo da Bella Rô e gostaria de atendimento.") + '" target="_blank" rel="noopener">' + I.wpp.replace("<svg", '<svg fill="currentColor"') + " Fale conosco</a></div></div></div></div>" +
      '<div class="drawer drawer--right" id="drawer-bag" aria-hidden="true"><div class="drawer__bg" data-close></div><div class="drawer__panel" role="dialog" aria-label="Sacola de pedido">' +
      '<div class="drawer__head"><span class="drawer__title">Sacola de pedido</span><button class="icon-btn" data-close aria-label="Fechar">' + I.close + "</button></div>" +
      '<div class="drawer__body" id="bag-body"></div><div class="bag-foot" id="bag-foot"></div></div></div>' +
      '<div class="toast" id="toast" role="status" aria-live="polite"></div>' +
      '<a class="wpp-float" href="' + urlWpp("Olá! Vim pelo catálogo da Bella Rô e gostaria de atendimento.") + '" target="_blank" rel="noopener" aria-label="Falar no WhatsApp">' + I.wpp + "</a>";
    document.body.insertAdjacentHTML("beforeend", extra);

    document.addEventListener("click", function (ev) {
      var o = ev.target.closest("[data-open]");
      if (o) { ev.preventDefault(); abrir(o.getAttribute("data-open")); return; }
      var c = ev.target.closest("[data-close]");
      if (c) { fecharTodos(); }
    });
    document.addEventListener("keydown", function (ev) { if (ev.key === "Escape") { fecharTodos(); fecharLightbox(); } });
  }
  function abrir(qual) {
    fecharTodos();
    var d = $("#drawer-" + qual);
    if (!d) return;
    if (qual === "bag") renderSacola();
    d.classList.add("is-open"); d.setAttribute("aria-hidden", "false");
    document.documentElement.style.overflow = "hidden";
  }
  function fecharTodos() {
    $$(".drawer.is-open").forEach(function (d) { d.classList.remove("is-open"); d.setAttribute("aria-hidden", "true"); });
    document.documentElement.style.overflow = "";
  }
  var toastT;
  function toast(msg) {
    var t = $("#toast"); t.textContent = msg; t.classList.add("is-on");
    clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove("is-on"); }, 2600);
  }

  /* ---------------- sacola (pedido via WhatsApp) ---------------- */
  var KEY = "bellaro_sacola_v1";
  function lerSacola() {
    try { var s = JSON.parse(localStorage.getItem(KEY) || "[]"); return s.filter(function (i) { return POR_ID[i.id]; }); } catch (e) { return []; }
  }
  function salvarSacola(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} atualizarContador(); }
  function atualizarContador() {
    var n = lerSacola().reduce(function (t, i) { return t + i.q; }, 0);
    $$("[data-bag-count]").forEach(function (b) { b.textContent = n; b.setAttribute("data-n", n); });
  }
  function adicionar(id, q, obs) {
    var s = lerSacola(); q = Math.max(1, parseInt(q, 10) || 1);
    var it = s.filter(function (i) { return i.id === id; })[0];
    if (it) { it.q += q; if (obs) it.obs = obs; } else s.push({ id: id, q: q, obs: obs || "" });
    salvarSacola(s);
    toast(POR_ID[id].nome + " adicionado à sacola");
  }
  function renderSacola() {
    var s = lerSacola(), body = $("#bag-body"), foot = $("#bag-foot");
    if (!s.length) {
      body.innerHTML = '<div class="bag-empty">' + I.bag + "<p>Sua sacola está vazia.</p><p style=\"font-size:14px;margin-top:6px\">Adicione os modelos que você quer e envie o pedido de uma vez pelo WhatsApp.</p></div>";
      foot.innerHTML = '<a class="btn btn--dark btn--block" href="catalogo.html">Ver catálogo</a>';
      return;
    }
    body.innerHTML = s.map(function (i) {
      var p = POR_ID[i.id];
      return '<div class="bag-item" data-id="' + p.id + '"><a href="produto.html?id=' + p.id + '"><img src="' + p.thumb() + '" alt=""></a><div>' +
        '<div class="bag-item__name">' + esc(p.nome) + '</div><div class="bag-item__meta">' + ESTACOES[p.estacao].nome + "</div>" +
        (i.obs ? '<div class="bag-item__note">“' + esc(i.obs) + "”</div>" : "") +
        '<div class="stepper"><button data-q="-1" aria-label="Diminuir">−</button><input type="number" min="1" value="' + i.q + '" aria-label="Quantidade"><button data-q="1" aria-label="Aumentar">+</button></div></div>' +
        '<button class="bag-remove" data-rm>Remover</button></div>';
    }).join("");
    var total = s.reduce(function (t, i) { return t + i.q; }, 0);
    foot.innerHTML = '<div style="display:flex;justify-content:space-between;font-size:13px;letter-spacing:.14em;text-transform:uppercase"><span>' + plural(s.length, "modelo", "modelos") + "</span><span>" + plural(total, "peça", "peças") + "</span></div>" +
      '<a class="btn btn--wpp btn--block" id="bag-send" href="#" target="_blank" rel="noopener">' + I.wpp.replace("<svg", '<svg fill="currentColor"') + " Enviar pedido no WhatsApp</a>" +
      "<small>Tamanhos, cores e valores são confirmados no atendimento. " + esc(C.pedidoMinimo || "") + ".</small>";
    $("#bag-send").href = urlWpp(mensagemPedido(s));
    $$(".bag-item", body).forEach(function (row) {
      var id = row.getAttribute("data-id"), inp = $("input", row);
      function set(v) { var ss = lerSacola(); ss.forEach(function (i) { if (i.id === id) i.q = Math.max(1, v); }); salvarSacola(ss); renderSacola(); }
      $$("[data-q]", row).forEach(function (b) { b.onclick = function () { set((parseInt(inp.value, 10) || 1) + parseInt(b.getAttribute("data-q"), 10)); }; });
      inp.onchange = function () { set(parseInt(inp.value, 10) || 1); };
      $("[data-rm]", row).onclick = function () { salvarSacola(lerSacola().filter(function (i) { return i.id !== id; })); renderSacola(); };
    });
  }
  function mensagemPedido(s) {
    var linhas = ["Olá! Vim pelo catálogo da Bella Rô e gostaria de fazer um pedido:", ""];
    var total = 0;
    s.forEach(function (i) {
      var p = POR_ID[i.id]; total += i.q;
      linhas.push("• " + p.nome + " (" + ESTACOES[p.estacao].nome + ") — " + plural(i.q, "peça", "peças") + (i.obs ? " — " + i.obs : ""));
      var l = linkProduto(p); if (l) linhas.push("  " + l);
    });
    linhas.push("", "Total: " + plural(total, "peça", "peças"), "Pode me passar tamanhos, cores disponíveis e valores?");
    return linhas.join("\n");
  }

  /* ---------------- card de produto ---------------- */
  function card(p, eager) {
    var alt = p.fotos.length > 1 ? '<img class="alt" src="' + p.thumb(1) + '" alt="" loading="lazy">' : "";
    return '<article class="card reveal"><a class="card__media" href="produto.html?id=' + p.id + '" aria-label="' + esc(p.nome) + '">' +
      '<img src="' + p.thumb() + '" alt="' + esc(p.nome) + " — coleção " + ESTACOES[p.estacao].nome + '" loading="' + (eager ? "eager" : "lazy") + '">' + alt +
      (ehNovo(p) ? '<span class="card__tag">Novo</span>' : "") +
      (p.fotos.length > 1 ? '<span class="card__count">' + p.fotos.length + " fotos</span>" : "") +
      '</a><button class="card__quick" data-add="' + p.id + '">Adicionar à sacola</button>' +
      '<div class="card__info"><a class="card__name" href="produto.html?id=' + p.id + '">' + esc(p.nome) + '</a><span class="card__meta">' + (p.categoria ? CATEGORIAS[p.categoria] + " · " : "") + ESTACOES[p.estacao].nome + "</span>" +
      '<button class="card__cta" data-add="' + p.id + '">+ Adicionar à sacola</button></div></article>';
  }
  document.addEventListener("click", function (ev) {
    var b = ev.target.closest("[data-add]");
    if (b) { ev.preventDefault(); adicionar(b.getAttribute("data-add"), 1); }
  });

  /* reveal on scroll */
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
  }, { rootMargin: "0px 0px -40px 0px" }) : null;
  function observar(root) { $$(".reveal:not(.is-in)", root).forEach(function (el) { io ? io.observe(el) : el.classList.add("is-in"); }); }

  /* ---------------- páginas ---------------- */
  function primeiro(est) { return PRODUTOS.filter(function (p) { return p.estacao === est; }); }
  function daCategoria(c) { return PRODUTOS.filter(function (p) { return p.categoria === c; }); }

  function paginaHome() {
    // hero: 3 slides com 3 fotos cada, das peças mais recentes
    var heroPool = PRODUTOS.slice(0, 30);
    var slides = [heroPool.slice(0, 3), heroPool.slice(3, 6), heroPool.slice(6, 9)].filter(function (s) { return s.length === 3; });
    var hs = $("#hero-slides"), dots = $("#hero-dots");
    hs.innerHTML = slides.map(function (s, i) {
      return '<div class="hero__slide' + (i === 0 ? " is-active" : "") + '">' + s.map(function (p, j) { return '<img src="' + p.foto() + '" alt="" ' + (i === 0 ? (j === 0 ? 'fetchpriority="high"' : "") : 'loading="lazy"') + ">"; }).join("") + "</div>";
    }).join("");
    dots.innerHTML = slides.map(function (_, i) { return '<button aria-label="Slide ' + (i + 1) + '"' + (i === 0 ? ' class="is-active"' : "") + "></button>"; }).join("");
    var cur = 0, timer;
    function go(n) {
      var ss = $$(".hero__slide", hs), ds = $$("button", dots);
      ss[cur].classList.remove("is-active"); ds[cur].classList.remove("is-active");
      cur = (n + ss.length) % ss.length;
      ss[cur].classList.add("is-active"); ds[cur].classList.add("is-active");
    }
    function auto() { clearInterval(timer); timer = setInterval(function () { go(cur + 1); }, 5500); }
    $$("button", dots).forEach(function (d, i) { d.onclick = function () { go(i); auto(); }; });
    if (slides.length > 1 && !matchMedia("(prefers-reduced-motion: reduce)").matches) auto();

    $("#novidades").innerHTML = PRODUTOS.slice(0, 8).map(function (p) { return card(p); }).join("");

    var capasCat = C.capasCategorias || {};
    $("#categorias").innerHTML = ["vestidos", "conjuntos", "blusas", "tricos", "calcas", "saias"].map(function (c) {
      var lista = daCategoria(c), capa = POR_ID[capasCat[c]] || lista[0];
      if (!capa) return "";
      return '<a class="season season--cat reveal" href="' + linkCat(c) + '"><img src="' + capa.thumb() + '" alt="" loading="lazy">' +
        '<span class="season__txt"><span class="season__name">' + CATEGORIAS[c] + '</span><span class="season__n">' + plural(lista.length, "modelo", "modelos") + "</span></span></a>";
    }).join("");

    $("#estacoes").innerHTML = ORDEM_ESTACOES.map(function (e) {
      var lista = primeiro(e), capa = (C.capas && POR_ID[C.capas[e]]) || lista[0];
      if (!capa) return "";
      return '<a class="season reveal" href="catalogo.html?estacao=' + e + '"><img src="' + capa.thumb() + '" alt="" loading="lazy">' +
        '<span class="season__txt"><span class="season__name">' + ESTACOES[e].nome + '</span><span class="season__n">' + plural(lista.length, "modelo", "modelos") + "</span></span></a>";
    }).join("");

    var destaque = PRODUTOS.slice(8, 12);
    $("#mais").innerHTML = destaque.map(function (p) { return card(p); }).join("");

    var man = PRODUTOS[12] || PRODUTOS[0];
    if (man) $("#manifesto-img").src = man.foto();

    $$("[data-pedido-minimo]").forEach(function (el) { el.textContent = C.pedidoMinimo || ""; });
    $$("[data-pagamento]").forEach(function (el) { el.textContent = C.pagamento || ""; });
    $$("[data-envio]").forEach(function (el) { el.textContent = C.envio || ""; });
    $$("[data-wpp-link]").forEach(function (el) { el.href = urlWpp(el.getAttribute("data-wpp-link")); });
  }

  function paginaCatalogo() {
    var est = qs("estacao"), cat = qs("categoria");
    if (est && !ESTACOES[est]) est = null;
    if (cat && !CATEGORIAS[cat]) cat = null;
    var ordem = qs("ordem") || "recentes";
    var POR_PAG = 24, mostrando = POR_PAG;

    var chips = $("#chips"), selEst = $("#estacao"), sel = $("#ordem");
    selEst.innerHTML = '<option value="">Todas as coleções</option>' + ORDEM_ESTACOES.map(function (e) { return '<option value="' + e + '">' + ESTACOES[e].nome + "</option>"; }).join("");
    selEst.value = est || ""; sel.value = ordem;

    function base() { return est ? primeiro(est) : PRODUTOS.slice(); }
    function lista() {
      var l = base();
      if (cat) l = l.filter(function (p) { return p.categoria === cat; });
      if (ordem === "antigas") l = l.slice().reverse();
      return l;
    }
    function renderChips() {
      var b = base(), cont = {};
      b.forEach(function (p) { cont[p.categoria] = (cont[p.categoria] || 0) + 1; });
      chips.innerHTML = '<button class="chip" data-cat="" aria-pressed="' + (!cat) + '">Tudo <span>' + b.length + "</span></button>" +
        ORDEM_CATEGORIAS.filter(function (c) { return cont[c] || c === cat; }).map(function (c) {
          return '<button class="chip" data-cat="' + c + '" aria-pressed="' + (c === cat) + '">' + CATEGORIAS[c] + " <span>" + (cont[c] || 0) + "</span></button>";
        }).join("");
      var ativo = $('.chip[aria-pressed="true"]', chips);
      if (ativo && ativo.scrollIntoView && cat) chips.scrollLeft = ativo.offsetLeft - 16;
    }
    function render(resetar) {
      if (resetar) mostrando = POR_PAG;
      var l = lista();
      var titulo = cat ? CATEGORIAS[cat] : (est ? "Coleção " + ESTACOES[est].nome : "Todos os modelos");
      if (cat && est) titulo = CATEGORIAS[cat] + " · " + ESTACOES[est].nome;
      $("#cat-titulo").textContent = titulo;
      $("#cat-crumb").textContent = titulo;
      document.title = titulo + " | Atacado Bella Rô";
      renderChips();
      $("#cat-count").textContent = plural(l.length, "modelo", "modelos");
      var g = $("#grid");
      g.innerHTML = l.length ? l.slice(0, mostrando).map(function (p, i) { return card(p, i < 4); }).join("") : "";
      $("#empty").hidden = !!l.length;
      $("#more").hidden = mostrando >= l.length;
      $("#more-info").textContent = "Mostrando " + Math.min(mostrando, l.length) + " de " + l.length;
      observar(g);
    }
    function atualizarURL() {
      var u = new URL(location.href);
      cat ? u.searchParams.set("categoria", cat) : u.searchParams.delete("categoria");
      est ? u.searchParams.set("estacao", est) : u.searchParams.delete("estacao");
      ordem !== "recentes" ? u.searchParams.set("ordem", ordem) : u.searchParams.delete("ordem");
      try { history.replaceState(null, "", u.toString()); } catch (e) {}
      var ativo = navAtivo();
      $$(".nav > ul > li > a").forEach(function (a, i) {
        if (NAV[i] && NAV[i].key === ativo) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
      });
    }
    chips.onclick = function (ev) {
      var c = ev.target.closest(".chip"); if (!c) return;
      cat = c.getAttribute("data-cat") || null; atualizarURL(); render(true);
    };
    selEst.onchange = function () { est = selEst.value || null; atualizarURL(); render(true); };
    sel.onchange = function () { ordem = sel.value; atualizarURL(); render(true); };
    $("#more-btn").onclick = function () { mostrando += POR_PAG; render(false); };
    render(true);
  }

  var lbFotos = [], lbI = 0;
  function abrirLightbox(fotos, i) {
    lbFotos = fotos; lbI = i;
    var lb = $("#lightbox"); $("img", lb).src = fotos[i]; lb.classList.add("is-open");
    document.documentElement.style.overflow = "hidden";
  }
  function fecharLightbox() {
    var lb = $("#lightbox"); if (!lb || !lb.classList.contains("is-open")) return;
    lb.classList.remove("is-open"); document.documentElement.style.overflow = "";
  }

  function paginaProduto() {
    var p = POR_ID[qs("id")];
    var alvo = $("#pdp");
    if (!p) {
      alvo.innerHTML = '<div class="empty" style="grid-column:1/-1"><p class="h2">Modelo não encontrado</p><p style="margin:14px 0 26px">Esse modelo pode ter saído do catálogo.</p><a class="btn btn--dark" href="catalogo.html">Ver catálogo</a></div>';
      return;
    }
    document.title = p.nome + " | Atacado Bella Rô";
    var nomeEst = ESTACOES[p.estacao].nome;
    $("#pdp-crumb").innerHTML = '<a href="index.html">Início</a> / ' + (p.categoria ? '<a href="' + linkCat(p.categoria) + '">' + CATEGORIAS[p.categoria] + "</a> / " : "") + esc(p.nome);
    var fotosL = p.fotos.map(function (_, i) { return p.foto(i); });
    var multi = p.fotos.length > 1;
    alvo.innerHTML =
      '<div class="gallery">' +
      (multi ? '<div class="gallery__thumbs">' + p.fotos.map(function (_, i) { return '<button data-i="' + i + '"' + (i === 0 ? ' aria-current="true"' : "") + ' aria-label="Foto ' + (i + 1) + '"><img src="' + p.thumb(i) + '" alt=""></button>'; }).join("") + "</div>" : "<div></div>") +
      '<div class="gallery__wrap"><div class="gallery__main" id="gmain">' + fotosL.map(function (f, i) { return '<img src="' + f + '" alt="' + esc(p.nome) + " — foto " + (i + 1) + '" data-i="' + i + '"' + (i ? ' loading="lazy"' : "") + ">"; }).join("") + "</div>" +
      (multi ? '<button class="gallery__nav gallery__nav--prev" aria-label="Foto anterior">' + I.arrowL + '</button><button class="gallery__nav gallery__nav--next" aria-label="Próxima foto">' + I.arrowR + "</button>" : "") +
      (multi ? '<div class="gallery__dots">' + p.fotos.map(function (_, i) { return "<span" + (i === 0 ? ' class="on"' : "") + "></span>"; }).join("") + "</div>" : "") +
      "</div></div>" +
      '<div class="pdp__info"><p class="pdp__ref">Ref. ' + p.ref + (p.categoria ? " · " + CATEGORIAS[p.categoria] : "") + " · " + nomeEst + "</p>" +
      '<h1 class="pdp__title">' + esc(p.nome) + "</h1>" +
      '<div class="pdp__price"><strong>Preço exclusivo de atacado</strong><span>Valores, tamanhos e cores disponíveis são enviados no atendimento pelo WhatsApp.</span></div>' +
      '<div class="qty"><label for="q">Quantidade de peças</label><div class="stepper"><button type="button" data-q="-1" aria-label="Diminuir">−</button><input id="q" type="number" min="1" value="1"><button type="button" data-q="1" aria-label="Aumentar">+</button></div></div>' +
      '<div class="field"><label class="sr-only" for="obs">Observação</label><textarea id="obs" placeholder="Observação (opcional): cores, tamanhos ou grade desejada"></textarea></div>' +
      '<div class="pdp__btns"><button class="btn btn--dark btn--block" id="add">Adicionar à sacola</button>' +
      '<a class="btn btn--wpp btn--block" id="wpp" href="#" target="_blank" rel="noopener">' + I.wpp.replace("<svg", '<svg fill="currentColor"') + " Consultar este modelo</a></div>" +
      '<div class="pdp__details"><details open><summary>Como funciona</summary><p>Monte sua sacola com os modelos que você quer e envie tudo de uma vez pelo WhatsApp. Nossa equipe responde com a grade, as cores disponíveis, os valores de atacado e o prazo de envio.</p></details>' +
      "<details><summary>Condições de atacado</summary><ul><li>" + esc(C.pedidoMinimo || "") + "</li><li>Pagamento: " + esc(C.pagamento || "") + "</li><li>" + esc(C.envio || "") + "</li></ul></details>" +
      "<details><summary>Sobre as fotos</summary><p>As cores podem variar levemente conforme a tela. Peças sujeitas à disponibilidade de estoque.</p></details></div></div>";

    var q = $("#q"), obs = $("#obs");
    $$("[data-q]", alvo).forEach(function (b) { b.onclick = function () { q.value = Math.max(1, (parseInt(q.value, 10) || 1) + parseInt(b.getAttribute("data-q"), 10)); }; });
    $("#add").onclick = function () { adicionar(p.id, q.value, obs.value.trim()); abrir("bag"); };
    function atualizaWpp() {
      var n = Math.max(1, parseInt(q.value, 10) || 1);
      var msg = "Olá! Tenho interesse no modelo " + p.nome + " (coleção " + nomeEst + ") — " + plural(n, "peça", "peças") + "." + (obs.value.trim() ? "\nObs.: " + obs.value.trim() : "") + (linkProduto(p) ? "\n" + linkProduto(p) : "") + "\nPode me passar tamanhos, cores e valor de atacado?";
      $("#wpp").href = urlWpp(msg);
    }
    q.oninput = obs.oninput = atualizaWpp; $$("[data-q]", alvo).forEach(function (b) { b.addEventListener("click", atualizaWpp); }); atualizaWpp();

    // galeria
    var main = $("#gmain");
    function irPara(i) { main.scrollTo({ left: i * main.clientWidth, behavior: "smooth" }); }
    function atual() { return Math.round(main.scrollLeft / main.clientWidth); }
    main.addEventListener("scroll", function () {
      var i = atual();
      $$(".gallery__thumbs button", alvo).forEach(function (b, j) { b.setAttribute("aria-current", String(i === j)); });
      $$(".gallery__dots span", alvo).forEach(function (d, j) { d.classList.toggle("on", i === j); });
    }, { passive: true });
    $$(".gallery__thumbs button", alvo).forEach(function (b) { b.onclick = function () { irPara(+b.getAttribute("data-i")); }; });
    var prev = $(".gallery__nav--prev", alvo), next = $(".gallery__nav--next", alvo);
    if (prev) prev.onclick = function () { irPara(Math.max(0, atual() - 1)); };
    if (next) next.onclick = function () { irPara(Math.min(p.fotos.length - 1, atual() + 1)); };
    $$("img", main).forEach(function (im) { im.onclick = function () { abrirLightbox(fotosL, +im.getAttribute("data-i")); }; });
    var lb = $("#lightbox");
    lb.onclick = function (ev) {
      if (ev.target.closest("[data-lb-close]") || ev.target === lb) { fecharLightbox(); return; }
      if (ev.target.tagName === "IMG" && lbFotos.length > 1) { lbI = (lbI + 1) % lbFotos.length; $("img", lb).src = lbFotos[lbI]; }
    };

    // relacionados
    var rel = (p.categoria ? daCategoria(p.categoria) : primeiro(p.estacao)).filter(function (x) { return x.id !== p.id; });
    var idx = PRODUTOS.indexOf(p);
    rel.sort(function (a, b) { return Math.abs(PRODUTOS.indexOf(a) - idx) - Math.abs(PRODUTOS.indexOf(b) - idx); });
    $("#rel-titulo").textContent = p.categoria ? "Mais " + CATEGORIAS[p.categoria].toLowerCase() : "Mais da coleção " + nomeEst;
    $("#rel-link").href = p.categoria ? linkCat(p.categoria) : linkEst(p.estacao);
    $("#relacionados").innerHTML = rel.slice(0, 4).map(function (x) { return card(x); }).join("");
  }

  function paginaComprar() {
    $$("[data-pedido-minimo]").forEach(function (el) { el.textContent = C.pedidoMinimo || ""; });
    $$("[data-pagamento]").forEach(function (el) { el.textContent = C.pagamento || ""; });
    $$("[data-envio]").forEach(function (el) { el.textContent = C.envio || ""; });
    $$("[data-horario]").forEach(function (el) { el.textContent = C.horario || ""; });
    $$("[data-wpp-link]").forEach(function (el) { el.href = urlWpp(el.getAttribute("data-wpp-link")); });
  }

  /* ---------------- iniciar ---------------- */
  renderChrome();
  if (PAGE === "home") paginaHome();
  if (PAGE === "catalogo") paginaCatalogo();
  if (PAGE === "produto") paginaProduto();
  if (PAGE === "comprar") paginaComprar();
  atualizarContador();
  observar(document);
  window.addEventListener("storage", atualizarContador);
})();

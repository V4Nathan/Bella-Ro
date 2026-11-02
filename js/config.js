/*
 * CONFIGURAÇÕES DO SITE — edite aqui.
 * Tudo que estiver com "PREENCHER" ainda precisa ser confirmado.
 */
window.BELLA_CONFIG = {
  marca: "Atacado Bella Rô",

  // WhatsApp com DDI + DDD + número, só dígitos. Ex.: "5511999998888"
  // Enquanto estiver vazio, os botões abrem o WhatsApp para a pessoa escolher o contato.
  whatsapp: "",
  whatsappExibicao: "(00) 00000-0000", // PREENCHER: como o número aparece no rodapé

  instagram: "", // PREENCHER: usuário sem @, ex.: "atacadobellaro"
  email: "",     // PREENCHER (opcional)
  endereco: "",  // PREENCHER (opcional): endereço da loja/showroom
  horario: "Segunda a sexta, 9h às 18h · Sábado, 9h às 13h", // PREENCHER: confirmar

  // Regras do atacado (aparecem na home, no produto e na página "Como comprar")
  pedidoMinimo: "Consulte o pedido mínimo", // PREENCHER: ex.: "Pedido mínimo de 10 peças"
  pagamento: "Pix, cartão e boleto",        // PREENCHER: confirmar formas de pagamento
  envio: "Enviamos para todo o Brasil",

  // Mensagens de aviso que passam na barra preta do topo
  avisos: [
    "Vendas exclusivas para atacado",
    "Enviamos para todo o Brasil",
    "Novidades toda semana",
    "Atendimento pelo WhatsApp"
  ],

  // Foto de capa de cada coleção na home (id do post = código no nome do arquivo).
  // Deixe vazio para usar o modelo mais recente da coleção.
  capas: { primavera: "", verao: "DUTeb8eEWNr", outono: "", inverno: "" },

  // Foto de capa das categorias na home (mesmo formato). Vazio = modelo mais recente.
  capasCategorias: { tricos: "DY7mhNjqi89" },

  // Grade padrão por categoria (usada quando o modelo não tem tamanhos em categorias.csv)
  gradePadrao: {
    _: ["P", "M", "G", "GG"],
    calcas: ["36", "38", "40", "42", "44", "46"],
    praia: ["Único"]
  },

  // Tabela de medidas de referência, em cm. Letras: [busto, cintura, quadril]. Números: [cintura, quadril].
  // PREENCHER/CONFIRMAR com as medidas reais da marca.
  tabelaMedidas: {
    P: ["86–90", "66–70", "94–98"],
    M: ["90–94", "70–74", "98–102"],
    G: ["94–100", "74–80", "102–108"],
    GG: ["100–106", "80–86", "108–114"],
    "36": ["66–68", "92–94"], "38": ["68–72", "94–98"], "40": ["72–76", "98–102"],
    "42": ["76–80", "102–106"], "44": ["80–84", "106–110"], "46": ["84–88", "110–114"]
  },

  // Banner de evento na página inicial (editável no painel, em Configurações).
  // Aparece só com ativo = true e até a data de "ate" (AAAA-MM-DD). Para testar: /?banner=1
  banner: {
    ativo: true,
    selo: "Especial Outubro Rosa",
    titulo: "Showroom",
    data: "Dia 15 de outubro",
    horario: "Das 13h às 20h",
    local: "Atacado Bella Rô",
    endereco: "Avenida Rocha Pombo, 1461 · Maringá",
    texto: "Uma tarde para conhecer de perto as novidades da Bella Rô e das marcas parceiras.",
    botao: "Confirmar presença",
    ate: "2026-10-15",
    imagem: "assets/eventos/showroom-foto.webp",
    marcas: [
      "assets/eventos/marca-1.webp", "assets/eventos/marca-2.webp", "assets/eventos/marca-3.webp",
      "assets/eventos/marca-4.webp", "assets/eventos/marca-5.webp", "assets/eventos/marca-6.webp"
    ]
  },

  // Quantos dias uma peça fica marcada como "Novo"
  diasNovidade: 45
};

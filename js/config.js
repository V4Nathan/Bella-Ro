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

  // Quantos dias uma peça fica marcada como "Novo"
  diasNovidade: 45
};

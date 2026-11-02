# Site / Catálogo digital — Atacado Bella Rô

Site estático (HTML, CSS e JavaScript puro). Não precisa de servidor nem de banco de dados.

## Como abrir
Dê dois cliques em `index.html`. Para testar como no ar, rode nesta pasta:
`python3 -m http.server` e abra http://localhost:8000

## Páginas
- `index.html` — home: banner, novidades, coleções por estação, destaques, como comprar
- `catalogo.html` — todos os modelos, com filtro por estação (`?estacao=verao`)
- `produto.html?id=...` — página do modelo com galeria, quantidade e observação
- `como-comprar.html` — passo a passo, condições e dúvidas frequentes

## Como o pedido funciona
A cliente adiciona modelos à **sacola** e clica em **Enviar pedido no WhatsApp**.
O site monta a mensagem com as referências (ex.: PR045), as quantidades e o link de cada modelo.
Preços não aparecem no site: são passados no atendimento.

## Categorias
Cada modelo tem uma categoria (vestidos, conjuntos, blusas, tricos, calcas, saias,
macacoes, moletons, masculino, praia) e um nome curto (ex.: "Vestido", "Blazer"),
definidos em `categorias.csv`. O mesmo arquivo tem as colunas `tamanhos` (ex.: `P|M|G|GG`)
e `cores` (ex.: `Preto|Off-white`), que aparecem na página do produto. As cores foram
preenchidas olhando as fotos; confira e ajuste. A tabela de medidas fica em `js/config.js`. Dá para abrir no Excel/Numbers, corrigir e rodar
`python3 gerar-catalogo.py` de novo. Modelos novos entram no fim do arquivo com a categoria em branco.

## O que editar
Tudo fica em `js/config.js`: número do WhatsApp, Instagram, e-mail, endereço,
horário, pedido mínimo, formas de pagamento, frases da barra do topo e capas das coleções.

## Atualizar as fotos
1. Coloque as fotos novas nas pastas `verao`, `outono`, `inverno` ou `primavera`
   (uma pasta acima de `site`), mantendo o padrão de nome `AAAA-MM-DD_codigo_01.jpg`.
   Fotos com o mesmo código viram um único modelo com várias fotos.
2. Rode `python3 gerar-catalogo.py` dentro da pasta `site`
   (precisa do ImageMagick: `brew install imagemagick`).

As referências são numeradas por data dentro de cada estação (PR001, VE001, OU001, IN001).

## Publicar
Qualquer hospedagem de site estático serve. O jeito mais rápido:
arraste a pasta `site` em https://app.netlify.com/drop. Também funciona em Vercel ou GitHub Pages.

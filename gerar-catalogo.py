#!/usr/bin/env python3
"""
Atualiza o catálogo a partir das pastas de fotos (verao, outono, inverno, primavera)
que ficam UMA pasta acima deste site.

O que faz:
  1. Converte as fotos novas para WebP otimizado (site/img/<estacao>/s e /l)
     usando o ImageMagick ("convert"), se estiver instalado.
  2. Agrupa as fotos por post (mesmo código no nome do arquivo = mesmo modelo)
     e gera js/produtos.js com as referências (PR001, VE001, OU001, IN001...).

Uso:  python3 gerar-catalogo.py
Nomes de arquivo esperados: AAAA-MM-DD_<codigo>_<NN>.jpg
"""
import csv, json, os, re, shutil, subprocess, sys
from concurrent.futures import ThreadPoolExecutor

SITE = os.path.dirname(os.path.abspath(__file__))
FOTOS = os.path.dirname(SITE)
PREFIXOS = {"primavera": "PR", "verao": "VE", "outono": "OU", "inverno": "IN"}
PADRAO = re.compile(r"^(\d{4}-\d\d-\d\d)_(.+)_(\d+)$")


def converter(origem, destino, tamanho, qualidade):
    if os.path.exists(destino):
        return
    subprocess.run(["convert", origem, "-auto-orient", "-strip", "-resize", tamanho,
                    "-quality", str(qualidade), destino], check=True)


def main():
    tem_convert = shutil.which("convert") is not None
    tarefas = []
    for est in PREFIXOS:
        pasta = os.path.join(FOTOS, est)
        if not os.path.isdir(pasta):
            continue
        os.makedirs(os.path.join(SITE, "img", est, "s"), exist_ok=True)
        os.makedirs(os.path.join(SITE, "img", est, "l"), exist_ok=True)
        for f in os.listdir(pasta):
            if f.lower().endswith((".jpg", ".jpeg", ".png")):
                base = os.path.splitext(f)[0]
                src = os.path.join(pasta, f)
                tarefas.append((src, os.path.join(SITE, "img", est, "l", base + ".webp"), "1100x1100>", 74))
                tarefas.append((src, os.path.join(SITE, "img", est, "s", base + ".webp"), "520x", 70))
    pendentes = [t for t in tarefas if not os.path.exists(t[1])]
    if pendentes:
        if not tem_convert:
            sys.exit("Há %d fotos novas para converter, mas o ImageMagick não está instalado (brew install imagemagick)." % len(pendentes))
        print("Convertendo %d imagens..." % len(pendentes))
        with ThreadPoolExecutor(4) as ex:
            list(ex.map(lambda t: converter(*t), pendentes))

    # categorias.csv: id,ref,categoria,tipo,tamanhos,cores (listas separadas por |) (editável em Excel/Numbers)
    cats = {}
    caminho_cat = os.path.join(SITE, "categorias.csv")
    if os.path.exists(caminho_cat):
        with open(caminho_cat, encoding="utf-8") as fh:
            for row in csv.DictReader(fh):
                cats[row["id"]] = (row["categoria"].strip(), row["tipo"].strip(),
                                   [x.strip() for x in (row.get("tamanhos") or "").split("|") if x.strip()],
                                   [x.strip() for x in (row.get("cores") or "").split("|") if x.strip()])

    produtos = []
    sem_categoria = []
    for est, pre in PREFIXOS.items():
        pasta = os.path.join(SITE, "img", est, "s")
        if not os.path.isdir(pasta):
            continue
        posts = {}
        for f in sorted(os.listdir(pasta)):
            if not f.endswith(".webp"):
                continue
            m = PADRAO.match(f[:-5])
            if not m:
                print("Ignorando nome fora do padrão:", f)
                continue
            posts.setdefault((m.group(1), m.group(2)), []).append(f[:-5])
        for i, ((data, codigo), fotos) in enumerate(sorted(posts.items())):
            ref = "%s%03d" % (pre, i + 1)
            c, t, z, k = cats.get(codigo, ("", "", [], []))
            if codigo not in cats:
                sem_categoria.append((codigo, ref))
            item = {"id": codigo, "ref": ref, "e": est, "c": c, "t": t, "d": data, "f": sorted(fotos)}
            if z:
                item["z"] = z
            if k:
                item["k"] = k
            produtos.append(item)

    with open(os.path.join(SITE, "js", "produtos.js"), "w", encoding="utf-8") as fh:
        fh.write("/* GERADO AUTOMATICAMENTE por gerar-catalogo.py — não edite à mão */\n")
        fh.write("window.BELLA_PRODUTOS=" + json.dumps(produtos, ensure_ascii=False, separators=(",", ":")) + ";\n")
    if sem_categoria:
        with open(caminho_cat, "a", encoding="utf-8", newline="") as fh:
            w = csv.writer(fh)
            for codigo, ref in sem_categoria:
                w.writerow([codigo, ref, "", "", "", ""])
        print("%d modelos novos sem categoria: preencha a coluna 'categoria' em categorias.csv e rode de novo." % len(sem_categoria))
    print("Catálogo atualizado: %d modelos." % len(produtos))


if __name__ == "__main__":
    main()

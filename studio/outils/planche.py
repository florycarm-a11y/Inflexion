#!/usr/bin/env python3
"""Planche de contrôle : tous les WebP d'un dossier de rendu en une grille, avec le nom sous chaque vignette.
Usage : python3 studio/outils/planche.py studio/rendu/<dossier>   → <dossier>/planche.jpg
Pillow uniquement. Ne s'écrase jamais."""
import sys
from pathlib import Path
from PIL import Image, ImageDraw

COLONNES, LARGEUR_VIGNETTE, MARGE, LEGENDE = 4, 320, 16, 22
FOND, ENCRE = (237, 235, 228), (16, 18, 20)

def main():
    if len(sys.argv) != 2:
        sys.exit("Usage : planche.py <dossier de rendu>")
    dossier = Path(sys.argv[1])
    sortie = dossier / "planche.jpg"
    if sortie.exists():
        sys.exit(f"{sortie} existe déjà : une planche ne s'écrase jamais.")
    fichiers = sorted(dossier.glob("*.webp"))
    if not fichiers:
        sys.exit(f"Aucun WebP dans {dossier}")
    vignettes = []
    for f in fichiers:
        im = Image.open(f).convert("RGB")
        h = round(im.height * LARGEUR_VIGNETTE / im.width)
        vignettes.append((f.name, im.resize((LARGEUR_VIGNETTE, h), Image.LANCZOS)))
    hauteur_case = max(v.height for _, v in vignettes) + LEGENDE
    lignes = -(-len(vignettes) // COLONNES)
    planche = Image.new("RGB", (COLONNES * (LARGEUR_VIGNETTE + MARGE) + MARGE, lignes * (hauteur_case + MARGE) + MARGE), FOND)
    dessin = ImageDraw.Draw(planche)
    for i, (nom, v) in enumerate(vignettes):
        x = MARGE + (i % COLONNES) * (LARGEUR_VIGNETTE + MARGE)
        y = MARGE + (i // COLONNES) * (hauteur_case + MARGE)
        planche.paste(v, (x, y))
        dessin.text((x, y + v.height + 4), nom, fill=ENCRE)
    planche.save(sortie, quality=85)
    print(f"Planche : {sortie}")

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Lignes de TABLEAU d'un document SEC : ne coupe qu'aux fins de ligne de tableau."""
import sys, re, html
t = sys.stdin.read()
t = re.sub(r"<(script|style)[\s\S]*?</\1>", "", t)
t = re.sub(r"</tr>", "\n", t, flags=re.I)
t = re.sub(r"</t[dh]>", "\t", t, flags=re.I)
t = re.sub(r"<[^>]+>", "", t)
t = html.unescape(t)
motif = sys.argv[1] if len(sys.argv) > 1 else r"."
for l in t.split("\n"):
    l = re.sub(r"[^\S\t]+", " ", l)
    l = re.sub(r"\t+", "\t", re.sub(r"\s*\t\s*", "\t", l)).strip()
    if len(l) > 3 and re.search(motif, l, re.I):
        print(l[:230])

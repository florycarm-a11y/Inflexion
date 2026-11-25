#!/usr/bin/env python3
"""RTX : relevé des communiqués de résultats. Ne décide rien."""
import os, re, html, json, subprocess

# Identification auprès de la SEC : jamais d'adresse dans le dépôt, voir sonde.mjs.
UA = os.environ.get("SEC_USER_AGENT", "lecteur-depots/1.0")
CIK = "101829"

def curl(u):
    return subprocess.run(["curl", "-s", "-H", "User-Agent: " + UA, u], capture_output=True, text=True).stdout

def depots():
    r = json.loads(curl("https://data.sec.gov/submissions/CIK%s.json" % CIK.zfill(10)))["filings"]["recent"]
    out = [(r["filingDate"][i], r["accessionNumber"][i].replace("-", "")) for i in range(len(r["form"]))
           if r["form"][i] == "8-K" and "2.02" in (r["items"][i] or "") and r["filingDate"][i] >= "2024-01-01"]
    return sorted(out)

def communique(accn):
    j = json.loads(curl("https://www.sec.gov/Archives/edgar/data/%s/%s/index.json" % (CIK, accn)))
    c = [(i["name"], int(i.get("size") or 0)) for i in j["directory"]["item"]
         if i["name"].lower().endswith(".htm") and not re.match(r"R\d", i["name"])]
    return max(c, key=lambda t: t[1])[0]

def tableaux(h):
    t = re.sub(r"<(script|style)[\s\S]*?</\1>", "", h)
    t = re.sub(r"</tr>", "\n", t, flags=re.I)
    t = re.sub(r"</t[dh]>", "\t", t, flags=re.I)
    t = html.unescape(re.sub(r"<[^>]+>", "", t))
    return [re.sub(r"\t+", "\t", re.sub(r"\s*\t\s*", "\t", re.sub(r"[^\S\t]+", " ", l))).strip() for l in t.split("\n")]

def nombres(l):
    out = []
    for cell in l.split("\t")[1:]:
        c = cell.strip().replace(",", "").replace("$", "").strip()
        m = re.fullmatch(r"\(?(\d+(?:\.\d+)?)\)?", c)
        if m:
            out.append(-float(m.group(1)) if c.startswith("(") else float(m.group(1)))
    return out

def ligne(T, motif, drapeaux=0):
    for l in T:
        if re.match(motif, l, drapeaux):
            n = nombres(l)
            if len(n) >= 2:
                return [int(x) for x in n[:2]]
    return None

if __name__ == "__main__":
    for date, accn in depots():
        doc = communique(accn)
        h = curl("https://www.sec.gov/Archives/edgar/data/%s/%s/%s" % (CIK, accn, doc))
        T = tableaux(h)
        plat = re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", re.sub(r"<(script|style)[\s\S]*?</\1>", "", h))))
        print("%s %s/%s" % (date, accn, doc))
        print("   CA %s  coût %s  expl. %s" % (
            ligne(T, r"(Total net sales|Total Net Sales|Net sales)\t"), ligne(T, r"Cost of sales\t"),
            ligne(T, r"Operating profit( \(loss\))?\t")))
        m = re.search(r"backlog of \$([\d.]+) billion[^.•]{0,90}", plat)
        print("   carnet ·", m.group(0)[:150] if m else "—")
        for m in list(re.finditer(r"[Aa]djusted sales\*? ?of (?:approximately )?\$[\d.]+[^•]{0,70}", plat))[:2]:
            print("   prév.  ·", m.group(0)[:120])
        m = re.search(r"(?:Raises|Raising|Updates|Reaffirms|Confirms|Maintains|Lowers|Provides|Announces)[^.•]{0,110}(?:outlook|guidance)[^.•]{0,80}", plat)
        print("   titre  ·", m.group(0)[:190] if m else "—")

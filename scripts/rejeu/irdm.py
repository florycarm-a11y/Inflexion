#!/usr/bin/env python3
"""Iridium : relevé des douze communiqués de résultats. Ne décide rien."""
import os, re, html, json, subprocess

# Identification auprès de la SEC : jamais d'adresse dans le dépôt, voir sonde.mjs.
UA = os.environ.get("SEC_USER_AGENT", "lecteur-depots/1.0")
CIK = "1418819"
PUBS = [
    ("2024-02-15", "T4 2023", "000141881924000006"), ("2024-04-18", "T1 2024", "000141881924000022"),
    ("2024-07-23", "T2 2024", "000141881924000035"), ("2024-10-17", "T3 2024", "000162828024042982"),
    ("2025-02-13", "T4 2024", "000162828025005300"), ("2025-04-22", "T1 2025", "000162828025018711"),
    ("2025-07-24", "T2 2025", "000162828025035834"), ("2025-10-23", "T3 2025", "000141881925000008"),
    ("2026-02-12", "T4 2025", "000141881926000008"), ("2026-04-23", "T1 2026", "000141881926000027"),
    ("2026-07-22", "T2 2026", "000141881926000046"), ("2026-10-20", "T3 2026", "000141881926000053"),
]

def curl(u):
    return subprocess.run(["curl", "-s", "-H", "User-Agent: " + UA, u], capture_output=True, text=True).stdout

def communique(accn):
    j = json.loads(curl("https://www.sec.gov/Archives/edgar/data/%s/%s/index.json" % (CIK, accn)))
    c = [(i["name"], int(i.get("size") or 0)) for i in j["directory"]["item"]
         if i["name"].lower().endswith(".htm") and not re.match(r"R\d", i["name"])]
    return max(c, key=lambda t: t[1])[0]          # le plus volumineux = le communiqué

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

def ligne(T, motif):
    for l in T:
        if re.match(motif, l, re.I):
            n = nombres(l)
            if len(n) >= 2:
                return [int(x) for x in n[:2]]
    return None

if __name__ == "__main__":
    for date, trim, accn in PUBS:
        doc = communique(accn)
        h = curl("https://www.sec.gov/Archives/edgar/data/%s/%s/%s" % (CIK, accn, doc))
        T = tableaux(h)
        plat = re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", re.sub(r"<(script|style)[\s\S]*?</\1>", "", h))))
        print("%s %s %s" % (date, trim, doc))
        print("   service %s  total %s  coût serv. %s  coût équip. %s  expl. %s  abonnés %s" % (
            ligne(T, r"Total service revenue\t"), ligne(T, r"Total revenue\t"),
            ligne(T, r"Cost of services"), ligne(T, r"Cost of subscriber equipment"),
            ligne(T, r"Operating income( \(loss\))?\t"), ligne(T, r"Total billable subscribers\t")))
        vus = 0
        for m in re.finditer(r"[^.•]{0,140}service revenue (?:growth|to grow|is expected|of between)[^•]{0,200}", plat):
            print("   prév. ·", m.group(0).strip()[:300]); vus += 1
            if vus >= 2: break
        if not vus:
            print("   prév. · (aucune phrase de prévision de chiffre d'affaires de service)")

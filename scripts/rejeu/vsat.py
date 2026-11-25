#!/usr/bin/env python3
"""Viasat : relevé des douze communiqués (annexe la plus volumineuse du 8-K)."""
import os, re, html, json, subprocess

# Identification auprès de la SEC : jamais d'adresse dans le dépôt, voir sonde.mjs.
UA = os.environ.get("SEC_USER_AGENT", "inflexion-rejeu/1.0")
CIK = "797721"
PUBS = [
    ("2024-02-06", "T3 FY2024", "000119312524025304"),
    ("2024-05-21", "T4 FY2024", "000119312524143911"),
    ("2024-08-07", "T1 FY2025", "000119312524195897"),
    ("2024-11-06", "T2 FY2025", "000119312524252046"),
    ("2025-02-06", "T3 FY2025", "000119312525021810"),
    ("2025-05-20", "T4 FY2025", "000119312525123143"),
    ("2025-08-05", "T1 FY2026", "000119312525173528"),
    ("2025-11-07", "T2 FY2026", "000119312525272331"),
    ("2026-02-05", "T3 FY2026", "000119312526039528"),
    ("2026-05-28", "T4 FY2026", "000119312526245304"),
    ("2026-08-04", "T1 FY2027", "000119312526332896"),
    ("2026-11-05", "T2 FY2027", "000119312526449775"),
]

def curl(u):
    return subprocess.run(["curl", "-s", "-H", "User-Agent: " + UA, u], capture_output=True, text=True).stdout

def annexe(accn):
    j = json.loads(curl("https://www.sec.gov/Archives/edgar/data/%s/%s/index.json" % (CIK, accn)))
    ex = [(i["name"], int(i.get("size") or 0)) for i in j["directory"]["item"]
          if re.search(r"ex99", i["name"], re.I)]
    return max(ex, key=lambda t: t[1])[0]           # la plus volumineuse = le communiqué

def tableaux(h):
    t = re.sub(r"<(script|style)[\s\S]*?</\1>", "", h)
    t = re.sub(r"</tr>", "\n", t, flags=re.I)
    t = re.sub(r"</t[dh]>", "\t", t, flags=re.I)
    t = html.unescape(re.sub(r"<[^>]+>", "", t))
    return [re.sub(r"\t+", "\t", re.sub(r"\s*\t\s*", "\t", re.sub(r"[^\S\t]+", " ", l))).strip()
            for l in t.split("\n")]

def prose(h):
    t = re.sub(r"<(script|style)[\s\S]*?</\1>", "", h)
    for tag in ["div", "p", "tr", "li", "h1", "h2", "h3"]:
        t = re.sub(r"</%s>" % tag, "\n", t, flags=re.I)
    t = re.sub(r"<br\s*/?>", "\n", t, flags=re.I)
    t = html.unescape(re.sub(r"<[^>]+>", " ", t))
    return [re.sub(r"[^\S\t]+", " ", l).strip() for l in t.split("\n")]

def apres(L, motif, combien=2):
    """Les `combien` premiers nombres après la PREMIÈRE ligne égale au motif."""
    for i, l in enumerate(L):
        if not re.fullmatch(motif, l, re.I):
            continue
        out = []
        for x in L[i + 1:i + 14]:
            c = x.replace(",", "").replace("$", "").strip()
            if not c or re.fullmatch(r"[)(%—–-]+", c):
                continue      # cellules vides, ou ne portant qu'une parenthèse de signe
            m = re.fullmatch(r"\(?(\d+(?:\.\d+)?)\)?", c)
            if m:
                out.append(-float(m.group(1)) if c.startswith("(") else float(m.group(1)))
                if len(out) == combien:
                    return out
            elif out:
                break
    return None

for date, trim, accn in PUBS:
    h = curl("https://www.sec.gov/Archives/edgar/data/%s/%s/%s" % (CIK, accn, annexe(accn)))
    T, P = tableaux(h), prose(h)
    ca = apres(T, r"Total revenues")
    cs = apres(T, r"Cost of service revenues")
    cp = apres(T, r"Cost of product revenues")
    op = apres(T, r"Income \(loss\) from operations|Operating income \(loss\)")
    cout = [cs[k] + cp[k] for k in (0, 1)] if cs and cp else None
    # commandes du trimestre, en prose ; « $1.1 billion » ou « $756 million »
    cmd = None
    for l in P:
        m = (re.search(r"new contract awards[^.]{0,120}?\$([\d.,]+)\s*(billion|million)", l, re.I)
             or re.search(r"\$([\d.,]+)\s*(billion|million) (?:of|in) awards during the quarter", l, re.I)
             or re.search(r"[Aa]wards for the quarter were \$([\d.,]+)\s*(billion|million)", l, re.I)
             or re.search(r"reported \$([\d.,]+)\s*(billion|million) (?:of|in) awards", l, re.I))
        if m:
            v = float(m.group(1).replace(",", ""))
            cmd = v * 1000 if m.group(2).lower() == "billion" else v
            break
    print("%s %s  CA %-22s coût %-22s expl. %-20s commandes %s" % (
        date, trim.ljust(10), str(ca), str(cout), str(op), cmd or "—"))

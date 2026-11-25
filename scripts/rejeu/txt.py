import sys,re,html
t=sys.stdin.read()
t=re.sub(r"<(script|style)[\s\S]*?</\1>","",t)
for tag in ["div","p","tr","li","h1","h2","h3","span"]:
    t=re.sub(r"</%s>"%tag,"\n",t,flags=re.I)
t=re.sub(r"</t[dh]>","\t",t,flags=re.I)
t=re.sub(r"<br\s*/?>","\n",t,flags=re.I)
t=re.sub(r"<[^>]+>","",t)
t=html.unescape(t)
motif=sys.argv[1] if len(sys.argv)>1 else r"."
for l in t.split("\n"):
    l=re.sub(r"[^\S\t]+"," ",re.sub(r"\s*\t\s*","\t",l)).strip()
    if len(l)>3 and re.search(motif,l,re.I): print(l[:260])

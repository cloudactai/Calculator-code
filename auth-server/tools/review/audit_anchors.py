"""Direction aids for the page-by-page review -- NOT a gate.

Every hit here is a page to open. Every *miss* here is still a page to open:
the defects that cost the other provinces most -- a whole income table with no
boxes, a bind naming the wrong column, a background glyph rendered as an Apple
logo -- are invisible to all three of these. They exist to point the eye, and
the review is what the eye does next.

Printed anchors -- underscore runs and option squares --
with no field on them, across all six of PEI's square
vocabularies.

Char-level underscore runs and tick glyphs in a shipped background, and
which of them a shipped field actually covers.
"""
import json, sys, os, fitz
EXPORT = "/Users/lorelaiphinnemore/Documents/CloudAct/Frontend /Calculator-code/auth-server/form-template-export"

TICKS = "☐☑☒"  # five symbol vocabularies: Times, Wingdings, OpenSymbol

def runs_on(page, minlen=3):
    out=[]
    for b in page.get_text("rawdict")["blocks"]:
        for l in b.get("lines",[]):
            for s in l["spans"]:
                cur=[]
                for c in s["chars"]:
                    if c["c"]=="_":
                        cur.append(c)
                    else:
                        if len(cur)>=minlen: out.append(cur)
                        cur=[]
                if len(cur)>=minlen: out.append(cur)
    res=[]
    for cur in out:
        x0=min(c["bbox"][0] for c in cur); x1=max(c["bbox"][2] for c in cur)
        y0=min(c["bbox"][1] for c in cur); y1=max(c["bbox"][3] for c in cur)
        res.append((x0,y0,x1,y1,len(cur)))
    return res

def ticks_on(page):
    res=[]
    for b in page.get_text("rawdict")["blocks"]:
        for l in b.get("lines",[]):
            for s in l["spans"]:
                for c in s["chars"]:
                    if c["c"] in TICKS:
                        res.append(tuple(c["bbox"])+(c["c"],))
    return res

def audit(doc_id, pages=None):
    fields=json.load(open(os.path.join(EXPORT,doc_id+".json")))["staticFields"]
    doc=fitz.open(os.path.join(EXPORT,doc_id+".pdf"))
    miss=0
    for n in range(1,doc.page_count+1):
        if pages and n not in pages: continue
        page=doc[n-1]
        fs=[f for f in fields if f["page"]==n]
        rects=[fitz.Rect(f["x"],f["y"],f["x"]+f["width"]/1.5,f["y"]+f["height"]/1.5) for f in fs]
        for (x0,y0,x1,y1,ln) in runs_on(page):
            r=fitz.Rect(x0,y0,x1,y1)
            cov=[i for i,rr in enumerate(rects) if (rr & r).get_area() > 0.35*r.get_area()]
            if not cov:
                print("%s p%d  UNCOVERED underscore run  x=%.1f-%.1f y=%.1f len=%d" % (doc_id,n,x0,x1,y0,ln))
                miss+=1
        for t in ticks_on(page):
            r=fitz.Rect(t[:4])
            cov=[i for i,rr in enumerate(rects) if (rr & r).get_area() > 0.3*r.get_area()]
            if not cov:
                print("%s p%d  UNCOVERED tick %r x=%.1f y=%.1f" % (doc_id,n,t[4],t[0],t[1]))
                miss+=1
    return miss

if __name__=="__main__":
    ids=sys.argv[1:]
    total=0
    for d in ids: total+=audit(d)
    print("total uncovered:", total)

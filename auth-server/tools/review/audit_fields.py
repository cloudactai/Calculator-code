"""Direction aids for the page-by-page review -- NOT a gate.

Every hit here is a page to open. Every *miss* here is still a page to open:
the defects that cost the other provinces most -- a whole income table with no
boxes, a bind naming the wrong column, a background glyph rendered as an Apple
logo -- are invisible to all three of these. They exist to point the eye, and
the review is what the eye does next.

Field-side suspects: a box off the sheet, on top of
printed text, or overlapping another box.

Direction aids for the page-by-page read: field-side suspects.

Not a gate. Every hit here is a page to open, and every miss here is still a
page to open -- the defects that cost the other provinces most (a whole income
table with no boxes, a bind naming the wrong column) are invisible to this.
"""
import json, os, sys, fitz
EXPORT = "/Users/lorelaiphinnemore/Documents/CloudAct/Frontend /Calculator-code/auth-server/form-template-export"

def rect(f):
    return fitz.Rect(f["x"], f["y"], f["x"]+f["width"]/1.5, f["y"]+f["height"]/1.5)

def audit(doc_id):
    fields=json.load(open(os.path.join(EXPORT,doc_id+".json")))["staticFields"]
    doc=fitz.open(os.path.join(EXPORT,doc_id+".pdf"))
    hits=[]
    for n in range(1,doc.page_count+1):
        page=doc[n-1]; W,H=page.rect.width,page.rect.height
        fs=[f for f in fields if f["page"]==n]
        # printed glyphs that are not underscores and not tick squares
        glyphs=[]
        for b in page.get_text("rawdict")["blocks"]:
            for l in b.get("lines",[]):
                for s in l["spans"]:
                    for c in s["chars"]:
                        if c["c"].strip() and c["c"] not in "_☐☑☒":
                            glyphs.append(fitz.Rect(c["bbox"]))
        for i,f in enumerate(fs,1):
            r=rect(f)
            if r.x0<-0.5 or r.y0<-0.5 or r.x1>W+0.5 or r.y1>H+0.5:
                hits.append("%s p%d f%d OFF-SHEET %s" % (doc_id,n,i,r))
            if r.width<=1 or r.height<=1:
                hits.append("%s p%d f%d DEGENERATE %s" % (doc_id,n,i,r))
            # text buried under the box (ignore 1pt grazes at the edges)
            inner=fitz.Rect(r.x0+1.5,r.y0+2.5,r.x1-1.5,r.y1-2.5)
            covered=[g for g in glyphs if (g & inner).get_area() > 0.55*g.get_area()]
            if len(covered)>=2:
                txt="".join(page.get_textbox(fitz.Rect(g)) for g in covered[:14])
                hits.append("%s p%d f%d COVERS-TEXT %r  box=%s" % (doc_id,n,i,txt[:40],[round(v,1) for v in r]))
            for j,g in enumerate(fs,1):
                if j<=i: continue
                o=(r & rect(g))
                if o.get_area() > 0.20*min(r.get_area(), rect(g).get_area()):
                    hits.append("%s p%d f%d/f%d OVERLAP %.0f%%" % (doc_id,n,i,j,
                        100*o.get_area()/min(r.get_area(),rect(g).get_area())))
    return hits

if __name__=="__main__":
    out=[]
    for d in sys.argv[1:]: out+=audit(d)
    for h in out: print(h)
    print("total:", len(out))

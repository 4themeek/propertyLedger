/* Lease -> .docx exporter (no dependencies).
   buildLeaseDocx(rootElement) walks the rendered lease document and returns a Blob
   containing a real Word (.docx) file: headings, justified paragraphs, the rent
   schedule as a native Word table, signature lines, page breaks, page-number footer. */
export function buildLeaseDocx(root: HTMLElement): Blob {
  type Piece = { t: string; bold: boolean };
  type ParaOpts = { jc?: string; size?: number; color?: string; bold?: boolean; caps?: boolean; border?: boolean; keepNext?: boolean; pageBreak?: boolean; before?: number; after?: number; allowEmpty?: boolean; ind?: number; hang?: number };
  var enc = new TextEncoder();
  var W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main";
  var R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";

  function xesc(s: string): string {
    return String(s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function norm(s: string): string { return s.replace(/[\s ]+/g, " "); }

  function runXml(text: string, o: { bold?: boolean; caps?: boolean; color?: string; size?: number }): string {
    var rp = "";
    if (o.bold) rp += "<w:b/>";
    if (o.caps) rp += "<w:caps/>";
    if (o.color) rp += '<w:color w:val="' + o.color + '"/>';
    if (o.size) rp += '<w:sz w:val="' + o.size + '"/><w:szCs w:val="' + o.size + '"/>';
    return "<w:r>" + (rp ? "<w:rPr>" + rp + "</w:rPr>" : "") +
      '<w:t xml:space="preserve">' + xesc(text) + "</w:t></w:r>";
  }

  // Collect inline pieces [{t, bold}] from a node's children.
  function collect(node: { childNodes: ArrayLike<Node> }, bold: boolean, out: Piece[]): void {
    for (var i = 0; i < node.childNodes.length; i++) {
      var c = node.childNodes[i] as Node;
      if (c.nodeType === 3) { out.push({ t: norm(c.nodeValue || ""), bold: bold }); }
      else if (c.nodeType === 1) {
        var el = c as HTMLElement;
        var tag = el.tagName.toLowerCase();
        if (tag === "h4") { var sub: Piece[] = []; collect(el, true, sub); sub.forEach(function (x) { out.push(x); }); out.push({ t: " ", bold: false }); }
        else if (tag === "strong" || tag === "b") collect(el, true, out);
        else if (tag === "br") out.push({ t: " ", bold: bold });
        else collect(el, bold, out);
      }
    }
  }
  function cleanPieces(pcs: Piece[]): Piece[] {
    var res: Piece[] = [];
    pcs.forEach(function (p) {
      var t = p.t;
      if (!t) return;
      var prev = res.length ? res[res.length - 1] : null;
      if (prev && /\s$/.test(prev.t) && /^\s/.test(t)) t = t.replace(/^\s+/, "");
      if (!prev) t = t.replace(/^\s+/, "");
      if (t) res.push({ t: t, bold: p.bold });
    });
    if (res.length) res[res.length - 1].t = res[res.length - 1].t.replace(/\s+$/, "");
    return res.filter(function (r) { return r.t; });
  }

  function paraXml(pieces: Piece[], o: ParaOpts): string {
    var pcs = cleanPieces(pieces);
    if (!pcs.length && !o.allowEmpty) return "";
    var ppr = "";
    if (o.keepNext) ppr += "<w:keepNext/>";
    if (o.pageBreak) ppr += "<w:pageBreakBefore/>";
    if (o.border) ppr += '<w:pBdr><w:bottom w:val="single" w:sz="6" w:space="2" w:color="C7BB9E"/></w:pBdr>';
    ppr += '<w:spacing w:before="' + (o.before || 0) + '" w:after="' + (o.after == null ? 160 : o.after) + '"/>';
    ppr += '<w:jc w:val="' + (o.jc || "both") + '"/>';
    if (o.ind) ppr = ppr.replace('<w:jc', '<w:ind w:left="' + o.ind + '" w:hanging="' + (o.hang || 0) + '"/><w:jc');
    var runs = pcs.map(function (p) {
      return runXml(p.t, { bold: p.bold || o.bold, caps: o.caps, color: o.color, size: o.size });
    }).join("");
    return "<w:p><w:pPr>" + ppr + "</w:pPr>" + runs + "</w:p>";
  }

  var body: string[] = [];
  var buf: Node[] = []; // loose inline nodes (text/h4 that a browser parser spilled out of a <p>)

  function flush() {
    if (!buf.length) return;
    var pcs: Piece[] = [];
    buf.forEach(function (n) {
      var holder = { childNodes: [n] as ArrayLike<Node> };
      collect(holder, false, pcs);
    });
    buf = [];
    var x = paraXml(pcs, { jc: "both", after: 160, size: 22 });
    if (x) body.push(x);
  }

  function tableXml(tbl: HTMLTableElement): string {
    var rows: HTMLTableRowElement[] = Array.prototype.slice.call(tbl.rows);
    var cols = 0;
    rows.forEach(function (r) {
      var n = 0;
      Array.prototype.forEach.call(r.cells, function (c: HTMLTableCellElement) { n += c.colSpan || 1; });
      if (n > cols) cols = n;
    });
    var total = 9360, widths: number[] = [];
    if (cols === 7) widths = [1000, 900, 1000, 1400, 1700, 1700, 1660];
    else for (var i = 0; i < cols; i++) widths.push(Math.floor(total / cols));
    var cap = tbl.querySelector("caption");
    var x = "";
    if (cap) x += paraXml([{ t: norm(cap.textContent || ""), bold: true }], { jc: "left", size: 18, after: 80, keepNext: true, before: 120 });
    x += '<w:tbl><w:tblPr><w:tblW w:w="' + total + '" w:type="dxa"/><w:tblBorders>' +
      ["top", "left", "bottom", "right", "insideH", "insideV"].map(function (s) {
        return '<w:' + s + ' w:val="single" w:sz="4" w:space="0" w:color="C7BB9E"/>';
      }).join("") +
      '</w:tblBorders><w:tblLayout w:type="fixed"/><w:tblCellMar><w:left w:w="70" w:type="dxa"/><w:right w:w="70" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>' +
      widths.map(function (w) { return '<w:gridCol w:w="' + w + '"/>'; }).join("") + "</w:tblGrid>";
    rows.forEach(function (r) {
      var isTotals = r.classList.contains("totalsrow");
      x += "<w:tr><w:trPr><w:cantSplit/></w:trPr>";
      var colIdx = 0;
      Array.prototype.forEach.call(r.cells, function (c: HTMLTableCellElement, ci: number) {
        var span = c.colSpan || 1, w = 0;
        for (var k = 0; k < span; k++) w += widths[colIdx + k] || 0;
        colIdx += span;
        var isTh = c.tagName.toLowerCase() === "th";
        var fill = (isTh || isTotals) ? '<w:shd w:val="clear" w:color="auto" w:fill="EFE8D9"/>' : "";
        var jc = isTh ? "center" : (ci === 0 ? "left" : "right");
        var txt = norm(c.textContent || "").trim();
        var p = paraXml(txt ? [{ t: txt, bold: isTh || isTotals }] : [], { jc: jc, size: 17, before: 40, after: 40, allowEmpty: true });
        var stEl = c.querySelector(".strike, .faint");
        if (stEl) {
          // credited rent: main text, then the normal amount struck through and lighter underneath
          var stTxt = norm(stEl.textContent || "").trim();
          var mainTxt = norm((c.textContent || "").replace(stEl.textContent || "", "")).trim();
          p = '<w:p><w:pPr><w:spacing w:before="40" w:after="40"/><w:jc w:val="' + jc + '"/></w:pPr>' +
            runXml(mainTxt, { size: 17 }) + "<w:r><w:br/></w:r>" +
            '<w:r><w:rPr>' + (stEl.classList.contains("strike") ? "<w:strike/>" : "") + '<w:color w:val="8A8472"/><w:sz w:val="16"/><w:szCs w:val="16"/></w:rPr><w:t xml:space="preserve">' + xesc(stTxt) + "</w:t></w:r></w:p>";
        }
        x += '<w:tc><w:tcPr><w:tcW w:w="' + w + '" w:type="dxa"/>' + (span > 1 ? '<w:gridSpan w:val="' + span + '"/>' : "") + fill + "</w:tcPr>" + p + "</w:tc>";
      });
      x += "</w:tr>";
    });
    return x + "</w:tbl>" + '<w:p><w:pPr><w:spacing w:before="0" w:after="120"/></w:pPr></w:p>';
  }

  function walk(el: Node): void {
    for (var i = 0; i < el.childNodes.length; i++) {
      var n = el.childNodes[i];
      if (n.nodeType === 3) { buf.push(n); continue; }
      if (n.nodeType !== 1) continue;
      var node = n as HTMLElement;
      var tag = node.tagName.toLowerCase(), cls = node.classList;
      if (tag === "h4") { buf.push(n); continue; }
      if (tag === "strong" || tag === "b" || tag === "span") { buf.push(n); continue; }
      flush();
      if (tag === "h2") {
        body.push(paraXml([{ t: norm(node.textContent || ""), bold: true }], { jc: "center", size: 32, after: 60 }));
      } else if (tag === "h3") {
        body.push(paraXml([{ t: norm(node.textContent || ""), bold: true }], {
          jc: "center", size: 22, caps: true, border: true, keepNext: true,
          before: 360, after: 140, pageBreak: cls.contains("pagebreak")
        }));
      } else if (tag === "p") {
        if (!(node.textContent || "").trim()) continue;
        var pcs: Piece[] = []; collect(node, false, pcs);
        if (cls.contains("bldgtitle")) body.push(paraXml(pcs, { jc: "center", size: 19, bold: true, after: 60 }));
        else if (cls.contains("docsub")) body.push(paraXml(pcs, { jc: "center", size: 20, color: "5C564A", after: 320 }));
        else if (cls.contains("small")) body.push(paraXml(pcs, { jc: "both", size: 18, color: "5C564A", after: 120 }));
        else if (cls.contains("center")) body.push(paraXml(pcs, { jc: "center", size: 22, after: 160 }));
        else if (cls.contains("item2")) body.push(paraXml(pcs, { jc: "both", size: 22, after: 100, ind: 1440, hang: 360 }));
        else if (cls.contains("item")) body.push(paraXml(pcs, { jc: "both", size: 22, after: 100, ind: 1080, hang: 360 }));
        else body.push(paraXml(pcs, { jc: "both", size: 22, after: 160 }));
      } else if (tag === "table") {
        body.push(tableXml(node as HTMLTableElement));
      } else if (cls.contains("sigline")) {
        body.push('<w:p><w:pPr><w:keepNext/><w:spacing w:before="520" w:after="0"/></w:pPr>' +
          runXml("______________________________________", { size: 22 }) + "</w:p>");
      } else if (cls.contains("sig")) {
        walk(node); flush();
      } else {
        walk(node);
      }
    }
  }
  walk(root); flush();

  var sect = '<w:sectPr><w:footerReference w:type="default" r:id="rId1"/><w:pgSz w:w="12240" w:h="15840"/>' +
    '<w:pgMar w:top="1080" w:right="1080" w:bottom="1080" w:left="1080" w:header="540" w:footer="540" w:gutter="0"/></w:sectPr>';
  var documentXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="' + W + '" xmlns:r="' + R + '"><w:body>' + body.join("") + sect + "</w:body></w:document>";
  var stylesXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="' + W + '"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman" w:eastAsia="Times New Roman"/><w:sz w:val="22"/><w:szCs w:val="22"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="160" w:line="264" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:qFormat/></w:style></w:styles>';
  var footerXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:ftr xmlns:w="' + W + '" xmlns:r="' + R + '"><w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:rPr><w:sz w:val="18"/></w:rPr><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:rPr><w:sz w:val="18"/></w:rPr><w:instrText xml:space="preserve"> PAGE </w:instrText></w:r><w:r><w:rPr><w:sz w:val="18"/></w:rPr><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:rPr><w:sz w:val="18"/></w:rPr><w:t>1</w:t></w:r><w:r><w:rPr><w:sz w:val="18"/></w:rPr><w:fldChar w:fldCharType="end"/></w:r><w:r><w:rPr><w:sz w:val="18"/></w:rPr><w:t xml:space="preserve"> of </w:t></w:r><w:r><w:rPr><w:sz w:val="18"/></w:rPr><w:fldChar w:fldCharType="begin"/></w:r><w:r><w:rPr><w:sz w:val="18"/></w:rPr><w:instrText xml:space="preserve"> NUMPAGES </w:instrText></w:r><w:r><w:rPr><w:sz w:val="18"/></w:rPr><w:fldChar w:fldCharType="separate"/></w:r><w:r><w:rPr><w:sz w:val="18"/></w:rPr><w:t>20</w:t></w:r><w:r><w:rPr><w:sz w:val="18"/></w:rPr><w:fldChar w:fldCharType="end"/></w:r></w:p></w:ftr>';
  var contentTypes = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/></Types>';
  var rootRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>';
  var docRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/footer" Target="footer1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>';

  // ---- minimal ZIP writer (stored, no compression) ----
  var crcTable: Uint32Array | null = null;
  function crc32(u8: Uint8Array): number {
    if (!crcTable) {
      crcTable = new Uint32Array(256);
      for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1); crcTable[n] = c >>> 0; }
    }
    var crc = 0xFFFFFFFF;
    for (var i = 0; i < u8.length; i++) crc = crcTable[(crc ^ u8[i]) & 0xFF] ^ (crc >>> 8);
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }
  var files: { name: string; data: Uint8Array }[] = [
    { name: "[Content_Types].xml", data: enc.encode(contentTypes) },
    { name: "_rels/.rels", data: enc.encode(rootRels) },
    { name: "word/document.xml", data: enc.encode(documentXml) },
    { name: "word/styles.xml", data: enc.encode(stylesXml) },
    { name: "word/footer1.xml", data: enc.encode(footerXml) },
    { name: "word/_rels/document.xml.rels", data: enc.encode(docRels) }
  ];
  var parts: Uint8Array[] = [], central: Uint8Array[] = [], offset = 0, now = new Date();
  var dtime = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
  var ddate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
  files.forEach(function (f) {
    var nm = enc.encode(f.name), crc = crc32(f.data), len = f.data.length;
    var lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true);
    lh.setUint16(8, 0, true); lh.setUint16(10, dtime, true); lh.setUint16(12, ddate, true);
    lh.setUint32(14, crc, true); lh.setUint32(18, len, true); lh.setUint32(22, len, true);
    lh.setUint16(26, nm.length, true); lh.setUint16(28, 0, true);
    parts.push(new Uint8Array(lh.buffer), nm, f.data);
    var ch = new DataView(new ArrayBuffer(46));
    ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true);
    ch.setUint16(10, 0, true); ch.setUint16(12, dtime, true); ch.setUint16(14, ddate, true);
    ch.setUint32(16, crc, true); ch.setUint32(20, len, true); ch.setUint32(24, len, true);
    ch.setUint16(28, nm.length, true); ch.setUint32(42, offset, true);
    central.push(new Uint8Array(ch.buffer), nm);
    offset += 30 + nm.length + len;
  });
  var cdSize = 0; central.forEach(function (c) { cdSize += c.length; });
  var end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true);
  end.setUint32(12, cdSize, true); end.setUint32(16, offset, true);
  return new Blob(parts.concat(central, [new Uint8Array(end.buffer)]) as BlobPart[],
    { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
}

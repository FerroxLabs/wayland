/**
 * Stylesheet for the morning brief.
 *
 * Ported from tools/brief_css.py (tvcontrol skills/market-open-report).
 *
 * Design system from ui-ux-pro-max: Dark Mode (OLED), Real-Time / Operations
 * pattern, high contrast, minimal glow, visible focus. Two deliberate departures
 * from what it recommended, both taken on purpose:
 *
 *   INTER IS NOT USED. The generator suggested it and it is the safe default that
 *   every AI-built dashboard reaches for. A system font stack costs nothing, loads
 *   instantly, and does not announce which tool made the page.
 *
 *   THE PALETTE IS THE PRODUCT'S OWN, not the generic fintech blue. Amber #F2B544,
 *   teal #00C9A7, rose #FF4D6D and violet #7A6FF0 are the exact colours the Pine
 *   script paints on the chart, so the brief and the chart look like one product
 *   rather than two. Bull and bear match the chart the reader just came from.
 *
 * Colour never carries meaning alone: every direction has a sign or a label
 * beside it, every gauge prints its number, and the ladder uses filled versus
 * outline squares rather than hue.
 *
 * THE BYTES ARE THE CONTRACT. This is the Python CSS constant character for
 * character, including the leading and trailing newlines inside the triple
 * quotes, because brief_html.py concatenates it straight into the document and
 * the two files must produce identical output. The template literal below holds
 * no interpolation and the source contains no backtick, no ${ and no backslash,
 * so what is written here is exactly what is emitted.
 */

export const CSS = `
<style>
:root{
  --bg:#08080C; --panel:#111119; --panel2:#171722; --ink:#F2F0EA; --dim:#8B8598;
  --dim2:#615C70; --rule:#22212E;
  --gold:#F2B544; --bull:#00C9A7; --bear:#FF4D6D; --band:#7A6FF0;
  --grid:rgba(255,255,255,.05);
  --sans:ui-sans-serif,-apple-system,'Segoe UI',Roboto,'Helvetica Neue',sans-serif;
  --mono:ui-monospace,'SF Mono',SFMono-Regular,Menlo,Consolas,monospace;
  --serif:ui-serif,Georgia,'Iowan Old Style',serif;
  --r:14px; --r2:10px;
}
@media (prefers-color-scheme:light){
  :root{--bg:#FAF8F3;--panel:#FFFFFF;--panel2:#F3F0E9;--ink:#14131A;--dim:#635E70;
        --dim2:#8B8598;--rule:#E5E0D5;--gold:#9A6B04;--bull:#046B5A;--bear:#BE2440;
        --band:#4F42CC;--grid:rgba(0,0,0,.06);}
}
:root[data-theme="light"]{--bg:#FAF8F3;--panel:#FFFFFF;--panel2:#F3F0E9;--ink:#14131A;
  --dim:#635E70;--dim2:#8B8598;--rule:#E5E0D5;--gold:#9A6B04;--bull:#046B5A;
  --bear:#BE2440;--band:#4F42CC;--grid:rgba(0,0,0,.06);}
:root[data-theme="dark"]{--bg:#08080C;--panel:#111119;--panel2:#171722;--ink:#F2F0EA;
  --dim:#8B8598;--dim2:#615C70;--rule:#22212E;--gold:#F2B544;--bull:#00C9A7;
  --bear:#FF4D6D;--band:#7A6FF0;--grid:rgba(255,255,255,.05);}

*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--sans);
     font-size:16px;line-height:1.5;font-variant-numeric:tabular-nums;
     -webkit-font-smoothing:antialiased;}
.page{max-width:1180px;margin:0 auto;padding:32px 20px 96px}
svg{display:block}
.num{font-family:var(--mono);font-variant-numeric:tabular-nums}
.pos{color:var(--bull)} .neg{color:var(--bear)}

/* ---------- masthead ---------- */
.top{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;
     flex-wrap:wrap;border-bottom:1px solid var(--rule);padding-bottom:18px;
     margin-bottom:26px}
.brandline{display:flex;align-items:center;gap:10px}
.mark{width:26px;height:26px;flex:none}
.brand{font-size:12px;font-weight:800;letter-spacing:.22em;text-transform:uppercase;
       color:var(--gold);margin:0}
h1{font-size:clamp(30px,5.2vw,50px);font-weight:800;letter-spacing:-.035em;
   line-height:1.02;margin:10px 0 0;text-wrap:balance}
h1 .thin{color:var(--dim);font-weight:400}
.stampset{display:flex;gap:22px;flex-wrap:wrap}
.stamp .k{font-size:10px;font-weight:800;letter-spacing:.15em;text-transform:uppercase;
          color:var(--dim2);margin-bottom:3px}
.stamp .v{font-family:var(--mono);font-size:14px;font-weight:600}

/* ---------- hero: gauge + summary ---------- */
.press{background:var(--panel);border:1px solid var(--rule);
       border-radius:var(--r);padding:18px 20px 16px;margin-bottom:14px}
.chips{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));
       gap:10px;margin-top:16px}
.chip{background:var(--panel2);border-radius:var(--r2);padding:11px 13px}
.chipk{font-size:10px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;
       color:var(--dim);display:inline-block}
.chipv{font-family:var(--mono);font-size:20px;font-weight:800;float:right;
       line-height:1;margin-top:-2px}
.chiptrack{clear:both;height:4px;border-radius:2px;background:var(--rule);
           margin:8px 0 7px;overflow:hidden}
.chiptrack i{display:block;height:100%;border-radius:2px}
.chipl{font-size:11px;color:var(--dim2);line-height:1.4}
.presssub{font-size:12.5px;color:var(--dim);line-height:1.6;margin:15px 0 0;
          max-width:88ch}
.presssub b{color:var(--ink)}
.lede{background:var(--panel);border:1px solid var(--rule);
      border-radius:var(--r);padding:20px 22px;margin-bottom:8px}
.ledestats{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));
           gap:12px;border-top:1px solid var(--rule);padding-top:15px}
.ls b{display:block;font-family:var(--mono);font-size:24px;font-weight:800;
      line-height:1;letter-spacing:-.02em}
.ls span{display:block;font-size:11px;color:var(--dim);margin-top:5px;
         line-height:1.35}
.card{background:var(--panel);border:1px solid var(--rule);border-radius:var(--r);
      padding:18px 20px}
.gaugeband{font-size:13px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;
           margin-top:8px}
.gaugesub{font-size:11.5px;color:var(--dim);margin-top:6px;line-height:1.45}
.comp{margin-top:16px;width:100%;display:grid;gap:9px}
.comprow{display:grid;grid-template-columns:74px 1fr 34px;gap:9px;align-items:center}
.compk{font-size:11px;font-weight:700;color:var(--dim);text-align:left}
.comptrack{height:6px;border-radius:3px;background:var(--panel2);overflow:hidden}
.comptrack i{display:block;height:100%;border-radius:3px;background:var(--band)}
.compv{font-family:var(--mono);font-size:11.5px;color:var(--dim);text-align:right}
.complabels{margin-top:12px;font-size:11.5px;color:var(--dim);line-height:1.6}
/* SANS, not serif. The serif read as an essay sitting on top of an instrument
   panel, which is exactly the mismatch Sean called out. */
.summary{font-size:19px;line-height:1.55;margin:0 0 18px;text-wrap:pretty;
         font-weight:450;letter-spacing:-.01em;max-width:none}
.summary b{color:var(--gold);font-weight:600}

/* ---------- market grid ---------- */
/* FOUR ACROSS, FIXED. auto-fit put eight instruments in a row of seven and
   left one orphan sitting alone on the second line. */
.mkt{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
@media (max-width:820px){.mkt{grid-template-columns:repeat(2,minmax(0,1fr))}}
.mcell{background:var(--panel);border:1px solid var(--rule);border-radius:var(--r2);
       padding:12px 13px 10px}
.mrow{display:flex;justify-content:space-between;align-items:baseline;gap:8px}
.mn{font-size:10.5px;font-weight:800;letter-spacing:.11em;text-transform:uppercase;
    color:var(--dim)}
.mc{font-family:var(--mono);font-size:12.5px;font-weight:700}
.mv{font-family:var(--mono);font-size:19px;font-weight:700;margin:4px 0 2px;
    letter-spacing:-.02em}
.ms{font-size:10.5px;color:var(--dim2);line-height:1.4}
.spark{margin-top:7px}

/* ---------- section ---------- */
h2.sec{font-size:11.5px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;
       color:var(--dim);margin:34px 0 13px;display:flex;align-items:center;gap:9px}
h2.sec::after{content:'';flex:1;height:1px;background:var(--rule)}
.grid2{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px}

/* ---------- capacity ---------- */
.cells{display:flex;flex-wrap:wrap;gap:4px;margin:12px 0 0}
.cell{width:15px;height:24px;border-radius:3px;background:var(--gold)}
.cell.over{background:transparent;border:1px solid var(--rule)}
.note{font-size:12.5px;color:var(--dim);line-height:1.6;margin:13px 0 0;max-width:74ch}
.note b{color:var(--ink)}

/* ---------- worked example ---------- */
.trade{background:linear-gradient(180deg,var(--panel) 0%,var(--panel2) 100%);
       border:1px solid var(--rule);border-radius:var(--r);overflow:hidden}
.tradehead{display:flex;justify-content:space-between;align-items:center;gap:14px;
           padding:15px 20px;border-bottom:1px solid var(--rule);flex-wrap:wrap}
.tradesym{font-family:var(--mono);font-size:22px;font-weight:800;letter-spacing:-.02em}
.pill{font-size:10.5px;font-weight:800;letter-spacing:.13em;text-transform:uppercase;
      padding:5px 11px;border-radius:99px;background:var(--bull);color:#08080C}
.pill.demo{background:var(--band);color:#fff}
.tradebody{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:0}
.tradeleft{padding:18px 20px}
.traderight{padding:18px 20px;border-left:1px solid var(--rule)}
.kv{display:grid;grid-template-columns:1fr auto;gap:5px 12px;font-size:13.5px}
.kv dt{color:var(--dim)}
.kv dd{margin:0;font-family:var(--mono);font-weight:600;text-align:right}
.ladderrow{display:flex;align-items:center;gap:10px;margin-top:6px}
.step{flex:1;text-align:center;padding:8px 4px;border-radius:8px;
      border:1px solid var(--rule);background:var(--panel)}
.step .p{font-family:var(--mono);font-size:13px;font-weight:700}
.step .q{font-size:10px;color:var(--dim);margin-top:2px}
.step.done{background:color-mix(in srgb,var(--gold) 20%,transparent);
           border-color:var(--gold)}
.runner{text-align:center;padding:8px 10px;border-radius:8px;
        border:1px dashed var(--band);color:var(--band);min-width:74px}
.runner .p{font-family:var(--mono);font-size:13px;font-weight:700}
.runner .q{font-size:10px;margin-top:2px}

/* ---------- tables ---------- */
.tw{border:1px solid var(--rule);border-radius:var(--r);overflow:hidden;
    background:var(--panel)}
.scroll{overflow-x:auto;max-height:640px;overflow-y:auto}
table{border-collapse:collapse;width:100%;font-size:13.5px}
thead th{position:sticky;top:0;background:var(--panel2);z-index:2;
  font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;
  color:var(--dim);padding:11px 13px;text-align:left;white-space:nowrap;
  border-bottom:1px solid var(--rule)}
td{padding:9px 13px;border-bottom:1px solid var(--rule);white-space:nowrap}
tbody tr:last-child td{border-bottom:0}
tbody tr:hover{background:var(--panel2)}
td.sym{font-family:var(--mono);font-weight:700}
td.r{font-family:var(--mono);text-align:right}
.rungs{display:inline-flex;gap:3px}
.rung{width:16px;height:16px;border-radius:3px;border:1px solid var(--rule);
      font-size:9px;line-height:14px;text-align:center;font-family:var(--mono);
      color:var(--dim2)}
.rung.on{background:var(--gold);border-color:var(--gold);color:#08080C;font-weight:800}
.cutrow td{background:color-mix(in srgb,var(--gold) 10%,transparent);
  font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--gold);
  font-weight:800;padding:8px 13px;white-space:normal}

/* ---------- cards / book ---------- */
.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(215px,1fr));gap:9px}
.mini{background:var(--panel);border:1px solid var(--rule);border-left:3px solid var(--band);
      border-radius:var(--r2);padding:12px 14px}
.mini.bull{border-left-color:var(--bull)} .mini.bear{border-left-color:var(--bear)}
.mini.gold{border-left-color:var(--gold)}
.mini .t{font-family:var(--mono);font-size:13.5px;font-weight:700}
.mini .m{font-size:11.5px;color:var(--dim);margin-top:3px;line-height:1.45}
.mini .p{font-family:var(--mono);font-size:12.5px;margin-top:5px}
.empty{font-size:13.5px;color:var(--dim);background:var(--panel);
       border:1px dashed var(--rule);border-radius:var(--r);padding:18px 20px;
       line-height:1.65;max-width:78ch}
.empty code{font-family:var(--mono);font-size:12px;background:var(--panel2);
            padding:2px 6px;border-radius:4px;color:var(--gold)}

.foot{margin:40px 0 0;padding-top:18px;border-top:1px solid var(--rule);
      font-size:12.5px;color:var(--dim);line-height:1.7;max-width:80ch}
.foot b{color:var(--ink)}
figcaption{font-size:11.5px;color:var(--dim2);margin-top:8px;line-height:1.5}

@media (max-width:900px){
  .tradebody{grid-template-columns:1fr}
  .traderight{border-left:0;border-top:1px solid var(--rule)} }
@media (max-width:640px){
  .page{padding:20px 14px 72px} body{font-size:15px}
  .summary{font-size:16.5px} .cell{width:13px;height:20px}
  td,thead th{padding:8px 10px} .mv{font-size:16px}
}
@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
a:focus-visible,button:focus-visible{outline:2px solid var(--gold);outline-offset:2px}
</style>
`;

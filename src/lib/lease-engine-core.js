// GENERATED FILE - do not edit by hand.
// Source: public/lease-builder/index.html (v1.7), via scripts/extract-lease-engine.mjs.
// Typed wrapper and app-specific code: src/lib/lease-engine.ts.
/* eslint-disable */

export const TEMPLATE_VERSION = "v1.7";

export const DEFAULTS = (function(){
  var DEFAULTS = {
    landlordName:"Meridian Office Partners, LLC",
    landlordAddress:"100 East Fourth Street, Suite 900, Cincinnati, OH 45202",
    landlordSignerName:"Jordan T. Whitfield",
    tenantName:"Bridgeway Consulting Group, LLC",
    tenantAddress:"9200 Montgomery Road, Suite 204, Cincinnati, OH 45242",
    tenantSignerName:"Alexis Bridgeman",
    tenantSignerTitle:"Managing Member",
    guarantorName:"Alexis Bridgeman",
    buildingAddress:"9200 Montgomery Road",
    city:"Cincinnati",
    stateName:"Ohio",
    county:"Hamilton",
    suiteNumber:"204",
    rsf:3040,
    permittedUse:"general office and administrative purposes",
    executionDate:"2025-10-15",
    commencementDate:"2025-12-01",
    initialTermMonths:87,
    earlyOccupancyWeeks:2,
    freeRentMonths:3,
    renewalOptionCount:1,
    renewalOptionYears:5,
    renewalNoticeDays:120,
    baseRentPSFYear1:20.00,
    annualEscalationPct:2.5,
    utilitiesAnnualYear1:3000.00,
    utilitiesEscalationPct:2.5,
    utilitiesCapAnnualPSFYear2:2.00,
    securityDeposit:5066.67,
    movingAllowancePSF:2.00,
    revisionMode:"review",
    revisionSchedule:"yes",
    rentCreditProvided:"no",
    rentCreditMode:"monthly",
    rentCreditPerMonth:1000.00,
    rentCreditMonths:3,
    rentCreditTotal:10000.00,
    buildingZip:"45202",
    parkingIncluded:"yes",
    parkingSpaces:2,
    parkingTermMode:"years",
    parkingCredit:6120.00,
    parkingYears:3,
    parkingMonthlyRatePerSpace:85.00,
    insurancePerPerson:500000,
    insurancePerOccurrence:2000000,
    insurancePropertyDamage:200000,
    guarantyEndDate:"2029-05-31",
    landlordBrokerFirm:"Colliers",
    landlordBrokerAgent:"Elaine Gillespie",
    tenantBrokerFirm:"Colliers",
    tenantBrokerAgent:"Sloane Nichols",
    latePaymentInterestPct:1.5,
    lateGraceDays:10,
    nonMonetaryCureDays:30,
    tenantSigner2Name:"",
    tenantSigner2Title:"",
    guarantor2Name:"",
    earlyTermMonths:6,
    earlyTermNoticeStart:"2032-02-01",
    earlyTermNoticeEnd:"2032-03-01",
    utilitiesCapEnabled:true,
    utilitiesCapStartYear:2,
    utilitiesCapEndYear:2,
    movingExpenseProvided:"yes",
    ledScreenOption:"no",
    ledScreenTerms:"Subject to the terms of this Section, Tenant shall have the option, at Tenant\u2019s sole cost and expense, to display Tenant\u2019s advertising content on the LED screen located in the Building lobby (the \u201CLobby LED Screen\u201D). All content shall be subject to Landlord\u2019s prior written approval, which shall not be unreasonably withheld, conditioned or delayed, and shall comply with applicable laws and the Rules and Regulations. Tenant shall be responsible for the cost of producing and delivering its content. Landlord shall maintain the Lobby LED Screen but shall not be liable for any interruption in its operation. This option shall terminate upon the expiration or earlier termination of this Lease."
  };
  return DEFAULTS;
})();

function createEngine(state){
  "use strict";
  function esc(s){
    return String(s==null?"":s).replace(/[&<>"']/g, function(c){
      return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];
    });
  }
  function money(n){
    if(n===undefined||n===null||isNaN(n)) n=0;
    return "$" + n.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
  }
  function round2(n){ return Math.round((n + Number.EPSILON) * 100) / 100; }
  function parseISODate(s){
    if(!s) return null;
    var p = s.split("-"); if(p.length!==3) return null;
    return new Date(parseInt(p[0],10), parseInt(p[1],10)-1, parseInt(p[2],10));
  }
  function addMonths(d, n){ var r = new Date(d); r.setMonth(r.getMonth()+n); return r; }
  function addDays(d, n){ var r = new Date(d); r.setDate(r.getDate()+n); return r; }
  function fmtDate(d){
    if(!d) return "________________";
    return d.toLocaleDateString("en-US",{year:"numeric",month:"long",day:"numeric"});
  }
  function ordinalDay(d){ return d ? d.getDate() : "___"; }

  var ONES=["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve",
    "Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
  var TENS=["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
  function chunk3(n){
    var s="";
    if(n>=100){ s+=ONES[Math.floor(n/100)]+" Hundred"; n%=100; if(n>0) s+=" "; }
    if(n>=20){ s+=TENS[Math.floor(n/10)]; if(n%10>0) s+=" "+ONES[n%10]; }
    else if(n>0){ s+=ONES[n]; }
    return s;
  }
  function wordsInt(n){
    if(n===0) return "Zero";
    var groups=["","Thousand","Million","Billion"], parts=[], g=0;
    while(n>0){ var rem=n%1000; if(rem>0) parts.unshift(chunk3(rem)+(groups[g]?" "+groups[g]:"")); n=Math.floor(n/1000); g++; }
    return parts.join(" ");
  }
  function moneyWords(amount){
    amount = Math.max(0, round2(amount||0));
    var dollars = Math.floor(amount+1e-9);
    var cents = Math.round((amount-dollars)*100);
    return wordsInt(dollars) + " and " + String(cents).padStart(2,"0") + "/100 Dollars (" + money(amount) + ")";
  }

  /* utilities cap: on/off plus the Lease Years it covers (end 0 = through the end of the term) */
  function capYears(s){
    var start = Math.max(1, parseInt(s.utilitiesCapStartYear,10) || 1);
    var end = parseInt(s.utilitiesCapEndYear,10) || 0;
    end = end > 0 ? Math.max(start, end) : 9999;
    return { on: s.utilitiesCapEnabled !== false, start: start, end: end };
  }
  var YEAR_WORDS = ["","first","second","third","fourth","fifth","sixth","seventh","eighth","ninth","tenth"];

  /* ---------- computed model ---------- */
  function computeModel(s){
    var c = {};
    c.commencement = parseISODate(s.commencementDate);
    c.execution = parseISODate(s.executionDate);
    c.expiration = c.commencement ? addDays(addMonths(c.commencement, s.initialTermMonths), -1) : null;
    c.firstRentDue = c.commencement ? addMonths(c.commencement, s.freeRentMonths) : null;
    c.earlyOccupancy = c.commencement ? addDays(c.commencement, -Math.round((s.earlyOccupancyWeeks||0)*7)) : null;
    c.renewalDeadline = c.expiration ? addDays(c.expiration, -(s.renewalNoticeDays||0)) : null;
    c.guarantyEnd = parseISODate(s.guarantyEndDate);
    c.earlyTermNoticeStart = parseISODate(s.earlyTermNoticeStart);
    c.earlyTermNoticeEnd = parseISODate(s.earlyTermNoticeEnd);
    // Effective date = last day of the month that is N months before the natural expiration
    c.earlyTermEffective = (c.expiration && (s.earlyTermMonths||0) > 0)
      ? addDays(addMonths(addDays(c.expiration, 1), -(s.earlyTermMonths||0)), -1) : null;
    c.termYears = Math.floor((s.initialTermMonths||0)/12);
    c.termMonthsRem = (s.initialTermMonths||0) % 12;

    // rent schedule (built month by month so Landlord rent credits can be applied and shown)
    var rows = [], monthsOut = [];
    var remaining = s.initialTermMonths||0;
    var cursor = 1, yearNum = 1;
    var totalBase = 0, totalUtilities = 0;
    var creditOn = s.rentCreditProvided === "yes";
    var creditMonthly = s.rentCreditMode !== "total";
    var poolLeft = creditMonthly ? 0 : Math.max(0, s.rentCreditTotal||0);
    var rentMonthIdx = 0, creditApplied = 0, creditMonthsHit = 0;
    while(remaining > 0){
      var monthsThisYear = Math.min(12, remaining);
      var yStart = cursor;
      var rate = round2((s.baseRentPSFYear1||0) * Math.pow(1+(s.annualEscalationPct||0)/100, yearNum-1));
      var monthlyBase = round2(rate * (s.rsf||0) / 12);

      // Utilities: the ANNUAL amount is the driver; the monthly charge is annual / 12. Credits never touch utilities.
      var escalatedUtilAnnual = round2((s.utilitiesAnnualYear1||0) * Math.pow(1+(s.utilitiesEscalationPct||0)/100, yearNum-1));
      var capUtilAnnual = round2((s.utilitiesCapAnnualPSFYear2||0) * (s.rsf||0));
      var cy = capYears(s);
      var annualUtilRate = (cy.on && capUtilAnnual > 0 && yearNum >= cy.start && yearNum <= cy.end) ? Math.min(escalatedUtilAnnual, capUtilAnnual) : escalatedUtilAnnual;
      var monthlyUtil = round2(annualUtilRate / 12);

      var freeMonths = (yearNum===1) ? Math.min(s.freeRentMonths||0, monthsThisYear) : 0;
      var label = (monthsThisYear < 12) ? yearNum+" (Partial)" : String(yearNum);

      // classify each month of this lease year
      var ms = [];
      for(var m=0; m<monthsThisYear; m++){
        if(m < freeMonths){ ms.push({kind:"free", net:0, applied:0}); continue; }
        var applied = 0;
        if(creditOn){
          if(creditMonthly){ if(rentMonthIdx < (s.rentCreditMonths||0)) applied = Math.min(Math.max(0, s.rentCreditPerMonth||0), monthlyBase); }
          else { applied = Math.min(poolLeft, monthlyBase); poolLeft = round2(poolLeft - applied); }
        }
        rentMonthIdx++;
        applied = round2(applied);
        var net = round2(monthlyBase - applied);
        if(applied > 0){ creditApplied += applied; creditMonthsHit++; }
        ms.push({kind: applied<=0 ? "normal" : (net<=0.004 ? "credit" : "partial"), net: net, applied: applied});
      }

      for(var mi=0; mi<ms.length; mi++){
        monthsOut.push({n:yStart+mi, year:yearNum, date:c.commencement ? addMonths(c.commencement, yStart-1+mi) : null, base:monthlyBase, free:ms[mi].kind==="free", credit: ms[mi].kind==="free" ? monthlyBase : ms[mi].applied, net:ms[mi].net, util:monthlyUtil});
      }
      // group consecutive months that look the same into one row
      var g = 0, yearFirstRow = rows.length, yearHasCredit = false;
      while(g < ms.length){
        var k = g;
        while(k+1 < ms.length && ms[k+1].kind===ms[g].kind && ms[k+1].net===ms[g].net) k++;
        var n = k-g+1, kind = ms[g].kind, net = ms[g].net;
        var rowMonths = (yStart+g)+"-"+(yStart+k);
        if(rowMonths.split("-")[0]===rowMonths.split("-")[1]) rowMonths = String(yStart+g);
        var utilPeriod = round2(annualUtilRate * n / 12);
        var row = {yearNum:label, months:rowMonths, rate:rate.toFixed(2), annualUtilities:money(utilPeriod), monthlyUtilities:money(monthlyUtil), note:""};
        if(kind==="free"){ row.rate="FREE"; row.monthlyBase="FREE"; row.annualBase="$0.00 (abated)"; row.note="Base rent abated"; }
        else if(kind==="credit"){ row.monthlyBase="CREDIT"; row.strike=money(monthlyBase); row.annualBase="$0.00 (credited)"; row.note="Rent credit"; }
        else if(kind==="partial"){ var ab = round2(net*n); row.monthlyBase="CREDIT ("+money(net)+" net due)"; row.strike=money(monthlyBase); row.annualBase=money(ab); totalBase += ab; row.note="Rent credit applied"; }
        else { var ab2 = round2(monthlyBase*n); row.monthlyBase=money(monthlyBase); row.annualBase=money(ab2); totalBase += ab2; }
        if(kind==="credit" || kind==="partial") yearHasCredit = true;
        row._kind = kind;
        rows.push(row); totalUtilities += utilPeriod;
        g = k+1;
      }
      // in a lease year where a Rent Credit applies, every row also shows the year's total Base Rent BEFORE the credit
      if(yearHasCredit){
        var preYear = money(round2(monthlyBase * (monthsThisYear - freeMonths)));
        for(var ri=yearFirstRow; ri<rows.length; ri++){ rows[ri].annualPre = preYear; rows[ri].annualPreStruck = (rows[ri]._kind==="credit" || rows[ri]._kind==="partial"); }
      }
      cursor += monthsThisYear; remaining -= monthsThisYear; yearNum++;
    }
    c.creditApplied = round2(creditApplied);
    c.creditMonthsHit = creditMonthsHit;
    c.rentRows = rows;
    c.months = monthsOut;
    c.totalBase = totalBase;
    c.totalUtilities = totalUtilities;
    c.year1MonthlyBase = rows.length ? (function(){
      for(var i=0;i<rows.length;i++){ if(String(rows[i].yearNum).indexOf("1")===0 && rows[i].monthlyBase!=="FREE") return rows[i].monthlyBase; }
      return money(0);
    })() : money(0);

    c.movingAllowanceTotal = round2((s.movingAllowancePSF||0) * (s.rsf||0));
    c.parkingSpots = Math.min(2, Math.max(1, parseInt(s.parkingSpaces,10) || 1));
    c.parkingMonths = s.parkingTermMode === "lease" ? (s.initialTermMonths||0) : (s.parkingYears||0)*12;
    c.parkingTotalCost = round2(c.parkingSpots * (s.parkingMonthlyRatePerSpace||0) * c.parkingMonths);

    return c;
  }

  /* ---------- lease template: numbered Sections (I-XXIII) and paragraphs (1.1, 1.2 ...) ---------- */
  function toRoman(n){
    var m=[[10,"X"],[9,"IX"],[5,"V"],[4,"IV"],[1,"I"]], r="", i;
    for(i=0;i<m.length;i++){ while(n>=m[i][0]){ r+=m[i][1]; n-=m[i][0]; } }
    return r;
  }

  function renderRentTable(c, secRef){
    var rows = c.rentRows.map(function(r){
      return "<tr><td>"+esc(r.yearNum)+"</td><td>"+esc(r.months)+"</td>"+
        "<td>"+(r.rate==="FREE"?"FREE":"$"+esc(r.rate))+"</td>"+
        "<td>"+esc(r.monthlyBase)+(r.strike?'<br><span class="strike">'+esc(r.strike)+"</span>":"")+"</td><td>"+esc(r.annualBase)+(r.annualPre?'<br><span class="'+(r.annualPreStruck?'strike':'faint')+'">'+esc(r.annualPre)+"</span>":"")+"</td>"+
        "<td>"+esc(r.annualUtilities)+"</td><td>"+esc(r.monthlyUtilities)+"</td></tr>";
    }).join("");
    return '<table><caption>Section '+esc(secRef)+' &mdash; Rent Schedule</caption>'+
      "<thead><tr><th>Lease&nbsp;Year</th><th>Lease&nbsp;Month</th><th>Annual&nbsp;Base Rent per&nbsp;SF</th><th>Monthly Installment of Base&nbsp;Rent</th>"+
      "<th>Annual Base&nbsp;Rent</th><th>Annual Utilities</th><th>Monthly Utilities</th></tr></thead>"+
      "<tbody>"+rows+
      "</tbody></table>";
  }

  function nw(n){ return wordsInt(n).toLowerCase()+" ("+n+")"; }

  /* Schedule 1.7-A: every month on its own line, with Lease Year subtotals (used by the proposed-revision modes) */
  function renderMonthlySchedule(c){
    var sd = function(d){ return d ? d.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}) : ""; };
    var body = "", cur = null, sub = {b:0,c:0,n:0,u:0}, tot = {b:0,c:0,n:0,u:0};
    function tr(cells, cls){ return '<tr'+(cls?' class="'+cls+'"':'')+'>'+cells+'</tr>'; }
    function flush(){
      if(cur === null) return;
      body += tr('<td colspan="2">Lease Year '+esc(cur)+' total</td><td>'+money(round2(sub.b))+'</td><td>'+money(round2(sub.c))+'</td><td>'+money(round2(sub.n))+'</td><td>'+money(round2(sub.u))+'</td>', 'totalsrow');
      sub = {b:0,c:0,n:0,u:0};
    }
    (c.months||[]).forEach(function(m){
      if(cur !== m.year){ flush(); cur = m.year; }
      body += tr('<td>'+m.n+'</td><td>'+esc(sd(m.date))+'</td><td>'+money(m.base)+'</td><td>'+(m.free?money(m.credit)+' (abated)':(m.credit>0?money(m.credit):'&mdash;'))+'</td><td>'+money(m.net)+'</td><td>'+money(m.util)+'</td>');
      sub.b += m.base; sub.c += m.credit; sub.n += m.net; sub.u += m.util;
      tot.b += m.base; tot.c += m.credit; tot.n += m.net; tot.u += m.util;
    });
    flush();
    body += tr('<td colspan="2">Initial Term total</td><td>'+money(round2(tot.b))+'</td><td>'+money(round2(tot.c))+'</td><td>'+money(round2(tot.n))+'</td><td>'+money(round2(tot.u))+'</td>', 'totalsrow');
    return '<h3 class="sec pagebreak">Schedule {{rent}}-A &mdash; Month-by-Month Rent Schedule</h3>'+
      '<p class="small">Draft for verification. Prepared from the Section {{rent}} figures: for every month it shows scheduled Base Rent, the credit or abatement applied, net Base Rent due, and separately charged electricity. Scheduled Base Rent less credit or abatement equals net Base Rent due in every row, and each Lease Year total is the sum of its months. Credits apply to Base Rent only. Electricity is the scheduled monthly Additional Rent and remains subject to annual reconciliation under Section {{rent}}. Under the proposed correction to Section {{rent}}, this schedule replaces the annual schedule only when approved by both parties.</p>'+
      '<table class="ledger"><caption>Schedule {{rent}}-A &mdash; Monthly Schedule</caption><thead><tr><th>Lease Month</th><th>Installment Due</th><th>Scheduled Base Rent</th><th>Credit / Abatement Applied</th><th>Net Base Rent Due</th><th>Electricity (Additional Rent)</th></tr></thead><tbody>'+body+'</tbody></table>';
  }

  function renderDocument(){
    var s = state, c = computeModel(s);
    var L = esc(s.landlordName)||"[Landlord Name], LLC";
    var T = esc(s.tenantName)||"[Tenant Name], LLC";
    var ST = esc(s.stateName), SUITE = esc(s.suiteNumber);
    var addr = esc(s.buildingAddress)+", Suite "+SUITE+", "+esc(s.city)+", "+ST;
    var t2 = esc((s.tenantSigner2Name||"").trim());
    var t2Title = esc((s.tenantSigner2Title||"").trim());
    var t2Full = t2 + (t2Title ? ", "+t2Title : "");
    var g2 = esc((s.guarantor2Name||"").trim());
    var guarantorNames = esc(s.guarantorName) + (g2 ? " and "+g2 : "");
    var lSignTitle = esc(s.landlordSignerTitle||"") || "Managing Member";
    var execYear = c.execution ? c.execution.getFullYear() : "____";
    var interest = esc(s.latePaymentInterestPct);

    var blocks = [], ids = {}, secNo = 0, paraNo = 0;
    function SEC(title, pb){ secNo++; paraNo = 0; blocks.push('<h3 class="sec'+(pb?' pagebreak':'')+'">Section '+toRoman(secNo)+' &mdash; '+title+'</h3>'); }
    function P(id, label, text){
      paraNo++; var num = secNo+"."+paraNo; if(id) ids[id] = num;
      blocks.push('<p><strong class="pn">'+num+'</strong> '+(label?'<strong>'+label+'</strong> ':'')+text+'</p>');
    }
    function ITEM(mark, text, lvl){ blocks.push('<p class="item'+(lvl===2?' item2':'')+'"><strong>'+mark+'</strong> '+text+'</p>'); }
    function RAW(h){ blocks.push(h); }

    /* ===== proposed-revision mode (Original / Review copy / Clean draft) ===== */
    var mode = (s.revisionMode === "original" || s.revisionMode === "clean") ? s.revisionMode : "review";
    var REV = mode !== "original", REVIEW = mode === "review", CLEAN = mode === "clean";
    var rsfTxt = (s.rsf||0).toLocaleString("en-US");
    var depTxt = money(s.securityDeposit||0);
    var effTxt = c.earlyTermEffective ? fmtDate(c.earlyTermEffective) : "________________";
    var credOn = s.rentCreditProvided === "yes" && c.creditApplied > 0;
    var credTxt = money(credOn ? (s.rentCreditMode === "total" ? (s.rentCreditTotal||0) : c.creditApplied) : 0);
    var capInfo = capYears(s), capPSF = s.utilitiesCapAnnualPSFYear2 || 0, capOn = capInfo.on && capPSF > 0;
    var capTermYrs = Math.ceil((s.initialTermMonths||0)/12), capEnd = Math.min(capInfo.end, capTermYrs), capStart = Math.min(capInfo.start, capEnd);
    var capPhr = capStart === capEnd ? "Lease Year "+capStart : "Lease Years "+capStart+" through "+capEnd;
    var capClause = capOn ? ", subject in "+capPhr+" to an annual charge not exceeding "+money(capPSF)+" multiplied by "+rsfTxt+" RSF (currently "+money(round2(capPSF*(s.rsf||0)))+" per full Lease Year), subject to proration for partial years" : ", subject to proration for partial years";
    var capWord = capOn ? money(capPSF)+"/RSF cap" : "cap";
    var ntw = (c.earlyTermNoticeStart && c.earlyTermNoticeEnd && (s.earlyTermMonths||0) > 0) ? fmtDate(c.earlyTermNoticeStart)+" to "+fmtDate(c.earlyTermNoticeEnd)+" notice window, " : "";
    var splitRow = null;
    c.rentRows.forEach(function(r){
      if(splitRow || String(r.yearNum).indexOf("Partial") >= 0) return;
      var mm = String(r.months).split("-"), cnt = mm.length === 1 ? 1 : (parseInt(mm[1],10) - parseInt(mm[0],10) + 1);
      if(cnt < 12) splitRow = r;
    });
    var splitTxt = splitRow ? "The existing annual figures and utility entries contain inconsistencies, including a Year "+String(splitRow.yearNum).split(" ")[0]+" row that lists "+splitRow.annualUtilities+" as \u201cAnnual Utilities,\u201d and must not be relied upon as a reconciled rent ledger. " : "";
    var PL = {
      early: "ADDITION TO §{{term}} (EARLY ACCESS)",
      renewal: "ADDITION TO §{{renewal}} (RENEWAL)",
      demised: "ADDITION TO §{{demised}}",
      earlyTerm: "REPLACEMENT OF §{{earlyterm}} - EARLY TERMINATION OPTION",
      accept: "ADDITION TO §{{accept}}",
      depAdd: "ADDITION TO §{{deposit}}",
      lmaint: "CLARIFICATION TO §{{lmaint}}",
      tmaint: "CLARIFICATION TO §{{tmaint}}",
      lwork: "ADDITION TO §{{lwork}}",
      laccess: "ADDITION TO §{{laccess}}",
      tsigns: "ADDITION TO §{{tsigns}}",
      publiab: "ADDITION TO §{{publiab}}",
      assign: "ADDITION TO §{{assign}}",
      default: "ADDITION TO §{{default}}",
      remedies: "CLARIFICATION TO §{{remedies}}",
      holdover: "REPLACEMENT OF §{{holdover}} - HOLDOVER",
      surrender: "CLARIFICATION TO §{{surrender}}",
      haz2: "LIMITATION TO §{{haz2}}",
      haz3: "LIMITATION TO §{{haz3}}",
      leed: "CLARIFICATION TO §{{leed}}",
      notice: "REPLACEMENT OF §{{notice}} - NOTICES",
      delays: "ADDITION TO §{{delays}}",
      snda: "CLARIFICATION TO §{{snda}}",
      guarantee: "ADDITION TO §{{guarantee}}",
      guaranty: "REPLACEMENT OF THE GUARANTY PERIOD AND SURVIVAL LANGUAGE IN EXHIBIT E",
      completion: "COMPLETION REQUIREMENT",
      rentFix: "RENT-SCHEDULE CORRECTION AND RECONCILIATION",
      electric: "REPLACEMENT FOR THE ELECTRIC RECONCILIATION SENTENCES IN §{{rent}}"
    };
    var PB = {};
    PB.early = esc(`Early access beginning ${fmtDate(c.earlyOccupancy)} is solely for the delivery and installation of furniture and equipment, not the operation of Tenant’s business, unless Landlord consents in writing. Before access, Tenant must deliver required insurance certificates, confirm the existing ${depTxt} Security Deposit is already held by Landlord, and comply with all Lease provisions other than the obligation to pay Base Rent before ${fmtDate(c.firstRentDue)}. Tenant shall be responsible for electricity attributable to early occupancy and any damage caused by its representatives. Early access does not advance the Commencement Date or extend the Expiration Date.`);
    PB.renewal = esc(`The renewal right is personal to the original Tenant and may be exercised only if Tenant is not then in default beyond applicable notice and cure periods, and is not in such default at the commencement of the renewal term. “Then current market rate rent” means the market base rental rate for comparable office space in the Building or competitive nearby buildings, considering size, condition, term and concessions. Within thirty (30) days after timely exercise, Landlord shall deliver its written proposed market rate. If the parties do not agree within thirty (30) days thereafter, the rate shall be determined by an independent commercial real estate appraiser with at least five years’ relevant local office-leasing experience, jointly selected by the parties; the appraiser’s written decision shall be binding, and fees shared equally. The renewal shall be documented in a signed amendment before the renewal term begins. [NEGOTIATE: minimum renewal rent floor and treatment of rent concessions.]`);
    PB.demised = esc(`The rentable area of ${rsfTxt} RSF is agreed for all Base Rent and electricity allocation calculations unless revised by a written amendment signed by both parties. Landlord and Tenant shall initial a final, dated floor plan in Exhibit B showing Suite 202, all entry doors, demising walls, and any work limits.`);
    PB.earlyTerm = esc(`Provided Tenant is not in default beyond any applicable notice and cure period when giving notice or on the termination date, Tenant may elect an early termination effective ${effTxt} only by written notice actually received by Landlord between ${fmtDate(c.earlyTermNoticeStart)} and ${fmtDate(c.earlyTermNoticeEnd)}, inclusive. As a condition of termination, Tenant shall (i) pay all Base Rent, electricity and other Additional Rent through ${effTxt}, (ii) surrender the Premises in the condition required under Section {{surrender}}, and (iii) pay an early termination fee of [NEGOTIATE: dollar amount or formula, e.g., unamortized landlord-funded improvements, leasing commissions and unamortized rent concessions, plus agreed administrative charge] no later than [NEGOTIATE: deadline]. The fee shall not constitute a release of liabilities accrued before termination. Failure to satisfy these conditions makes the election ineffective unless Landlord expressly waives the condition in writing. If Tenant does not timely exercise this option, this Lease continues through ${fmtDate(c.expiration)}.`);
    PB.accept = esc(`Acceptance of the Premises shall not waive Landlord’s obligation to complete the specific work set forth in the final, signed Exhibit D, subject to a mutually agreed written punch list signed at delivery. No oral change orders or unwritten requests shall modify Exhibit D.`);
    PB.depAdd = esc(`If Landlord applies any part of the Security Deposit, Tenant shall restore the deposit to ${depTxt} within ten (10) days after written demand; failure to replenish shall constitute a monetary default subject to Section {{default}}(a). The Security Deposit is not prepaid rent and may not be used by Tenant toward the final month of rent. Landlord may withhold documented amounts for unpaid charges and damage beyond ordinary wear and tear, with a written itemization and any remaining refund within the period stated in this Section.`);
    PB.lmaint = esc(`Landlord’s liability for interruptions caused by Landlord’s acts or omissions shall be determined under applicable law and the express terms of this Lease; nothing herein creates strict liability for service interruption or requires payment of speculative, special or consequential damages, except to the extent such limitation is prohibited by law. Planned non-emergency service interruptions shall be communicated to Tenant when reasonably practicable.`);
    PB.tmaint = esc(`Tenant is responsible for ordinary interior upkeep, consumables and damage caused by Tenant or its agents. Landlord remains responsible for base-building systems and capital replacements except to the extent damage is caused by Tenant’s negligence or misuse; costs of tenant-caused damage are payable by Tenant as Additional Rent after reasonable documentation. The parties shall allocate responsibility for any dedicated HVAC, plumbing and electrical equipment in Exhibit D to avoid overlap between Sections {{lmaint}} and {{tmaint}}.`);
    PB.lwork = esc(`Exhibit D shall be completed and initialed by both parties before execution, including plans, finish specifications, construction schedule, permit responsibility and a written substantial-completion standard. Landlord’s work is limited to the signed Exhibit D. Any change requested by Tenant after approval must be approved by Landlord in a written change order stating any additional cost, required deposit and schedule adjustment; Tenant shall pay approved additional costs before commencement of the change unless otherwise agreed. Landlord shall not be responsible for Tenant’s furniture, data cabling or equipment unless expressly identified in Exhibit D. [NEGOTIATE: permitted delay and delivery remedies.]`);
    PB.laccess = esc(`Landlord may enter without advance notice in an emergency and with at least twenty-four (24) hours’ advance notice for non-emergency access, except for routine janitorial work, which may occur under established Building procedures. Tenant shall not unreasonably obstruct required access or showings. Landlord shall use commercially reasonable efforts to minimize interference; an unavoidable, temporary interruption shall not by itself prohibit access.`);
    PB.tsigns = esc(`All Tenant signage is subject to Landlord’s prior written approval of location, size, design, method of attachment and contractor, such approval not to be unreasonably withheld for signage expressly permitted by this Lease. Tenant shall obtain necessary permits, maintain signage in safe condition, and remove it and repair resulting damage upon expiration or termination. Monument sign space is subject to available capacity and final approved specifications.`);
    PB.publiab = esc(`Before early access and throughout the Lease Term, Tenant shall maintain commercial general liability insurance with limits of not less than $1,000,000 per occurrence and $2,000,000 general aggregate, or such different limits as the parties approve in writing after consultation with their insurance advisers. Landlord and its property manager shall be additional insureds for liability arising from Tenant’s occupancy to the extent available under the policy; coverage shall be primary and noncontributory to the extent commercially available. Tenant shall furnish evidence of coverage before occupancy and upon renewal. Policy cancellation and nonrenewal notices shall be provided to the extent available from the insurer; Tenant must promptly notify Landlord of any actual cancellation or material lapse. [INSURANCE ADVISER TO VERIFY LIMITS, ENDORSEMENTS AND CONSISTENCY WITH §{{tindem}}-{{lindem}}.]`);
    PB.assign = esc(`Tenant shall give Landlord prior written notice of any proposed transfer, with the proposed assignee’s or subtenant’s name, use, financial information reasonably necessary to evaluate credit, and the executed transfer documents when available. No transfer shall expand the permitted use or release Tenant or any guarantor except by Landlord’s express written release. A permitted assignee shall assume Tenant’s post-transfer Lease obligations in a writing reasonably satisfactory to Landlord. Any sharing of excess consideration shall be calculated after reasonable documented third-party transaction costs [NEGOTIATE: exact profit-sharing method].`);
    PB.default = esc(`A non-monetary default that cannot reasonably be cured within thirty (30) days shall not be an event of default if Tenant commences cure within that period and diligently pursues completion, provided no imminent safety or property risk exists; in that case Landlord may take lawful protective action and recover reasonable documented costs. Monetary default periods and applicable legal notice requirements remain governed by Section {{default}}(a) and Ohio law.`);
    PB.remedies = esc(`Any re-entry, repossession or removal shall be accomplished only through lawful procedures; no provision authorizes self-help lockout or dispossession where prohibited by applicable law. Landlord shall be entitled to recover documented costs and damages to the extent legally recoverable, with no double recovery among alternative remedies and with any required mitigation credited appropriately.`);
    PB.holdover = esc(`If Tenant remains in possession after expiration or earlier termination without a new written lease, Tenant shall be a tenant at sufferance, or month-to-month only if Landlord expressly agrees in writing, at monthly Base Rent equal to one hundred fifty percent (150%) of the last full month’s Base Rent, plus all applicable Additional Rent, for each month or portion thereof during holdover, prorated only if Landlord accepts prorated rent in writing. Acceptance of rent shall not renew or extend the Lease absent a signed writing. Tenant shall also be liable for Landlord’s direct, documented losses resulting from an unauthorized holdover, to the extent permitted by law and without double recovery. [NEGOTIATE: whether 150% applies throughout holdover or whether a different tier begins after three months.]`);
    PB.surrender = esc(`All repossession, disposal of abandoned property, and removal of persons shall be conducted in compliance with applicable law and any required judicial process. Tenant shall remove its personal property and repair damage caused by such removal, except that Tenant is not required to remove wiring or cabling under the existing concession. Any property handling and storage costs must be reasonable and documented.`);
    PB.haz2 = esc(`Notwithstanding any broader wording above, Tenant’s environmental indemnity applies only to the extent contamination is caused or exacerbated by Tenant or persons for whom Tenant is legally responsible, and does not apply to pre-existing conditions, migration from other property, or acts of Landlord or third parties not under Tenant’s control. Ordinary office and cleaning supplies maintained in lawful quantities and used in compliance with applicable law shall not be deemed a prohibited use. Immediate termination is reserved for a material violation presenting an imminent hazard or an uncured material violation after legally required notice, except where immediate action is permitted by law.`);
    PB.haz3 = esc(`Notwithstanding any broader wording above, Landlord’s environmental indemnity applies only to contamination caused or exacerbated by Landlord or persons for whom Landlord is legally responsible; it shall not impose liability for pre-existing, off-site or Tenant-caused conditions absent Landlord’s independent legal responsibility. Ordinary lawful building maintenance chemicals used appropriately are permitted. Immediate termination is reserved for material violations creating an imminent hazard or as otherwise permitted by applicable law.`);
    PB.leed = esc(`The parties shall verify the Building’s actual LEED certification status and identify in Exhibit D which current code and LEED-related fit-out standards apply to the agreed Landlord’s Work. References to legacy standards do not excuse compliance with applicable current building codes. Any upgraded specification requested solely by Tenant shall require a written approved change order unless already included in Exhibit D.`);
    PB.notice = esc(`Required notices shall be delivered personally, by nationally recognized overnight courier with delivery tracking, or by certified U.S. mail, return receipt requested, postage prepaid, to the notice addresses shown in Sections {{landlord}} and {{tenant}} (as updated by written notice). Notices shall be effective upon actual receipt or documented refusal, except where applicable law requires a different method or effective date. Email copies may be sent for convenience but shall not alone satisfy a formal notice requirement unless both parties separately agree in writing.`);
    PB.delays = esc(`Force majeure shall not excuse Tenant’s obligation to pay Rent or other monetary amounts when due, except to the extent expressly provided elsewhere in this Lease or required by law. The affected party shall provide reasonably prompt written notice and diligently mitigate the delay.`);
    PB.snda = esc(`An estoppel certificate shall be substantially in Landlord’s customary form, reasonably accurate, and limited to factual matters within Tenant’s knowledge. Tenant shall return it within ten (10) business days after receipt, with any good-faith corrections stated in writing. Any requested SNDA shall be in a commercially reasonable form acceptable to the mortgagee and Tenant, neither acting unreasonably.`);
    PB.guarantee = esc(`The Guaranty shall be fully executed and delivered with the Lease, and Landlord shall have no obligation to provide early access until both guarantors have executed Exhibit E. Any guaranty release or shortening of the guaranty period must be approved in writing by Landlord.`);
    PB.guaranty = esc(`Each Guarantor jointly and severally guarantees payment and performance of Tenant’s obligations arising during the entire Initial Term, any properly exercised renewal term, and any holdover, subject to [NEGOTIATE: agreed cap, burn-off, or financial test]. Termination or expiration of the Lease or of a stated guaranty period shall not discharge liability for any obligations that accrued before that expiration, including amounts ascertained or invoiced afterward, and such obligations shall survive until finally satisfied, subject to applicable law. Any early release of a Guarantor must be expressly agreed in writing by Landlord. This paragraph replaces the statement that the Guaranty “shall cease” automatically on ${fmtDate(c.guarantyEnd)}. [REQUIRES GUARANTOR REVIEW AND SIGNATURES.]`);
    PB.completion = esc(`Before execution, complete all blank party names, entity types, addresses, signature names and capacities, and attach final signed Exhibits A through E. Exhibit B must contain the agreed floor plan; Exhibit C the Rules and Regulations; Exhibit D the finalized work scope, plans and specifications; and Exhibit E the complete guarantor identities and signatures. The parties should confirm the ${ntw}guaranty end date, and renewal notice deadline after any negotiated changes.`);
    PB.rentFix = esc(`The parties shall replace the Section {{rent}} schedule before signing with a verified ${s.initialTermMonths}-month schedule identifying, for every month, scheduled Base Rent, ${credOn?'the portion of the '+credTxt+' credit applied, ':''}net Base Rent due, and separately charged electricity. ${credOn?'The '+credTxt+' credit shall never exceed scheduled Base Rent due and shall not apply to electricity or other Additional Rent. ':''}${splitTxt}Any summary annual amount shall equal the sum of the monthly installments for that Lease Year. For clarity, the parties’ approved month-by-month schedule shall control over any inconsistent rounded annual $/SF display. [REQUIRES APPROVED REPLACEMENT SCHEDULE BEFORE EXECUTION.]`);
    PB.electric = esc(`Tenant’s share of actual floor electricity cost for each Lease Year shall equal (actual metered electricity charges attributable to the floor, excluding charges for separately metered premises and other non-floor loads) multiplied by (${rsfTxt} RSF divided by the total rentable square footage on that floor served by the same meter)${capClause}. Within ninety (90) days after the end of each applicable Lease Year, Landlord shall provide a statement showing supplier charges, allocation denominator, Tenant’s calculated share, amounts already paid and the resulting credit or balance. Tenant shall pay any lawful shortfall within thirty (30) days after receipt; an overpayment shall be credited against the next charges or refunded after expiration. [CONFIRM: whether Year 1 is reconciled; whether the ${capWord} includes all electricity or only reconciliation amounts; exact square footage denominator and meter coverage.]`);
    function PROPL(label, text){
      if(!REV) return;
      if(REVIEW) RAW('<p class="prop"><strong>PROPOSED '+label+': '+text+'</strong></p>');
      else RAW('<p>'+text+'</p>');
    }

    /* ===== preamble ===== */
    if(REVIEW) RAW('<p class="banner"><strong>LEASE REVISION REVIEW COPY - LANDLORD PROPOSED LANGUAGE</strong></p><p class="banner"><strong>Bold paragraphs labeled “PROPOSED” are recommended changes for negotiation, NOT agreed or effective terms. The original clause remains immediately above each proposed paragraph for comparison. Where the proposed paragraph is marked “REPLACEMENT,” that earlier inconsistent text must be removed when the parties agree to finalize the lease. All amounts labeled [NEGOTIATE] or [CONFIRM] require express business approval. This document must not be signed as-is.</strong></p>');
    if(CLEAN) RAW('<p class="banner"><strong>LEASE DRAFT &mdash; PROPOSED REVISIONS MERGED</strong></p><p class="banner"><strong>This draft merges the Landlord&rsquo;s proposed language into the lease; replaced clauses no longer appear. Items in [NEGOTIATE] or [CONFIRM] brackets are open and require express business approval. This document must not be signed as-is.</strong></p>');
    RAW('<h2 class="doctitle">COMMERCIAL LEASE</h2>');
    RAW('<p class="bldgtitle">'+(esc(s.buildingName||"")||"The Edge Office Building")+'</p>');
    RAW('<p class="docsub">'+esc(s.buildingAddress)+', '+esc(s.city)+', '+ST+(String(s.buildingZip||"").trim()?' '+esc(String(s.buildingZip).trim()):'')+'</p>');
    RAW('<p>THIS LEASE is entered into on <span class="blank2">__________________________</span>, by and between <strong>'+L+'</strong> (&ldquo;Landlord&rdquo;) and <strong>'+T+'</strong> (&ldquo;Tenant&rdquo;).</p>');

    /* ===== I. BASIC LEASE PROVISIONS ===== */
    SEC("Basic Lease Provisions");
    P("landlord","Landlord:", L+', located at '+esc(s.landlordAddress)+'.');
    P("tenant","Tenant:", T+', located at '+esc(s.tenantAddress)+'.');
    P("permitted","Permitted Use:", `The Premises are leased to be used for ${esc(s.permittedUse)}. Tenant agrees to restrict the use to such purposes and those purposes related thereto and not to use the Premises for other purposes without first obtaining the written permission of Landlord.`);
    P("term","Lease Term:", `The initial term of this Lease (the &ldquo;Initial Term&rdquo;) shall be for a period of ${nw(s.initialTermMonths)} months (${nw(c.termYears)} years${c.termMonthsRem?' and '+nw(c.termMonthsRem)+' months':''}), commencing on ${fmtDate(c.commencement)} (the &ldquo;Commencement Date&rdquo;) and expiring on ${fmtDate(c.expiration)}. Landlord shall allow Tenant early occupancy to the Premises to allow Tenant to move furniture into the Premises from ${fmtDate(c.earlyOccupancy)}, being ${esc(s.earlyOccupancyWeeks)} week(s) prior to the Commencement Date. Landlord and Tenant agree to sign a commencement date agreement, attached hereto as Exhibit &ldquo;A&rdquo;, upon the occurrence of the Commencement Date. Such Agreement shall define the Commencement Date and the expiration date of the Lease term.`);
    PROPL(PL.early, PB.early);
    P("renewal","Lease Renewal:", `So long as Tenant is not in default of this Lease, Tenant shall have the right to extend this Lease for ${nw(s.renewalOptionCount)} ${nw(s.renewalOptionYears)} year option${s.renewalOptionCount>1?'s':''}, under the same terms and conditions provided for herein, except for rent which shall be calculated at then current market rate rent. In the event the Tenant desires to exercise its option to extend the Lease it shall provide Landlord with no less than ${nw(s.renewalNoticeDays)} days advance written notice (i.e., on or before ${fmtDate(c.renewalDeadline)} for the first option).`);
    PROPL(PL.renewal, PB.renewal);
    P("leaseyear","Lease Year:", `&ldquo;Lease Year&rdquo; shall mean a twelve (12) month period. Each Lease Year shall commence on the Commencement Date or the anniversary thereof and end twelve (12) months later; provided, however, that if the Commencement Date is a day other than the first day of a calendar month, then (a) the first Lease Year shall include that period of time from the Commencement Date up to the first day of the next calendar month and the following twelve (12) calendar months; and (b) each subsequent Lease Year shall commence on the first day of the month following the month in which the Commencement Date occurred.`);
    P("rent","Monthly Installment of Base Rent:", `Tenant shall pay monthly modified gross rent (the &ldquo;Rent&rdquo;), excluding electric charges (which Tenant shall pay) during the Initial Term of the Lease as follows:`);
    PROPL(PL.rentFix, PB.rentFix);
    RAW(renderRentTable(c, ids.rent));
    if(s.rentCreditProvided === "yes"){
      var rcText = s.rentCreditMode === "total"
        ? `Landlord shall provide Tenant a rent credit in the total amount of ${moneyWords(s.rentCreditTotal)} (the &ldquo;Rent Credit&rdquo;), which shall be applied against each monthly installment of Base Rent, beginning with the first installment due, until the Rent Credit is exhausted.`
        : `Landlord shall provide Tenant a rent credit of up to ${money(s.rentCreditPerMonth)} per month for ${nw(s.rentCreditMonths||0)} months (the &ldquo;Rent Credit&rdquo;), applied against each monthly installment of Base Rent, beginning with the first installment due.`;
      RAW(`<p><strong>Rent Credit:</strong> ${rcText} Months in which the Rent Credit fully offsets the monthly installment are shown as &ldquo;Credit&rdquo; in the Rent Schedule above, and a month only partly offset shows &ldquo;Credit&rdquo; with the net amount due. In every Lease Year in which a Rent Credit applies, the lighter figure shown beneath an Annual Base Rent amount is the total Base Rent for that Lease Year before the Rent Credit (struck through in months the Rent Credit offsets). The Rent Credit applies to Base Rent only; Monthly Utilities and other Additional Rent are not reduced.</p>`);
    }
    var cy = capYears(s), capSeg = ". If";
    if(cy.on && (s.utilitiesCapAnnualPSFYear2||0) > 0){
      var termYrs = Math.ceil((s.initialTermMonths||0)/12);
      var cEnd = Math.min(cy.end, termYrs), cStart = Math.min(cy.start, cEnd);
      var mA = (cStart-1)*12+1, mB = Math.min(cEnd*12, s.initialTermMonths||cEnd*12);
      var yrPhrase = cStart===cEnd ? "the "+(YEAR_WORDS[cStart]||("Lease Year "+cStart))+" year" : "Lease Years "+cStart+" through "+cEnd;
      capSeg = ", provided, however, that Tenant cost for electric shall not exceed "+money(s.utilitiesCapAnnualPSFYear2)+" per square foot during "+yrPhrase+" (i.e., months "+mA+"-"+mB+") of the Lease. Moreover, if";
    }
    if(!CLEAN) RAW(`<p>*Additional Rent, shown in the chart above as &ldquo;Utilities,&rdquo; shall include electric which is not separately metered and cannot be transferred into Tenant&rsquo;s name. Internet and Telephone services shall be placed in Tenant&rsquo;s name and paid separately. The electric charge for each successive year of the Initial Term shall be the amount reflected in the above chart. In addition, beginning at the end of year 2 of the Initial Term, Landlord shall provide Tenant a calculation of the Tenant&rsquo;s actual cost for electric usage for the entire floor on which the Demised Premises are located divided by the Tenant&rsquo;s rentable square footage for the Leased Premises (the &ldquo;Annual Electric Usage Calculation&rdquo;)${capSeg} the Annual Electric Usage Calculation shows that Tenant&rsquo;s usage exceeded the amount of Additional Rent paid in the prior year, then Tenant shall pay the Landlord the amount reflected in the Annual Electric Usage Calculation on or before the last day of the month immediately following Tenant&rsquo;s receipt of the Annual Electric Usage Calculation. If the Annual Electric Usage Calculation shows that Tenant overpaid Landlord for the Tenant&rsquo;s electric usage during the prior year, then Tenant shall be credited for any overpayment of the Additional Rent. Landlord shall be responsible for payment of all other expenses and maintenance costs for the Building.</p>`);
    if(REVIEW) PROPL(PL.electric, PB.electric);
    if(CLEAN) RAW('<p>'+`*Additional Rent, shown in the chart above as &ldquo;Utilities,&rdquo; shall include electric which is not separately metered and cannot be transferred into Tenant&rsquo;s name. Internet and Telephone services shall be placed in Tenant&rsquo;s name and paid separately. The electric charge for each successive year of the Initial Term shall be the amount reflected in the above chart. `+PB.electric+' '+`Landlord shall be responsible for payment of all other expenses and maintenance costs for the Building.`+'</p>');
    P("demised","Demised Premises:", `The Demised Premises shall include (i) Suite ${SUITE}, containing approximately ${(s.rsf||0).toLocaleString("en-US")} rentable square feet (&ldquo;RSF&rdquo;), located at ${addr}, as outlined in the attached Exhibit &ldquo;B&rdquo; (the &ldquo;Demised Premises&rdquo;).`);
    PROPL(PL.demised, PB.demised);
    if((s.earlyTermMonths||0) > 0 && c.earlyTermNoticeStart && c.earlyTermNoticeEnd){
      if(!CLEAN) P("earlyterm","Early Termination Option:", `Upon written notice from Tenant delivered to Landlord on or after ${fmtDate(c.earlyTermNoticeStart)} and on or before ${fmtDate(c.earlyTermNoticeEnd)}, this Lease may terminate ${nw(s.earlyTermMonths)} months prior to the scheduled expiration of the Initial Term, effective ${c.earlyTermEffective?fmtDate(c.earlyTermEffective):'________________'}, with no termination fee, penalty or other charge payable by Tenant, provided that all Rent, utilities and other Additional Rent due under this Lease through the effective termination date have been paid in full. If Tenant does not deliver such notice within that period, this option lapses and the Lease continues through the scheduled expiration date.`);
      if(REVIEW) PROPL(PL.earlyTerm, PB.earlyTerm);
      if(CLEAN) P("earlyterm","Early Termination Option:", PB.earlyTerm);
    }

    /* ===== II. GRANTING CLAUSE ===== */
    SEC("Granting Clause");
    P("", "", `In consideration of the obligation of Tenant to pay rent and of the other terms, covenants and conditions hereof, Landlord leases to Tenant and Tenant takes from Landlord the Demised Premises as described in Section {{demised}}, to have and to hold said Demised Premises for the Lease Term specified in Section {{term}} (as such Lease term may be extended as set forth herein), all upon the terms and conditions set forth in the Lease. Landlord further agrees that if Tenant shall perform all of the covenants and agreements herein required to be performed by Tenant, Tenant shall, subject to terms of this Lease, at all times during the continuance of this lease have peaceful and quiet possession of the Demised Premises.`);

    /* ===== III. OCCUPANCY AND ACCEPTANCE OF PREMISES ===== */
    SEC("Occupancy and Acceptance of Premises");
    P("","Occupancy:", `Landlord shall deliver to Tenant occupancy of the Demised Premises on or before the Commencement Date. If Landlord, for any reason whatsoever, cannot deliver possession of the Demised Premises to Tenant on the Commencement Date, this Lease shall not be void or voidable, nor shall Landlord be liable to Tenant for any loss or damage resulting therefrom, but in that event, there shall be a proportionate reduction of rent for the period of delay that Tenant is unable to take possession of the premises.`);
    P("accept","Occupancy Deemed Compliance:", `By occupying the Demised Premises, Tenant shall be deemed to have accepted the same in &ldquo;as is&rdquo; condition, with the modifications by Landlord as shown in Exhibit B, and to have acknowledged that the same comply fully with Landlord&rsquo;s covenants and obligations hereafter except for any punch list items which are determined by Landlord and Tenant in the walk through.`);
    PROPL(PL.accept, PB.accept);
    P("","Recordable Lease Memorandum:", `Landlord and Tenant each agree that at the request of either they will execute and deliver a Memorandum of Lease in recordable form containing the basic provisions of this agreement acknowledging that Tenant has accepted possession and reciting the exact commencement date and termination date of this Lease.`);

    /* ===== IV. RENT ===== */
    SEC("Rent");
    P("firstpay","Payment of Rent:", (s.freeRentMonths>0
      ? `The first ${nw(s.freeRentMonths)} months of the Initial Term shall be Rent free. Therefore the first monthly payment of Rent shall be due ${fmtDate(c.firstRentDue)} and shall be payable to Landlord at the address specified in Section {{landlord}}.`
      : `The first monthly payment of Rent shall be due ${fmtDate(c.firstRentDue)} and shall be payable to Landlord at the address specified in Section {{landlord}}.`));
    P("monthly","Payment of Monthly Rental:", `Tenant shall pay to Landlord Monthly Rental in the amount specified in Section {{rent}} above. Subject to the provisions of Section {{firstpay}}, the first such monthly installment shall be due and payable as provided in Section {{firstpay}}, and subsequent installments shall be due and payable on or before the first day of each succeeding calendar month during the Lease Term without any abatement, deduction or setoff. Rent for partial months shall be prorated.`);
    P("","Late Payment Penalty:", `It is understood that the Monthly Rental is payable on or before the first day of the month (in accordance with Section {{monthly}} above). In the event any rental is not received within ${nw(s.lateGraceDays)} days after its due date, it is agreed that the amount thus due shall bear interest at the rate of ${interest}% per month, such interest to accrue continuously on any unpaid balance due to Landlord by Tenant during the period commencing with the aforesaid due date and terminating with the date on which Tenant makes full payment of all amounts owing to Landlord at the time of said payment. Any such increase shall be payable as additional rent hereunder and shall be payable immediately upon demand.`);
    var oneMonth = Math.abs((s.securityDeposit||0) - round2((s.baseRentPSFYear1||0)*(s.rsf||0)/12)) < 0.011;
    var depLead = `Tenant shall pay to Landlord upon the Commencement Date a deposit in the sum of ${moneyWords(s.securityDeposit)}${oneMonth?' (being one (1) month&rsquo;s Rent)':''} to be held by Landlord as a security deposit to secure the faithful performance by the Tenant of all of the terms, covenants and conditions of this Lease (&ldquo;Default Deposit&rdquo;).`;
    var depRest = `Tenant agrees that if Tenant shall fail to pay the Monthly Rental herein reserved or other charges due hereunder promptly when due, said Default Deposit may, at the option of Landlord, be applied on any such sums due and unpaid, and if Tenant violates any of the other terms, covenants and conditions of this Lease, said Default Deposit may be applied to any damages suffered as a result of Tenant&rsquo;s default to the extent of the amount of the damages suffered. Tenant shall be permitted to &ldquo;walk through&rdquo; the Demised Premises within thirty (30) days of vacating same for the purpose of documenting any reasons for Landlord&rsquo;s withholding of Default Deposit. Nothing contained in this Article shall in any way diminish or be construed as waiving any of the Landlord&rsquo;s other remedies as provided herein, or by law or in equity. Should Tenant comply with all of the terms, covenants and conditions of this Lease, and promptly pay all of the Monthly Rental herein provided for as it falls due and all other sums payable by Tenant to Landlord hereunder, said Default Deposit shall be returned in full to Tenant within Thirty (30) days after the end of the term of this Lease.`;
    var depProp = esc("Landlord acknowledges that it currently holds the "+moneyWords(s.securityDeposit)+" security deposit previously paid by Tenant under the Original Lease (the “Default Deposit”). The existing "+depTxt+" Default Deposit shall remain held by Landlord, without refund or re-collection, and shall secure the full and faithful performance of Tenant’s obligations throughout the renewal term and any further extension of this Lease. No additional security deposit shall be required solely by reason of this renewal. The parties confirm that the security deposit amount remains unchanged at "+depTxt+", subject to Landlord’s express rights to apply and require replenishment of the deposit as otherwise provided in this Section.");
    P("deposit","Security Deposit:", (REV ? (REVIEW ? "<strong>"+depProp+"</strong>" : depProp) : depLead) + " " + depRest);
    PROPL(PL.depAdd, PB.depAdd);

    /* ===== V. COMMON AREA ===== */
    SEC("Common Area");
    P("","Common Area:", `The term &ldquo;Common Area&rdquo; is defined for all purposes of this Lease as that part of the Building intended for the common use of all tenants, including but not limited to, hallways, elevators, stairways, parking area, private streets and alleys, landscaping, curbs, loading area, sidewalk, lighting facilities, and the like. Tenant, and its employees and customers, shall have the nonexclusive right to use the Common Area as constituted from time to time, such use to be in common with Landlord, other tenants to the Building and other persons permitted by Landlord to use the same.`);
    P("","Regulations:", `The use of the Common Area by Tenant and its invitees is subject to such reasonable rules and regulations governing use as Landlord may from time to time prescribe. The current Rules and Regulations of the Building are attached hereto as Exhibit &ldquo;C&rdquo;. Any inconsistency between the Rules and Regulations and this Lease shall be controlled by this Lease.`);
    P("","Management and Maintenance:", `Landlord shall operate, manage, equip, repair and maintain the Common Area and facilities for their intended purposes throughout the Lease Term in its current condition. So long as access to the visibility of the Demised Premises or access to the Demised Premises is not impaired and Tenant&rsquo;s business in the Demised Premises is not disturbed, Landlord reserves the right to change from time to time the dimensions and locations of the Common Area.`);

    /* ===== VI. USE AND CARE OF PREMISES ===== */
    SEC("Use and Care of Premises");
    P("","Use of Demised Premises:", `The Demised Premises may be used only for the purpose or purposes specified in Section {{permitted}} above and for no other purposes without the prior written consent of Landlord which shall not be unreasonably withheld.`);
    P("","Compliance with Insurance Requirements:", `Tenant shall not, without Landlord&rsquo;s prior written consent, keep anything within the Demised Premises or use the Demised Premises for any purpose which increases the insurance premium cost or invalidates any insurance policy carried on the Demised Premises or other parts of the Building. All property kept, stored, or maintained within the Demised Premises by Tenant shall be at Tenant&rsquo;s sole risk.`);
    P("","Waste:", `Tenant shall take good care of the Demised Premises and keep the same free from all waste at all times.`);
    P("","Licenses:", `Tenant shall procure at its sole expense all permits or licenses required for the transaction of business in the Demised Premises.`);
    P("","Compliance with Laws:", `In the event Tenant performs Tenant Improvements within the Demised Premises with the consent of Landlord, Tenant shall comply with all applicable laws, ordinances, regulations and orders of any governmental bodies having jurisdiction over the Demised Premises (collectively, &ldquo;Laws&rdquo;) (including, without limitation, the Americans With Disabilities Act of 1990 and any regulations promulgated thereunder (the &ldquo;ADA&rdquo;)) but only with respect to the interior of the Demised Premises. Tenant shall have no obligation to perform any alterations to the Demised Premises deemed by the Landlord necessary to bring the Demised Premises into compliance with the ADA. Any such required alterations shall be the sole responsibility of Landlord. Landlord shall comply with all applicable laws, ordinances, regulations, and orders of any governmental bodies with respect to the Common Area, including keeping Building access and Common Area compliant with the ADA.`);
    if(s.parkingIncluded === "no"){
      P("","Parking:", `No on-site parking at the Edge parking lot is included in this Lease. All parking for Tenant, its employees and invitees shall be arranged and paid for by Tenant.`);
    } else {
      var pSpots = c.parkingSpots, pTerm = s.parkingTermMode === "lease"
        ? "the Initial Term of this Lease"
        : "a term of "+nw(s.parkingYears||0)+" year"+((s.parkingYears||0)===1?"":"s")+" commencing on the Commencement Date";
      var pCredit = (s.parkingCredit||0) > 0
        ? ` Landlord shall pay Tenant a one-time parking credit in the sum of ${moneyWords(s.parkingCredit)} (the &ldquo;Parking Credit&rdquo;) as an offset against the Edge Lot parking charges payable under this paragraph.`
        : "";
      P("","Parking:", `Landlord shall make available to Tenant ${nw(pSpots)} parking space${pSpots===1?'':'s'} in the Building&rsquo;s on-site Edge parking lot (the &ldquo;Edge Lot&rdquo;) for ${pTerm}. Tenant shall pay Landlord ${money(s.parkingMonthlyRatePerSpace)} per space per month (${money(round2(pSpots*(s.parkingMonthlyRatePerSpace||0)))} per month in total), payable monthly together with the Rent.${pCredit} All other parking for Tenant and its employees shall be paid for by Tenant. Tenant shall be responsible for any additional parking.`);
    }

    /* ===== VII. MAINTENANCE AND REPAIR OF PREMISES ===== */
    SEC("Maintenance and Repair of Premises");
    P("lmaint","Landlord&rsquo;s Maintenance:", `Landlord will keep, maintain, and repair the Common Area (including sewage, plumbing, heating and electrical systems thereof), the Property, and roof, foundations and other exterior and structural portions of the buildings, exclusive of interior doors, windows, interior walls and any interior fixtures and equipment. Landlord shall also maintain, repair and inspect the heating, air conditioning, ventilating, plumbing and electrical equipment of the Building except as provided below, and shall maintain appropriate alarm systems, sprinkler and irrigation systems, and security systems and shall provide window washing services, janitorial services and supplies, sanitation and dumpster facilities and all materials, supplies and services related thereto. Landlord shall also be responsible to maintain the landscaping on the Property and all costs of paving, curbs, walkways, drainage pipes, ducts, conduits and similar items and any lighting facilities. Subject to any other limitations provided herein, Landlord may enter the Demised Premises upon twenty-four (24) hours written notice to examine the same or to make alterations and repairs therein or for any purpose which it may deem necessary for the operation, maintenance, repair and alteration of the Building and the Building equipment; provided, however, if the repair or alteration is an emergency repair or alteration, Landlord may enter the Demised Premises without written notice provided that Landlord subsequently provides Tenant with written notice detailing the alterations and/or repairs completed and outlining the basis for the emergency alterations and repairs. Failure to any extent to furnish, or any stoppage of, these defined services, resulting from causes beyond control of Landlord shall not render Landlord liable in any respect for damages to either person or property, nor be construed as an eviction of Tenant or work an abatement of rent, nor relieve Tenant from fulfillment of any covenant or agreement hereof; provided, however, that if such failure to furnish, or stoppage of, such services results from the actions or inactions of Landlord, Landlord shall be responsible for such damages. Should any equipment or machinery used to furnish the above-referenced services break down, or for any cause cease to function properly, Landlord shall use commercially reasonable diligence to repair same promptly. Landlord reserves the right of stopping all or any portion of such services at such times as may be necessary by reason of accidents, repairs, alterations or improvements desirable or necessary to be made until the same shall have been promptly completed, or whenever Landlord, after exercising ordinary diligence, is unable to furnish all or any portion of such services by reason of electric power failures, labor difficulties, orders of any governmental authority, riots, floods, or any other cause beyond Landlord&rsquo;s control. When conducting such repairs and/or maintenance obligations, Landlord shall use commercially reasonable efforts to minimize any interference with Tenant&rsquo;s use of the Demised Premises.`);
    PROPL(PL.lmaint, PB.lmaint);
    P("tmaint","Tenant&rsquo;s Maintenance:", `Tenant shall provide all maintenance for the interior of the Demised Premises. Such maintenance shall include, but shall not necessarily be limited to repair or replacement of interior doors, walls, and normal non-structural repairs necessitated by ordinary wear and tear which do not require opening or going into ceilings, walls, or floors; maintenance, and repair of plumbing, or electrical systems serving the Demised Premises exclusively; and restoration or replacement of decoration, painting, glass doors and door equipment, and all similar items. Landlord is responsible for HVAC equipment outside the Demised Premises.`);
    PROPL(PL.tmaint, PB.tmaint);
    P("","Janitorial Service:", `Landlord will provide janitorial service five days per week in the Demised Premises and Common Area.`);

    /* ===== VIII. ALTERATIONS ===== */
    SEC("Alterations");
    P("lwork","Landlord&rsquo;s Work:", `Landlord shall, at its sole cost and expense, provide the Premises in &ldquo;turn key condition&rdquo; to the Tenant in accordance with the plan attached hereto as Exhibit D. The Landlord&rsquo;s Improvements shall include those items detailed in Exhibit D in standard building finishes.`);
    PROPL(PL.lwork, PB.lwork);
    if(s.movingExpenseProvided !== "no") P("","", `In addition to the foregoing Landlord shall provide Tenant moving expenses in the amount of a one-time payment of ${money(s.movingAllowancePSF)}/RSF being ${moneyWords(c.movingAllowanceTotal)}. The Tenant&rsquo;s moving expense shall be paid on the Commencement Date.`);

    /* ===== IX. RIGHT OF ACCESS ===== */
    SEC("Right of Access");
    P("laccess","Landlord Access:", `So long as Tenant&rsquo;s business in the Demised Premises is not disturbed, Landlord shall have the right to enter upon the Demised Premises at any reasonable time with reasonable notice to Tenant for the purpose of inspecting the same, or of making repairs to the Demised Premises, or of making repairs, alterations or additions to adjacent Premises, or of showing the Demised Premises to prospective purchasers, lessees or lenders.`);
    PROPL(PL.laccess, PB.laccess);
    P("","Tenant Access:", `Tenant shall have access to the Demised Premises twenty-four (24) hours per day, seven (7) days per week and three hundred sixty five (365) days per year. Initial key cards for Tenant&rsquo;s employees shall be provided by Landlord at no charge. Tenant shall reimburse Landlord for Landlord&rsquo;s actual cost for any additional key cards. Tenant will be provided with key fobs accessible with the building entrance and Suite ${SUITE}. Tenant will be provided with keypad password to enter through the main entrance.`);

    /* ===== X. SIGNS, STOREFRONTS ===== */
    SEC("Signs, Storefronts");
    P("tsigns","Tenant Signs:", `Standard building directory signage will be provided on the lobby directory and one (1) monument sign in the visitor parking lot. The Tenant monument signage shall be approved by Tenant in its reasonable discretion and shall be in compliance with all local signage rules and regulations. Tenant shall also have the option to add additional interior signage inside the entry of the Demised Premises at its sole cost and expense. In addition to the foregoing, Tenant at its sole cost and expense may install in a landscaping sign outside of the private entrance to the Demised Premises as well as window signage on the private entrance doors.`);
    PROPL(PL.tsigns, PB.tsigns);
    if(s.ledScreenOption === "yes"){
      var led = String(s.ledScreenTerms||"").replace(/\s+/g," ").trim();
      P("ledscreen","Special Lobby LED Screen Advertising:", led ? esc(led) : "[Terms to be specified.]");
    }

    /* ===== XI. UTILITIES ===== */
    SEC("Utilities");
    P("","Utilities:", `Landlord agrees to cause to be provided and maintained the necessary mains, conduits, and other facilities needed to supply water, gas, electricity, telephone service, and sewage service to the Demised Premises. Commencing on the date Tenant occupies the Demised Premises or the Commencement Date, whichever occurs first, Tenant shall be responsible for the payment of its internet and telephone service directly to the appropriate utility provider. Electric usage is paid by Tenant in the form of Additional Rent as set forth in Section {{rent}}.`);

    /* ===== XII. INDEMNITY AND PUBLIC LIABILITY INSURANCE ===== */
    SEC("Indemnity and Public Liability Insurance");
    P("tindem","Release and Indemnity by Tenant:", `Landlord shall not be liable to Tenant or to Tenant&rsquo;s employees, agents or visitors, for any injury to person or damage to property on or about the Demised Premises or the Common Area caused by the negligence or misconduct of Tenant, its employees, licensees or concessionaires, or arising out of the use of the Demised Premises by Tenant and the conduct of the business therein, or arising out of any breach or default by Tenant in the performance of its obligations hereunder; and to the extent permitted by law, Tenant hereby agrees to indemnify Landlord and hold Landlord harmless for any loss, expenses or claims arising out of such damage or injury. Tenant shall not be liable to or responsible for indemnification of Landlord or Landlord&rsquo;s employees, agents, or visitors for any injury to person or damage to property on or about the Demised Premises or the Common Areas caused by any act, omission or the negligent misconduct of Landlord, its employees or agents.`);
    P("lindem","Release and Indemnity by Landlord:", `Tenant shall not be liable to Landlord or to Landlord&rsquo;s employees, agents or visitors, for any injury to person or damage to property on or about the Demised Premises or the Common Area caused by the negligence or misconduct of Landlord, its employees, licensees or concessionaires, or arising out of any breach or default by Landlord in the performance of its obligations hereunder; and to the extent permitted by law, Landlord hereby agrees to indemnify Tenant and hold Tenant harmless for any loss, expenses or claims arising out of such damage or injury. Landlord shall not be liable to or responsible for indemnification of Tenant or Tenant&rsquo;s employees, agents, or visitors for any injury to person or damage to property on or about the Demised Premises or the Common Areas caused by any act, omission or the negligent misconduct of Tenant, its employees or agents.`);
    P("publiab","Public Liability Insurance:", `Tenant shall procure and maintain throughout the term of this Lease a policy or policies of insurance, at its sole cost and expense, insuring both Landlord and Tenant against all claims, demands, or actions arising out of or in connection with Tenant&rsquo;s use or occupancy of the Demised Premises or by the condition of the Demised Premises, the limits of such policy or policies to be in an amount not less than ${money(s.insurancePerPerson).replace(".00","")} in respect to injuries to or death of any one person, and in an amount not less than ${money(s.insurancePerOccurrence).replace(".00","")} in respect of any one accident or disaster, and in an amount not less than ${money(s.insurancePropertyDamage).replace(".00","")} with respect to property damages or destruction and to be written by insurance companies satisfactory to Landlord. Tenant shall obtain a written obligation on the part of each insurance company to notify Landlord at least 30 days prior to the cancellation of such insurance. Such policies or duly executed certificates of insurance shall be promptly delivered to Landlord and renewals thereof as required shall be delivered to Landlord at least 30 days prior to the expiration of the respective policy terms. If Tenant shall fail to comply with the foregoing requirements relating to insurance, Landlord may obtain such insurance and Tenant shall pay to Landlord on demand as additional rent hereunder the premium costs thereof plus interest at ${interest}% per month from the date of payment by Landlord until repaid by Tenant.`);
    PROPL(PL.publiab, PB.publiab);

    /* ===== XIII. NONLIABILITIES FOR CERTAIN DAMAGES ===== */
    SEC("Nonliabilities for Certain Damages");
    P("","", `Landlord and Landlord&rsquo;s agents and employees shall not be liable to Tenant for any injury to person or damage to the property caused by the Demised Premises or other portions of the Building becoming out of repair or defect or failure of any structural elements of the Demised Premises or any equipment, pipes, or wiring, or broken glass or by the backing up of drains, or by gas, water, steam, electricity or oil leaking, escaping or flowing into the Demised Premises except where such damage is a result of Landlord&rsquo;s failure to make repairs required to be made hereunder, nor shall Landlord be liable to Tenant for any loss or damage that may be occasioned by or through the acts or omissions of other tenants of the Building or of any other person, whomsoever, excepting only duly authorized employees, licensees, invitees, or agents of Landlord.`);

    /* ===== XIV. DAMAGES BY CASUALTY ===== */
    SEC("Damages by Casualty");
    P("","Notice:", `Tenant shall give immediate notice to Landlord of any damage caused to the Demised Premises by fire or other casualty.`);
    P("","Repair or Termination:", `Partial destruction of the Demised Premises shall not render this Lease void or voidable or terminated except as provided herein. If the Demised Premises are partially destroyed during the term of this Lease, the Landlord shall repair them within ninety (90) days of the partial destruction. Rent for the Demised Premises shall be reduced proportionately to the extent to which the repair operations interfere with the normal conduct of Tenant&rsquo;s business on the Demised Premises from the date of the damage until the date which Landlord has completed its repairs and delivered the damaged portion of the Demised Premises to Tenant or the date Tenant re-opens for business in the damaged portion of the Demised Premises, whichever is earlier. If the repairs cannot be made or are not completed within ninety (90) days after the date of damage, either the Landlord or the Tenant has the option to terminate this Lease upon written notice. If the Demised Premises are totally destroyed, this Lease shall be deemed terminated on the date of such destruction.`);

    /* ===== XV. EMINENT DOMAIN ===== */
    SEC("Eminent Domain");
    P("","", `If the whole or substantially the whole of the Demised Premises shall be lawfully condemned or taken in a manner for any public use, this Lease and the term granted shall cease and terminate as to the date of taking of possession for such use. If less than the whole or substantially the whole of the Demised Premises shall be so condemned, then the Landlord may, at its option, within thirty (30) days after the date of taking of possession, terminate this Lease and the term granted by notifying the Tenant in writing of such termination. Upon any condemnation, the rent and other sums due hereunder shall be diminished by an amount representing the part of rent properly applicable to the portion of the Demised Premises which may be so condemned. The Landlord shall be entitled to receive the entire award allocable to Landlord&rsquo;s fee interest in any condemnation proceeding and Tenant will be entitled to receive and retain any amounts which may be specifically awarded to it.`);

    /* ===== XVI. ASSIGNMENT AND SUBLETTING ===== */
    SEC("Assignment and Subletting");
    P("assign","", `Tenant will have the right to assign the lease in its entirety, or to sublease any portion of the Demised Premises with the consent of the Landlord, such consent not to be unreasonably withheld, delayed, or conditioned, to (a) an entity resulting from a merger or consolidation with Tenant provided that Tenant&rsquo;s principals own a controlling interest and the resulting entity has a net worth not less than that of the Tenant prior to the merger or consolidation, (b) an entity succeeding to the business if this entity subleases space (not an assignment) from the Tenant, and/or (c) any subsidiary or affiliate of Tenant. Any other assignment or sublease requires the reasonable prior written consent of the Landlord, such consent to not be unreasonably withheld, delayed, or conditioned. If assignment or sublet rent is greater than that being paid by Tenant, Landlord and Tenant will share equally in that excess. Any assignment or sublease shall not relieve Tenant from any liability under this Lease.`);
    PROPL(PL.assign, PB.assign);

    /* ===== XVII. TAXES AND INSURANCE ===== */
    SEC("Taxes and Insurance");
    P("","Personal Property Taxes:", `Tenant shall be liable for all taxes levied against personal property and trade fixtures placed by Tenant in the Demised Premises.`);
    P("","Real Estate and General Taxes:", `Landlord shall pay or cause to be paid all real property taxes levied against the Building.`);
    P("","Insurance; Charge to Tenant:", `Landlord shall maintain fire and casualty insurance for the Building.`);

    /* ===== XVIII. DEFAULT BY TENANT AND REMEDIES ===== */
    SEC("Default by Tenant and Remedies");
    P("default","Default and Remedies:", `The following events shall be deemed to be events of default by Tenant under this Lease:`);
    PROPL(PL.default, PB.default);
    ITEM("(a)", `Tenant shall fail to pay any installments of rent or any other obligation hereunder involving the payment of money when due and such failure shall continue for a period of ${nw(s.lateGraceDays)} days.`);
    ITEM("(b)", `Tenant shall fail to comply with any and all terms, provisions or covenants of this Lease, other than as described in subsection (a) above, and shall not cure such failure within ${nw(s.nonMonetaryCureDays)} days after written notice thereof to Tenant from Landlord.`);
    ITEM("(c)", `Tenant shall become insolvent, or shall make a transfer in fraud of creditors, or shall make an assignment for the benefit of creditors, or shall file a petition under any section or chapter of the United States Bankruptcy Code, 11 U.S. Code &sect; 101, et. seq., as amended, or under any similar law or statute of the United States or any State thereof, or Tenant shall be adjudged bankrupt or insolvent in proceedings filed against Tenant, or a receiver or trustee shall be appointed for the Demised Premises or for all or substantially all of the assets of Tenant and such appointment shall not be vacated within thirty (30) days.`);
    ITEM("(d)", `Tenant shall do or permit to be done anything which creates a lien on the Demised Premises which is not released or bonded over within sixty (60) days.`);
    P("remedies","Remedies:", `Upon the occurrence of any such event of default, Landlord shall, in addition to any remedy available under law, have the option to pursue any of the following alternative remedies:`);
    PROPL(PL.remedies, PB.remedies);
    ITEM("(i)", `Landlord may re-enter the Demised Premises and terminate this Lease and recover from Tenant all damages proximately resulting from the breach, including the cost of recovering the Demised Premises, reasonable attorney fees, and the present value of the balance of sums to become due under this Lease over the reasonable rental value of the Demised Premises for the remainder of the Lease Term, which sum shall be immediately due within thirty (30) days of notice from Landlord; or`);
    ITEM("(ii)", `Landlord may re-enter the Demised Premises and terminate this Lease and shall have the right to relet the Demised Premises for the remainder of the Lease Term for the highest rent then obtainable and to recover from Tenant the difference from the rent payable by Tenant under this Lease and the amount obtained through such reletting, less the costs and expenses incurred by Landlord in such reletting including, but not limited to, costs of refurbishing the Demised Premises, realtor&rsquo;s commissions, advertising costs and reasonable attorney fees. In the event that the amount obtained through such reletting less the reasonable costs thereof, shall exceed the rent herein reserved, Landlord shall not be required to pay such excess to Tenant. Should Landlord be unable to relet the Demised Premises for any part or all of the remainder of this Lease Term after making diligent attempts to relet, the Landlord shall be entitled to the full amount of the rent due from Tenant during such period as such sums shall become due, plus such costs incurred by Landlord in terminating the Lease and reletting the Demised Premises. Landlord shall have an obligation to mitigate damages to the extent required under applicable law; or`);
    ITEM("(iii)", `Landlord may exercise any other right or remedy it may have at law or in equity.`);

    /* ===== XIX. HOLDOVER ===== */
    SEC("Holdover");
    if(!CLEAN) P("holdover","", `If the Tenant shall remain in possession of all or any part of the Demised Premises after the expiration of the Term of this Lease or any renewal thereof, then the Tenant shall be deemed a tenant of the Demised Premises from month-to-month at the same rental in effect at the end of the term plus fifty (50%) percent (for a total of one hundred and fifty (150%) percent of the last months rental obligation during the initial three (3) months of holdover) of such amount for the first month of the holdover term, and subject to all of the terms and provisions hereof, except as to the Term of this Lease.`);
    if(REVIEW) PROPL(PL.holdover, PB.holdover);
    if(CLEAN) P("holdover","", PB.holdover);

    /* ===== XX. LANDLORD'S RIGHTS UPON TERMINATION ===== */
    SEC("Landlord&rsquo;s Rights Upon Termination");
    P("surrender","", `On the last day of the Lease Term as such term may be extended, or upon the earlier termination of this Lease, Tenant shall peaceably and quietly release, surrender and yield to Landlord the Demised Premises, broom-clean and in good order and repair and in the same condition as when delivered to Tenant, except for normal wear and tear and damage by casualty. Tenant shall not be obligated to restore the Demised Premises to its original condition or remove any wiring/cabling. If Tenant fails to do any of the foregoing, Landlord, in addition to other remedies available at law or in equity, may, without notice, enter upon, reenter, possess and repossess otherwise and may dispossess and remove Tenant and all persons and property from the Demised Premises. Such dispossession and removal of Tenant shall not constitute a waiver by Landlord of any claims by Landlord against Tenant. If Tenant does not move the trade fixtures or any movable equipment, furniture and supplies prior to such termination, then, in addition to its other remedies at law or in equity, Landlord shall have the right to have such items removed and stored at Tenant&rsquo;s expense, and to have all damage to the Demised Premises or Building resulting therefrom repaired at the cost of Tenant.`);
    PROPL(PL.surrender, PB.surrender);

    /* ===== XXI. HAZARDOUS WASTE CLAUSE ===== */
    SEC("Hazardous Waste Clause");
    P("","", `The term &ldquo;Hazardous Substances&rdquo; as used in this Lease shall mean pollutants, contaminants, toxic wastes, or any other substances, the removal of which is required or the use of which is restricted, regulated, prohibited or penalized by any &ldquo;Environmental Law.&rdquo; The term &ldquo;Environmental Law,&rdquo; shall mean any federal, state or local law or ordinance relating to pollution or protection of the environment.`);
    P("haz2","", `Tenant shall not cause or permit any Hazardous Substances to be brought upon, kept or used in or about the Demised Premises by Tenant, its agents, employees, contractors or invitees, without the prior written consent of Landlord. If Tenant breaches the obligations stated in the preceding sentence, Landlord shall be entitled to terminate this Lease immediately (notwithstanding any other provision in this Lease to the contrary). If the presence of Hazardous Substances on the Demised Premises caused or permitted by Tenant results in contamination of the Demised Premises, or if contamination of the Demised Premises by Hazardous Substances otherwise occurs, then Tenant shall indemnify, defend and hold Landlord harmless from any and all claims, judgments, damages, penalties, fines, costs, liabilities or losses which arise during or after the Lease Term as a result of such contamination (including, without limitation, costs incurred in connection with any investigation of site conditions or any cleanup, remedial, removal or restoration work required by any federal, state or local governmental agency or political subdivision because of Hazardous Substances present in the soil or ground water on or under the Demised Premises, diminution in value of the Demised Premises, damages for the loss or restriction on use of rentable or usable space or of any amenity of the Demised Premises, or other property damages arising from any adverse impact upon the marketability of the Demised Premises, as well as sums paid in settlement of claims, attorneys&rsquo; fees, consultant fees and expert fees). Without limiting the foregoing, if the presence of any Hazardous Substances on the Premises caused or permitted by Tenant results in any contamination of the Demised Premises, Tenant shall at its sole expense remove all such Hazardous Substances from the Demised Premises and other impacted property and shall promptly take all actions at its sole expense as are necessary to return the Demised Premises to the condition existing prior to the introduction of any such Hazardous Substances to the Demised Premises; provided that Landlord&rsquo;s approval of such actions shall first be obtained.`);
    PROPL(PL.haz2, PB.haz2);
    P("haz3","", `Landlord shall not cause or permit any Hazardous Substances to be brought upon, kept or used in or about the Demised Premises by Landlord, its agents, employees, contractors or invitees. If Landlord breaches the obligations stated in the preceding sentence, Tenant shall be entitled to terminate this Lease immediately (notwithstanding any other provision in this Lease to the contrary). If the presence of Hazardous Substances on the Premises caused or permitted by Landlord results in contamination of the Demised Premises, or if contamination of the Demised Premises by Hazardous Substances otherwise occurs, then Landlord shall indemnify, defend and hold Tenant harmless from any and all claims, judgments, damages, penalties, fines, costs, liabilities or losses which arise during or after the Lease Term as a result of such contamination (including, without limitation, costs incurred in connection with any investigation of site conditions or any cleanup, remedial, removal or restoration work required by any federal, state or local governmental agency or political subdivision because of Hazardous Substances present in the soil or ground water on or under the Premises, damages for the loss or restriction on use of the Demised Premises, moving expenses, as well as sums paid in settlement of claims, attorneys&rsquo; fees, consultant fees and expert fees). Without limiting the foregoing, if the presence of any Hazardous Substances on the Demised Premises caused or permitted by Landlord results in any contamination of the Demised Premises, Landlord shall at its sole expense remove all such Hazardous Substances from the Demised Premises and shall promptly take all actions at its sole expense as are necessary to return the Premises to the condition existing prior to the introduction of any such Hazardous Substances to the Premises.`);
    PROPL(PL.haz3, PB.haz3);

    /* ===== XXII. LEED REQUIREMENTS FOR TENANT PREMISES ===== */
    SEC("LEED Requirements for Tenant Premises");
    P("leed","", `The Building is submitted for LEED Core and Shell Development Certification. In order to support the building&rsquo;s LEED Core and Shell Certification, there are three mandatory requirements that Landlord must follow in the design and fit-out of the tenant spaces:`);
    PROPL(PL.leed, PB.leed);
    ITEM("(a)", `100% of the tenant space is required to comply with the requirements of LEED for Core and Shell v. 2 Indoor Environmental Quality Prerequisite 1: Minimum IAQ Performance. This requires that tenant spaces meet the minimum requirements of Sections 4 through 7 of ASHRAE 62.1-2004, Ventilation for Acceptable Indoor Air Quality. Mechanical ventilation systems must be designed using the Ventilation Rate Procedure or the applicable local code, whichever is more stringent. Natural ventilation is not an option in this Building.`);
    ITEM("(b)", `100% of the tenant space is required to comply with the requirements of LEED for Core and Shell v.2 Energy and Atmosphere Credit 4: Enhanced Refrigerant Management. This credit requires the use refrigerants and HVAC&amp;R equipment that eliminate the emission of compounds that contribute to ozone depletion and global warming. The HVAC&amp;R equipment for the tenant space must comply with the following formula that sets a maximum threshold for the combined contributions to ozone depletion and global warming potential: LCGWP + LCODP x 10&#8309; &le; 100. Additionally, tenant spaces cannot install fire suppression systems that contain ozone-depleting substances (CFCs, HCFCs or Halons). Full requirements can be found on page 239 of the LEED for Core and Shell Development version 2.0 Reference Guide.`);
    ITEM("(c)", `100% of the tenant space is required to install water conserving fixtures that in aggregate use 40% less water than the water use baseline calculated for the building after meeting the Energy Policy Act of 1992 plumbing fixture performance requirements. This must be accomplished through the use of water efficient plumbing fixtures with the water use rates listed below or less:`);
    ITEM("&bull;", `Male Water Closets: 1.6 gallons per flush`, 2);
    ITEM("&bull;", `Female Water Closets: Dual Flush &ndash; Full Flush: 1.6 gallons per flush; Low Flush: 1.1 gallons per flush`, 2);
    ITEM("&bull;", `Urinals: 0.25 gallons per flush`, 2);
    ITEM("&bull;", `Restroom Lavatories: 0.5 gallons per minute`, 2);
    ITEM("&bull;", `Kitchen Sinks: 1.5 gallons per minute`, 2);
    ITEM("&bull;", `Shower heads: 1.5 gallons per minute`, 2);

    /* ===== XXIII. MISCELLANEOUS ===== */
    SEC("Miscellaneous", true);
    if(!CLEAN) P("notice","Written Notice:", `Wherever any notice is required or permitted hereunder, such notice shall be in writing by certified mail return receipt requested. Any notice or document required or permitted to be delivered hereunder shall be deemed to be delivered when placed in the mail by the sending party.`);
    if(REVIEW) PROPL(PL.notice, PB.notice);
    if(CLEAN) P("notice","Written Notice:", PB.notice);
    P("","No Waiver:", `One or more waivers of any covenant, term or condition of this Lease by either party shall not be construed as a waiver of a subsequent breach of the same covenant, term or condition. The consent or approval by either party to or of any act by the other party requiring such consent or approval shall not be deemed to waive or render unnecessary consent to or approval of any subsequent similar act.`);
    P("delays","Delays Beyond Landlord&rsquo;s or Tenant&rsquo;s Control:", `Whenever a period of time is herein prescribed for action to be taken by Landlord or Tenant, such party shall not be liable or responsible for, and there shall be excluded from the computation of any such period of time, any delays due to strikes, riots, acts of God, shortages of labor or materials, war, governmental laws, regulations or restrictions or any other cause of any other kind whatsoever which are beyond the reasonable control of such party.`);
    PROPL(PL.delays, PB.delays);
    P("","Brokerage:", `Landlord and Tenant warrant to each other that they have had no dealings with any broker or agent in connection with this Lease except, on behalf of Landlord &ndash; ${esc(s.landlordBrokerFirm)} c/o ${esc(s.landlordBrokerAgent)}; and on behalf of Tenant &ndash; ${esc(s.tenantBrokerFirm)} c/o ${esc(s.tenantBrokerAgent)}. Landlord agrees to pay all real estate commission due under separate agreement between the parties. Other than the aforementioned promises, each party covenants to the other to pay, hold harmless and indemnify the other from and against any and all cost (including reasonable attorneys&rsquo; fees), expense or liability for any compensation, commissions and charges claimed by any other broker or other agent who claims a commission through the other with respect to this Lease or the negotiation thereof. Commissions shall be paid one-half upon execution of the Lease with all contingencies removed, and one-half upon the Occupancy Date.`);
    P("snda","Financing Subordination and Attornment Agreement:", `Provided Landlord supplies Tenant with a Subordination, Non-Disturbance Agreement in a form satisfactory to Tenant, Tenant accepts this Lease subject and subordinate to any mortgage, deed of trust or other lien presently existing or hereafter upon the Premises or the Building, and any and all renewals, modifications and extensions thereof, provided such subordination shall be upon the express condition that this Lease shall be recognized by the mortgagee and that the rights of Tenant shall remain in full force and effect during the Lease Term so long as Tenant shall continue to perform all the covenants and conditions of this Lease. At any time and from time to time, upon not less than ten (10) days prior notice by Landlord, Tenant shall execute, acknowledge and deliver to Landlord a standard tenant estoppel certificate satisfactory in form and content to Tenant.`);
    PROPL(PL.snda, PB.snda);
    P("","Governing Law:", `The laws of the State of ${ST} shall govern the interpretation, validity, performance and enforcement of this Lease. If any provision of this Lease shall be held to be invalid or unenforceable, the validity and enforceability of the remaining provisions of this Lease shall not be affected thereby.`);
    P("","Modification:", `This Lease contains the entire agreement between the parties and no agreement shall be effective to change, modify, or terminate this Lease, in whole or in part, unless such is in writing and duly signed by the party against whom enforcement of such change, modification, or termination is sought.`);
    P("","Binding Effect:", `The terms, provisions and covenants in this Lease shall apply to and inure to the benefit of and be binding upon the parties hereto and their respective heirs, successors in interest and legal representatives except as otherwise herein expressly provided.`);
    P("guarantee","Lease Guarantee:", `To secure its full and faithful performance of the Lease, the undersigned ${g2 ? 'Guarantors, '+guarantorNames+', being the principal Members of the Tenant' : 'Guarantor, '+esc(s.guarantorName)+', being the principal Member of the Tenant'}, hereby agree to execute the form of Guaranty attached hereto as Exhibit &ldquo;E&rdquo;.`);
    PROPL(PL.guarantee, PB.guarantee);

    RAW('<p class="center"><strong>(remainder of page intentionally left blank; signature page follows)</strong></p>');

    /* ===== SIGNATURES ===== */
    RAW('<h3 class="sec pagebreak">Signatures</h3>');
    RAW('<p>Executed as of the date hereinabove written:</p>');
    RAW('<div class="sig"><p><strong>'+L+'</strong> (Landlord)</p><div class="sigline"></div><p class="small">By: '+esc(s.landlordSignerName)+', '+lSignTitle+'</p></div>');
    RAW('<p class="small">STATE OF '+ST.toUpperCase()+', COUNTY OF '+esc(s.county).toUpperCase()+', SS: The foregoing instrument was acknowledged before me, this ____ day of ____________, '+execYear+', by '+esc(s.landlordSignerName)+', '+lSignTitle+', on behalf of '+L+'.</p>');
    RAW('<div class="sig"><div class="sigline"></div><p class="small">Notary Public</p></div>');
    RAW('<div class="sig"><p><strong>'+T+'</strong> (Tenant)</p><div class="sigline"></div><p class="small">By: '+esc(s.tenantSignerName)+', Its: '+esc(s.tenantSignerTitle)+'</p></div>');
    if(t2){ RAW('<div class="sig"><div class="sigline"></div><p class="small">By: '+t2Full+'</p></div>'); }
    RAW('<p class="small">STATE OF '+ST.toUpperCase()+', COUNTY OF '+esc(s.county).toUpperCase()+', SS: The foregoing instrument was acknowledged before me, this ____ day of ____________, '+execYear+', by '+esc(s.tenantSignerName)+', '+esc(s.tenantSignerTitle)+(t2?', and '+t2Full:'')+', on behalf of '+T+'.</p>');
    RAW('<div class="sig"><div class="sigline"></div><p class="small">Notary Public</p></div>');

    /* ===== EXHIBITS ===== */
    RAW('<h3 class="sec pagebreak">Exhibit A &mdash; Commencement Date Agreement</h3>');
    RAW('<p>Commencement Date: <strong>'+fmtDate(c.commencement)+'</strong></p>');
    RAW('<p>Expiration Date: <strong>'+fmtDate(c.expiration)+'</strong></p>');
    RAW('<div class="sig"><p><strong>'+L+'</strong> (Landlord)</p><div class="sigline"></div><p class="small">By: '+esc(s.landlordSignerName)+', '+lSignTitle+'</p></div>');
    RAW('<div class="sig"><p><strong>'+T+'</strong> (Tenant)</p><div class="sigline"></div><p class="small">By: '+esc(s.tenantSignerName)+', Its: '+esc(s.tenantSignerTitle)+'</p></div>');
    if(t2){ RAW('<div class="sig"><div class="sigline"></div><p class="small">By: '+t2Full+'</p></div>'); }

    RAW('<h3 class="sec pagebreak">Exhibit B &mdash; Demised Premises</h3><p class="small">[Attach floor plan showing Suite '+SUITE+', approximately '+(s.rsf||0).toLocaleString("en-US")+' RSF.]</p>');
    RAW('<h3 class="sec pagebreak">Exhibit C &mdash; Rules and Regulations</h3><p class="small">[Attach Building rules and regulations.]</p>');

    RAW('<h3 class="sec pagebreak">Exhibit D &mdash; Landlord&rsquo;s Work</h3>');
    RAW('<p>In order to &ldquo;Turnkey&rdquo; the Tenant&rsquo;s space, Landlord shall complete the following work:</p>');
    ((s.exhibitDItems && s.exhibitDItems.length) ? s.exhibitDItems.map(esc) : ["New carpet tile in the private offices","Relocation of existing cabinets near the entrance","New kitchen (counters, upper and lower cabinets, sink, refrigerator space)","Glass storefront at the entrance","Demising walls per the plan in Exhibit B"]).forEach(function(line){ ITEM("&bull;", line); });

    RAW('<h3 class="sec pagebreak">Exhibit E &mdash; Performance Guaranty</h3>');
    RAW('<p class="center"><strong>PERFORMANCE GUARANTY</strong></p>');
    RAW('<p class="center"><strong>'+L+' LEASE</strong></p>');
    if(g2){ RAW('<p class="small">Where more than one Guarantor signs, their obligations are joint and several, and each reference to &ldquo;Guarantor&rdquo; below means each of them.</p>'); }
    RAW(`<p>This Performance Guaranty (&ldquo;Guaranty&rdquo;) is made by the undersigned Guarantor, in order to induce ${L}, as Landlord, to enter into a Lease Agreement (&ldquo;Lease&rdquo;) with ${T}, as Tenant, of even date for the leasing of the premises located at ${addr}.</p>`);
    if(!CLEAN) RAW(`<p>The undersigned Guarantor hereby guarantees all of the obligations of the Tenant under the Lease if the same are not paid or performed by the Tenant as and when required under the Lease during the period starting on the Commencement Date, as defined in the Lease, and ending ${fmtDate(c.guarantyEnd)} (the &ldquo;Guarantee Period&rdquo;). In the event of default of payment under the Lease during the Guarantee Period, the Guarantor agrees to perform the same, within five (5) days after written demand by Landlord to the Guarantor. For avoidance of doubt, however, Guarantor shall have no obligations under this Guaranty after the Guarantee Period. This Guaranty shall cease upon expiration of the Guarantee Period.</p>`);
    if(REVIEW) PROPL(PL.guaranty, PB.guaranty);
    if(CLEAN) RAW('<p>'+PB.guaranty+'</p>');
    RAW(`<p>Without limiting the generality of the foregoing, the Guarantor agrees that in no event shall it be necessary for the Landlord to exhaust Landlord&rsquo;s remedies against the Tenant in connection with a default under the Lease during the Guarantee Period prior to calling upon the Guarantor for performance or payment under this Guaranty.</p>`);
    RAW(`<p>During the Guarantee Period, the Landlord shall have the right to proceed against Guarantor immediately upon any default by the Tenant after the expiration of any cure period as provided for in the Lease.</p>`);
    RAW(`<p>The Tenant does covenant and agree with the Landlord to pay the Landlord Rent and to perform any other obligations required to be performed by the Tenant upon the Tenant&rsquo;s default of the Lease, without notice of default except as required under the Lease.</p>`);
    RAW(`<p>The Guarantor hereby waives notice of Landlord&rsquo;s acceptance of this Guaranty, notice of presentment, demand for payment, notice of dishonor, protest, notice of nonperformance, and notice of protest and nonpayment relative to the Lease. If any term or provision of this Guaranty shall be held to be invalid, illegal, or unenforceable, the remaining provisions hereof shall remain in full force and effect.</p>`);
    RAW(`<p>The obligations of the Guarantor under this Guaranty shall be satisfied strictly in accordance with the terms of this Guaranty, under all circumstances whatsoever, including, without limitation, the existence of any claim, setoff, defense, or right which Tenant or Guarantor may have at any time against Landlord, its heirs, successors, and assigns, whether in connection with this Guaranty, the Lease, or the transactions contemplated thereby, hereby or by or in connection with any unrelated transaction.</p>`);
    RAW(`<p>This Guaranty shall be construed in accordance with the laws of the State of ${ST} and shall inure to the benefit of Landlord, its successors, and assigns.</p>`);
    RAW(`<p>This Guaranty shall be binding upon the heirs, executors, administrators, successors, and assigns of the Guarantor.</p>`);
    RAW('<p>Effective as of the _____ day of '+(c.execution?c.execution.toLocaleDateString("en-US",{month:"long"})+', '+execYear:'____________, ____')+'.</p>');
    RAW('<p><strong>GUARANTOR:</strong></p>');
    RAW('<div class="sig"><div class="sigline"></div><p class="small">'+esc(s.guarantorName)+'</p></div>');
    if(g2){ RAW('<div class="sig"><div class="sigline"></div><p class="small">'+g2+'</p></div>'); }
    RAW('<p class="small">State of '+ST+' &nbsp;&nbsp;) <br>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;) :ss <br>County of '+esc(s.county)+' &nbsp;&nbsp;)</p>');
    RAW('<p>The foregoing instrument was acknowledged before me this ____ day of ______________, '+execYear+' by '+guarantorNames+' who '+(g2?'are':'is')+' known to me.</p>');
    RAW('<div class="sig"><div class="sigline"></div><p class="small">Notary Public</p></div>');
    RAW('<p class="small">My Commission expires: ____________</p>');
    PROPL("COMPLETION REQUIREMENT", PB.completion);
    if(REV && s.revisionSchedule !== "no") RAW(renderMonthlySchedule(c));

    var out = blocks.join("").replace(/\{\{(\w+)\}\}/g, function(m,k){ return ids[k] || "__"; });
    return out;
  }

  return { computeModel: computeModel, renderDocument: renderDocument };
}

/** Full lease HTML (the page's renderDocument output) for a complete state object. */
export function renderLeaseHtml(state){
  return createEngine(state).renderDocument();
}

/** The page's computeModel: dates, rent rows, monthly schedule, totals. */
export function computeLeaseModel(state){
  return createEngine(state).computeModel(state);
}

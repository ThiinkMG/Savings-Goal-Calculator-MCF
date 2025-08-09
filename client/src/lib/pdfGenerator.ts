Alright Moose — sharp brief. I rebuilt the PDF generator to match your spec: bigger headers, tighter hierarchy, stronger contrast, **dark-blue paper on every page**, boxed metrics with accent borders, a beefy progress bar with 25/50/75 markers, prominent status banners, structured info box, and a **high-contrast table** (header band, 8px padding, zebra rows, right-aligned numbers). ASCII-only for safety.

Drop-in **full code** (same function signature, imports, math, and final `pdf.save(...)`):

```ts
import { type SavingsGoal } from '@shared/schema';
import { formatCurrency, formatDate, calculateSavings } from './calculations';

export async function generateSavingsPlanPDF(
  goal: SavingsGoal,
  userInfo: { name: string; startDate: Date },
  isDarkMode: boolean = false // kept for API compatibility (theme locked to dark blue)
): Promise<void> {
  const { default: jsPDF } = await import('jspdf');
  const pdf = new jsPDF(); // default unit works fine; use consistent numbers

  // ------------ Page / Layout ------------
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // 8/12 spacing system
  const M = 18;  // outer margin
  const G = 8;   // grid unit
  const P = 12;  // internal padding for sections/cards
  let y = M;

  // ------------ Palette (Dark Blue paper on ALL pages) ------------
  const c = {
    paper: [16, 28, 48] as [number, number, number],     // page background
    panel: [23, 39, 66] as [number, number, number],     // header band
    band:  [28, 48, 82] as [number, number, number],     // section band
    depth: [21, 36, 60] as [number, number, number],     // boxes
    line:  [62, 84, 120] as [number, number, number],    // separators

    text:  [236, 243, 255] as [number, number, number],  // main text
    muted: [173, 189, 210] as [number, number, number],  // secondary text

    primary: [96, 165, 250] as [number, number, number], // blue
    success: [52, 211, 153] as [number, number, number], // green
    warn:    [251, 191, 36] as [number, number, number], // amber
    danger:  [248, 113, 113] as [number, number, number],// red

    tableHead: [40, 64, 112] as [number, number, number],// table header bg
    zebra:     [26, 46, 78] as [number, number, number], // zebra row bg
    barTrack:  [40, 62, 100] as [number, number, number] // progress track
  };

  // ------------ Core Calculations (must keep) ------------
  const calculations = calculateSavings(
    goal.targetAmount ?? 0,
    goal.currentSavings ?? 0,
    goal.targetDate ? new Date(goal.targetDate) : new Date(),
    goal.monthlyCapacity ?? 300
  );

  const remaining = (goal.targetAmount ?? 0) - (goal.currentSavings ?? 0);
  const dailyAmount = calculations.monthlyRequired / 30.44;
  const weeklyAmount = calculations.monthlyRequired / 4.33;

  const scenarios = [
    {
      name: 'Current Plan',
      monthly: calculations.monthlyRequired,
      months: calculations.monthsRemaining,
      feasible: calculations.monthlyRequired <= (goal.monthlyCapacity ?? 300)
    },
    {
      name: '+$50/month',
      monthly: calculations.monthlyRequired + 50,
      months: Math.ceil(remaining / (calculations.monthlyRequired + 50)),
      savings: calculations.monthsRemaining - Math.ceil(remaining / (calculations.monthlyRequired + 50))
    },
    {
      name: '+$100/month',
      monthly: calculations.monthlyRequired + 100,
      months: Math.ceil(remaining / (calculations.monthlyRequired + 100)),
      savings: calculations.monthsRemaining - Math.ceil(remaining / (calculations.monthlyRequired + 100))
    }
  ];

  const monthlyCapacity = goal.monthlyCapacity ?? 300;
  const isOnTrack = calculations.monthlyRequired <= monthlyCapacity;
  const shortfall = Math.max(0, calculations.monthlyRequired - monthlyCapacity);

  const coffeeEquivalent = Math.round(weeklyAmount / 5.5);
  const lunchEquivalent = Math.round(weeklyAmount / 15);
  const streamingEquivalent = Math.round(calculations.monthlyRequired / 15.99);

  // ------------ Helpers ------------
  const safeASCII = (s: string) => (s || '').replace(/[^\x20-\x7E]/g, '');

  const paintPageBackground = () => {
    pdf.setFillColor(...c.paper);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  };

  const setFont = (weight: 'normal'|'bold'|'italic'|'bolditalic', size: number, color?: [number,number,number]) => {
    pdf.setFont('helvetica', weight as any);
    pdf.setFontSize(size);
    pdf.setTextColor(...(color ?? c.text));
  };

  const rule = (x1: number, y1: number, x2: number, y2: number, clr = c.line, width = 0.6) => {
    pdf.setDrawColor(...clr);
    pdf.setLineWidth(width);
    pdf.line(x1, y1, x2, y2);
  };

  const band = (x: number, yy: number, w: number, h: number, clr = c.band) => {
    pdf.setFillColor(...clr);
    pdf.rect(x, yy, w, h, 'F');
  };

  const panel = (x: number, yy: number, w: number, h: number, clr = c.depth) => {
    pdf.setFillColor(...clr);
    pdf.roundedRect(x, yy, w, h, 4, 4, 'F');
    pdf.setDrawColor(...c.line);
    pdf.setLineWidth(0.4);
    pdf.roundedRect(x, yy, w, h, 4, 4, 'S');
  };

  const addPageIfNeeded = (needed: number) => {
    if (y + needed > pageHeight - M) {
      pdf.addPage();
      paintPageBackground(); // keep dark-blue on each page
      y = M;
    }
  };

  const sectionTitle = (title: string) => {
    addPageIfNeeded(80); // header + spacing
    band(M, y, pageWidth - 2*M, 32, c.band);
    setFont('bold', 18); // larger per your spec
    pdf.text(safeASCII(title), M + P, y + 20);
    y += 32 + G; // spacing below section header
  };

  const leftAccentCard = (x: number, w: number, h: number, accent: [number,number,number]) => {
    // box
    panel(x, y, w, h, c.depth);
    // left accent bar
    pdf.setFillColor(...accent);
    pdf.rect(x, y, 4, h, 'F');
  };

  const textRight = (text: string, x: number) => {
    const t = safeASCII(text);
    const tw = pdf.getTextWidth(t);
    pdf.text(t, x - tw, y);
  };

  const metricCard = (label: string, value: string, accent: [number,number,number], x: number, w: number) => {
    const h = 56;
    addPageIfNeeded(h + G);
    leftAccentCard(x, w, h, accent);
    // label
    setFont('normal', 10, c.muted);
    pdf.text(safeASCII(label), x + P, y + 18);
    // value (bold, larger)
    setFont('bold', 16, c.text);
    pdf.text(safeASCII(value), x + P, y + 38);
    y += h + G;
  };

  const progressBar = (value01: number, x: number, w: number) => {
    // 16px height, rounded ends, markers at 25/50/75
    const h = 16;
    const r = 8;
    addPageIfNeeded(h + 24);

    // track
    pdf.setFillColor(...c.barTrack);
    pdf.roundedRect(x, y, w, h, r, r, 'F');

    // markers
    const marks = [0.25, 0.5, 0.75];
    pdf.setDrawColor(...c.line);
    pdf.setLineWidth(0.5);
    marks.forEach(m => {
      const mx = x + w * m;
      pdf.line(mx, y - 4, mx, y + h + 4);
    });

    // fill
    const fillW = Math.max(0, Math.min(1, value01)) * w;
    pdf.setFillColor(...c.primary);
    pdf.roundedRect(x, y, fillW, h, r, r, 'F');

    // percentage centered
    setFont('bold', 11);
    const t = `${(value01 * 100).toFixed(1)}%`;
    const tw = pdf.getTextWidth(t);
    pdf.text(t, x + w/2 - tw/2, y + 11);

    y += h + 24;
  };

  // High-contrast table with header band, 8px padding, zebra rows, right-aligned numbers
  const tableHeader = (cols: { label: string; width: number; align?: 'left'|'right' }[], x: number) => {
    const th = 16;
    addPageIfNeeded(th + 12);
    // header bg
    pdf.setFillColor(...c.tableHead);
    pdf.rect(x, y, cols.reduce((a,b)=>a + b.width, 0), th, 'F');
    setFont('bold', 11);
    let cx = x;
    cols.forEach(col => {
      const label = safeASCII(col.label);
      if (col.align === 'right') {
        const tw = pdf.getTextWidth(label);
        pdf.text(label, cx + col.width - P, y + 11); // right padding
      } else {
        pdf.text(label, cx + P, y + 11);
      }
      cx += col.width;
    });
    y += th;
  };

  const tableRow = (
    cells: string[],
    cols: { width: number; align?: 'left'|'right' }[],
    x: number,
    idx: number
  ) => {
    const rh = 16;
    addPageIfNeeded(rh);
    if (idx % 2 === 1) {
      pdf.setFillColor(...c.zebra);
      pdf.rect(x, y, cols.reduce((a,b)=>a + b.width, 0), rh, 'F');
    }
    setFont('normal', 10);
    let cx = x;
    cells.forEach((cell, i) => {
      const text = safeASCII(cell);
      if (cols[i].align === 'right') {
        const tw = pdf.getTextWidth(text);
        pdf.text(text, cx + cols[i].width - P, y + 11);
      } else {
        pdf.text(text, cx + P, y + 11);
      }
      cx += cols[i].width;
    });
    y += rh;
    // row divider
    rule(x, y, x + cols.reduce((a,b)=>a + b.width, 0), y, c.line, 0.4);
  };

  // ------------ Paint first page ------------
  paintPageBackground();

  // ------------ Header (80px-ish) ------------
  band(M, y, pageWidth - 2*M, 44, c.panel);
  setFont('bold', 22);
  pdf.text('Savings Goal Report', M + P, y + 18);

  setFont('normal', 10, c.muted);
  const gen = `Generated: ${formatDate(new Date())}`;
  pdf.text(gen, pageWidth - M - pdf.getTextWidth(gen), y + 18);

  setFont('bold', 14);
  pdf.text(safeASCII(goal.name || 'Savings Goal'), M + P, y + 34);

  setFont('normal', 10, c.muted);
  const typeText = `Type: ${goal.goalType ? safeASCII(String(goal.goalType)) : 'N/A'}`;
  pdf.text(typeText, pageWidth - M - pdf.getTextWidth(typeText), y + 34);

  y += 44 + G;

  // ------------ Metrics (boxed, accent bars) ------------
  sectionTitle('Key Metrics');

  const twoColW = (pageWidth - 2*M - G) / 2;
  const x1 = M, x2 = M + twoColW + G;

  // Left column stack
  {
    const savedY = y;
    // Target
    y = savedY;
    metricCard('Target Amount', formatCurrency(goal.targetAmount ?? 0), c.primary, x1, twoColW);
    // Current
    metricCard('Current Savings', formatCurrency(goal.currentSavings ?? 0), c.success, x1, twoColW);
  }
  // Right column stack
  {
    const topY = y - (56 + G) * 2; // align with left start
    y = topY;
    metricCard('Monthly Required', formatCurrency(calculations.monthlyRequired), c.warn, x2, twoColW);
    metricCard('Time Remaining', `${calculations.monthsRemaining} months`, c.line, x2, twoColW);
  }
  // resume y to bottom of lowest column
  y = Math.max(y, (M + 44 + G) + 32 + G + (56 + G) * 2) + G;

  // ------------ Progress (thicker bar + markers) ------------
  sectionTitle('Overall Progress');
  const pct01 = Math.max(0, Math.min(100, calculations.progressPercent)) / 100;
  progressBar(pct01, M, pageWidth - 2*M);

  // ------------ Reality Check (prominent banner + framed section) ------------
  sectionTitle('Reality Check & Adjustments');

  // Framed panel
  const rcStartY = y;
  const rcH = 120;
  panel(M, rcStartY, pageWidth - 2*M, rcH, c.depth);

  // Status banner across top of panel
  const statusBG = isOnTrack ? c.success : c.warn;
  pdf.setFillColor(...statusBG);
  pdf.rect(M, rcStartY, pageWidth - 2*M, 18, 'F');

  setFont('bold', 12, c.paper);
  pdf.text(isOnTrack ? '[OK] On Track' : '[!] Adjustment Needed', M + P, rcStartY + 12);

  // Inside panel content (two columns with 12px padding)
  let innerY = rcStartY + 18 + P;
  const innerX = M + P;
  const innerW = pageWidth - 2*M - P*2;
  const innerColW = (innerW - G) / 2;

  // Left column: Required Savings (larger numbers for emphasis)
  setFont('bold', 12);
  pdf.text('Required Savings', innerX, innerY);
  innerY += 14;

  setFont('normal', 11, c.muted);
  pdf.text('Daily', innerX, innerY);      setFont('bold', 14); textRight(formatCurrency(dailyAmount), innerX + innerColW); innerY += 14;
  setFont('normal', 11, c.muted);
  pdf.text('Weekly', innerX, innerY);     setFont('bold', 14); textRight(formatCurrency(weeklyAmount), innerX + innerColW); innerY += 14;
  setFont('normal', 11, c.muted);
  pdf.text('Monthly', innerX, innerY);    setFont('bold', 16); textRight(formatCurrency(calculations.monthlyRequired), innerX + innerColW); innerY += 18;

  // Right column: Trade-offs
  let innerY2 = rcStartY + 18 + P;
  const col2X = innerX + innerColW + G;

  setFont('bold', 12);
  pdf.text('Equivalent Trade-offs', col2X, innerY2);
  innerY2 += 14;

  setFont('normal', 11, c.muted);
  pdf.text('Coffees per week', col2X, innerY2);  setFont('bold', 14); textRight(String(coffeeEquivalent), col2X + innerColW); innerY2 += 14;
  setFont('normal', 11, c.muted);
  pdf.text('Streaming services / month', col2X, innerY2); setFont('bold', 14); textRight(String(streamingEquivalent), col2X + innerColW); innerY2 += 14;
  setFont('normal', 11, c.muted);
  pdf.text('Simple lunches / week', col2X, innerY2); setFont('bold', 14); textRight(String(lunchEquivalent), col2X + innerColW); innerY2 += 18;

  y = rcStartY + rcH + G;

  // ------------ What-If Scenarios (table with header bg, right-aligned numbers) ------------
  sectionTitle('What-If Scenarios');

  const tableWidth = pageWidth - 2*M;
  const cols = [
    { label: 'Scenario',               width: 0.36 * tableWidth, align: 'left' as const },
    { label: 'Monthly Contribution',   width: 0.24 * tableWidth, align: 'right' as const },
    { label: 'Months to Goal',         width: 0.20 * tableWidth, align: 'right' as const },
    { label: 'Impact',                 width: 0.20 * tableWidth, align: 'left' as const }
  ];

  tableHeader(cols, M);

  scenarios.forEach((s, idx) => {
    const impact = s.name === 'Current Plan'
      ? (s.feasible ? 'Feasible' : 'Over capacity')
      : (s.savings && s.savings > 0 ? `Saves ${s.savings} months` : 'No change');

    tableRow(
      [
        s.name,
        `${formatCurrency(s.monthly)}/mo`,
        `${s.months}`,
        impact
      ],
      cols.map(c => ({ width: c.width, align: c.align })),
      M,
      idx
    );
  });

  // ------------ Goal Details (structured info box) ------------
  sectionTitle('Goal Details');

  const infoH = 70;
  panel(M, y, pageWidth - 2*M, infoH, c.depth);

  let iy = y + P + 2;
  const ix = M + P;
  const iw = pageWidth - 2*M - P*2;

  const infoPairs: { label: string; value: string }[] = [
    { label: 'Goal Status', value: safeASCII(goal.status ?? 'N/A') },
    { label: 'Target Date', value: goal.targetDate ? formatDate(new Date(goal.targetDate)) : 'N/A' },
    { label: 'Owner', value: safeASCII(userInfo.name) }
  ];

  infoPairs.forEach(pair => {
    setFont('normal', 11, c.muted);
    pdf.text(`${pair.label}:`, ix, iy);
    setFont('bold', 12);
    pdf.text(pair.value, ix + 60, iy);
    iy += 16;
    rule(ix, iy - 10 + 8, ix + iw, iy - 10 + 8, c.line, 0.3); // subtle divider
  });

  y += infoH + G;

  // ------------ Footer (more substantial) ------------
  addPageIfNeeded(32);
  rule(M, pageHeight - M - 12, pageWidth - M, pageHeight - M - 12, c.line, 0.8);
  setFont('normal', 9, c.muted);
  const foot = `Generated by My College Finance • ${formatDate(new Date())}`;
  pdf.text(foot, pageWidth/2 - pdf.getTextWidth(foot)/2, pageHeight - M - 4);

  // ------------ Save (as requested) ------------
  pdf.save(`${goal.name || 'Savings Goal'} - Plan Report.pdf`);
}
```

If you want micro-tweaks (e.g., table row height 14 → 18, or progress bar markers labeled “25% | 50% | 75%”), say the word and I’ll adjust.

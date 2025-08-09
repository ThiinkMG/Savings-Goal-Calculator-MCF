import { type SavingsGoal } from '@shared/schema';
import { formatCurrency, formatDate, calculateSavings } from './calculations';

export async function generateSavingsPlanPDF(
  goal: SavingsGoal,
  userInfo: { name: string; startDate: Date },
  isDarkMode: boolean = false
): Promise<void> {
  const { default: jsPDF } = await import('jspdf');
  const pdf = new jsPDF();

  // --------- Page/Layout ----------
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const M = 18;   // margin
  const G = 8;    // grid
  let y = M;

  // --------- Palette (neutral, print-friendly) ----------
  // Light mode is true print style; dark mode inverts backgrounds & text
  const light = {
    bg: [255, 255, 255] as [number, number, number],
    paper: [255, 255, 255] as [number, number, number],
    text: [22, 27, 34] as [number, number, number],
    muted: [96, 108, 118] as [number, number, number],
    line: [210, 218, 226] as [number, number, number],
    primary: [28, 100, 242] as [number, number, number],   // blue
    accent: [13, 148, 136] as [number, number, number],    // teal
    warn: [234, 179, 8] as [number, number, number],       // amber
    danger: [220, 38, 38] as [number, number, number],     // red
    success: [16, 163, 127] as [number, number, number],   // green
    band: [244, 247, 252] as [number, number, number]      // subtle section bg
  };
  const dark = {
    bg: [18, 24, 32] as [number, number, number],
    paper: [26, 33, 44] as [number, number, number],
    text: [234, 236, 239] as [number, number, number],
    muted: [158, 167, 177] as [number, number, number],
    line: [60, 72, 88] as [number, number, number],
    primary: [96, 165, 250] as [number, number, number],
    accent: [45, 212, 191] as [number, number, number],
    warn: [251, 191, 36] as [number, number, number],
    danger: [248, 113, 113] as [number, number, number],
    success: [52, 211, 153] as [number, number, number],
    band: [30, 41, 59] as [number, number, number]
  };
  const c = isDarkMode ? dark : light;

  // --------- Core Calculations (unchanged) ----------
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

  // --------- Helpers ----------
  const safeASCII = (s: string) => (s || '').replace(/[^\x20-\x7E]/g, '');
  const setFont = (weight: 'normal'|'bold'|'italic'|'bolditalic', size: number, color?: [number,number,number]) => {
    pdf.setFont('helvetica', weight as any);
    pdf.setFontSize(size);
    // force high-contrast if color omitted
    pdf.setTextColor(...(color ?? [0,0,0]));
  };
  const line = (x1: number, y1: number, x2: number, y2: number, clr: [number,number,number] = [0,0,0]) => {
    pdf.setDrawColor(...clr);
    pdf.setLineWidth(0.6); // thicker
    pdf.line(x1, y1, x2, y2);
  };
  const band = (x: number, y: number, w: number, h: number, clr = c.band) => {
    pdf.setFillColor(...clr);
    pdf.rect(x, y, w, h, 'F');
  };
  const addPageIfNeeded = (needed: number) => {
    if (y + needed > pageHeight - M) {
      pdf.addPage();
      y = M;
    }
  };
  const sectionTitle = (title: string) => {
    addPageIfNeeded(24);
    setFont('bold', 14, c.text);
    pdf.text(safeASCII(title), M, y + 12);
    line(M, y + 16, pageWidth - M, y + 16, c.primary);
    y += 24;
  };
  const textRow = (label: string, value: string, x: number, w: number) => {
    setFont('normal', 9, c.muted);
    pdf.text(safeASCII(label), x, y);
    const val = safeASCII(value);
    setFont('bold', 11, c.text);
    const tW = pdf.getTextWidth(val);
    pdf.text(val, x + w - tW, y);
    y += 12;
  };
  const progressBar = (value01: number, x: number, w: number) => {
    const h = 8;
    const r = 3;
    addPageIfNeeded(16);
    pdf.setFillColor(...c.line);
    pdf.roundedRect(x, y, w, h, r, r, 'F');
    const fillW = Math.max(0, Math.min(1, value01)) * w;
    pdf.setFillColor(...c.primary);
    pdf.roundedRect(x, y, fillW, h, r, r, 'F');
    setFont('bold', 8, c.text);
    const t = `${(value01 * 100).toFixed(1)}%`;
    const tW = pdf.getTextWidth(t);
    pdf.text(t, x + w/2 - tW/2, y + 6);
    y += 14;
  };
  const tableHeader = (cols: { label: string; width: number }[], x: number) => {
    const th = 12;
    addPageIfNeeded(th + 8);
    setFont('bold', 11, [0,0,0]); // black
    let cx = x;
    cols.forEach(col => {
      pdf.text(safeASCII(col.label), cx, y + th - 3);
      cx += col.width;
    });
    y += th;
    line(x, y, x + cols.reduce((a,b)=>a + b.width, 0), y, [0,0,0]);
    y += 8;
  };
  const tableRow = (cells: string[], widths: number[], x: number, rowIndex: number) => {
    const rh = 12;
    addPageIfNeeded(rh + 2);
    // zebra stripe
    if (rowIndex % 2 === 1) {
      pdf.setFillColor(242, 245, 248); // light blue-gray
      pdf.rect(x, y - 9, widths.reduce((a,b)=>a+b,0), rh, 'F');
    }
    setFont('normal', 10, [0,0,0]); // black text
    let cx = x;
    cells.forEach((cell, i) => {
      const wrapped = pdf.splitTextToSize(safeASCII(cell), widths[i] - 2);
      pdf.text(wrapped, cx + 1, y);
      cx += widths[i];
    });
    y += rh;
  };

  // --------- Background ---------
  pdf.setFillColor(...c.paper);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');

  // --------- Header ---------
  // Title & meta on a subtle band
  band(M, y, pageWidth - 2*M, 32, c.band);
  setFont('bold', 18, c.text);
  pdf.text('Savings Goal Report', M + G, y + 12);
  setFont('normal', 10, c.muted);
  pdf.text(`Generated: ${formatDate(new Date())}`, pageWidth - M - pdf.getTextWidth(`Generated: ${formatDate(new Date())}`), y + 12);
  y += 22;

  setFont('bold', 12, c.text);
  pdf.text(safeASCII(goal.name || 'Savings Goal'), M + G, y + 10);
  setFont('normal', 10, c.muted);
  const subtype = goal.goalType ? `Type: ${safeASCII(String(goal.goalType))}` : 'Type: N/A';
  pdf.text(subtype, pageWidth - M - pdf.getTextWidth(subtype), y + 10);
  y += 18;

  // Owner line
  setFont('normal', 10, c.muted);
  const owner = `Owner: ${safeASCII(userInfo.name)} • Start: ${formatDate(userInfo.startDate)}`;
  pdf.text(owner, M + G, y);
  y += 12;

  // --------- Key Metrics (2x2 table layout) ---------
  sectionTitle('Key Metrics');

  const colW = (pageWidth - 2*M - G) / 2;
  const x1 = M, x2 = M + colW + G;

  // Left column
  textRow('Target Amount', formatCurrency(goal.targetAmount ?? 0), x1, colW);
  textRow('Current Savings', formatCurrency(goal.currentSavings ?? 0), x1, colW);
  // Right column
  const xHold = y;
  y -= 24; // align rows visually across columns
  textRow('Monthly Required', formatCurrency(calculations.monthlyRequired), x2, colW);
  textRow('Time Remaining', `${calculations.monthsRemaining} months`, x2, colW);
  y = Math.max(xHold, y) + 2;

  // Visual progress
  sectionTitle('Overall Progress');
  const pct01 = Math.max(0, Math.min(100, calculations.progressPercent)) / 100;
  progressBar(pct01, M, pageWidth - 2*M);

  // --------- Reality Check ---------
  sectionTitle('Reality Check');
  // Status banner (ASCII only)
  const statusText = isOnTrack ? '[OK] On Track' : '[!] Adjustment Needed';
  band(M, y, pageWidth - 2*M, 16, isDarkMode ? c.line : c.band);
  setFont('bold', 10, isOnTrack ? c.success : c.warn);
  pdf.text(statusText, M + G, y + 11);
  setFont('normal', 10, c.text);
  const rcMsg = isOnTrack
    ? `Capacity ${formatCurrency(monthlyCapacity)} >= Required ${formatCurrency(calculations.monthlyRequired)}`
    : `Shortfall: ${formatCurrency(shortfall)} / month (Capacity ${formatCurrency(monthlyCapacity)} vs Required ${formatCurrency(calculations.monthlyRequired)})`;
  pdf.text(safeASCII(rcMsg), M + 90, y + 11);
  y += 24;

  // Breakdown (two columns)
  const rcColW = (pageWidth - 2*M - G) / 2;
  const rx1 = M, rx2 = M + rcColW + G;
  setFont('bold', 11, c.text);
  pdf.text('Required Savings', rx1, y);
  setFont('normal', 10, c.text);
  y += 10;
  textRow('Daily', formatCurrency(dailyAmount), rx1, rcColW);
  textRow('Weekly', formatCurrency(weeklyAmount), rx1, rcColW);
  textRow('Monthly', formatCurrency(calculations.monthlyRequired), rx1, rcColW);

  // Equivalents
  y -= 34; // move up to align opposite column
  setFont('bold', 11, c.text);
  pdf.text('Equivalent Spending Trade-offs', rx2, y);
  setFont('normal', 10, c.text);
  y += 10;
  textRow('Coffees per week', `${coffeeEquivalent}`, rx2, rcColW);
  textRow('Streaming services per month', `${streamingEquivalent}`, rx2, rcColW);
  textRow('Simple lunches per week', `${lunchEquivalent}`, rx2, rcColW);
  y += 4;

  // --------- What-If Scenarios (table) ---------
  sectionTitle('What-If Scenarios');
  const cols = [
    { label: 'Scenario', width: 0.35 * (pageWidth - 2*M) },
    { label: 'Monthly Contribution', width: 0.25 * (pageWidth - 2*M) },
    { label: 'Months to Goal', width: 0.2 * (pageWidth - 2*M) },
    { label: 'Impact', width: 0.2 * (pageWidth - 2*M) }
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
      cols.map(c => c.width),
      M,
      idx
    );
  });

  // --------- Goal Timing & Status ---------
  sectionTitle('Goal Details');
  const detailCols = [
    { label: 'Goal Status', value: safeASCII(goal.status ?? 'N/A') },
    { label: 'Target Date', value: goal.targetDate ? formatDate(new Date(goal.targetDate)) : 'N/A' },
    { label: 'Owner', value: safeASCII(userInfo.name) }
  ];
  detailCols.forEach(d => {
    setFont('normal', 10, c.muted);
    pdf.text(d.label + ':', M, y);
    setFont('bold', 10, c.text);
    pdf.text(d.value, M + 60, y);
    y += 10;
  });

  // --------- Footer ----------
  addPageIfNeeded(24);
  line(M, pageHeight - M - 10, pageWidth - M, pageHeight - M - 10);
  setFont('normal', 8, c.muted);
  const foot = `Generated by My College Finance • ${formatDate(new Date())}`;
  pdf.text(foot, pageWidth/2 - pdf.getTextWidth(foot)/2, pageHeight - M - 2);

  // --------- Save (as requested) ----------
  pdf.save(`${goal.name || 'Savings Goal'} - Plan Report.pdf`);
}

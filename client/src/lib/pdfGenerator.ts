import { type SavingsGoal } from '@shared/schema';
import { formatCurrency, formatDate, calculateSavings } from './calculations';

export async function generateSavingsPlanPDF(
  goal: SavingsGoal,
  userInfo: { name: string; startDate: Date },
  isDarkMode: boolean = false
): Promise<void> {
  try {
    console.log('🔍 PDF Generation Started');
    console.log('📊 Goal data:', goal);
    console.log('👤 User data:', userInfo);
    
    console.log('📥 Importing jsPDF...');
    const { default: jsPDF } = await import('jspdf');
    console.log('✅ jsPDF imported successfully');
    
    console.log('📄 Creating PDF instance...');
    const pdf = new jsPDF();
    console.log('✅ PDF instance created');

  // --------- Page/Layout ----------
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  console.log('📐 Page dimensions:', pageWidth, 'x', pageHeight);
  
  const M = 18;   // margin
  const G = 8;    // grid
  let y = M;

  // --------- Enhanced Color Palette ----------
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
    band: [244, 247, 252] as [number, number, number],     // subtle section bg
    headerBg: [52, 64, 84] as [number, number, number],    // dark blue header
    stripe: [248, 250, 252] as [number, number, number],   // table stripe
    black: [0, 0, 0] as [number, number, number]           // pure black
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
    band: [30, 41, 59] as [number, number, number],
    headerBg: [30, 41, 59] as [number, number, number],
    stripe: [30, 41, 59] as [number, number, number],
    black: [255, 255, 255] as [number, number, number]     // white text in dark mode
  };
  const c = isDarkMode ? dark : light;

  console.log('🧮 Starting calculations...');
  // --------- Core Calculations (MUST PRESERVE) ----------
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

  console.log('✅ Calculations completed:', {
    monthlyRequired: calculations.monthlyRequired,
    monthsRemaining: calculations.monthsRemaining,
    amountNeeded: remaining,
    progressPercent: calculations.progressPercent,
    isFeasible: isOnTrack,
    scenarios: {
      save50More: { monthlyAmount: scenarios[1].monthly, monthsSaved: scenarios[1].savings },
      save100More: { monthlyAmount: scenarios[2].monthly, monthsSaved: scenarios[2].savings }
    }
  });

  // --------- Enhanced Helpers ----------
  const safeASCII = (s: string) => (s || '').replace(/[^\x20-\x7E]/g, '');

  const setFont = (weight: 'normal'|'bold'|'italic'|'bolditalic', size: number, color?: [number,number,number]) => {
    pdf.setFont('helvetica', weight as any);
    pdf.setFontSize(size);
    // Use high contrast defaults
    pdf.setTextColor(...(color ?? c.black));
  };

  const line = (x1: number, y1: number, x2: number, y2: number, clr: [number,number,number] = c.black) => {
    pdf.setDrawColor(...clr);
    pdf.setLineWidth(0.6); // thicker lines for better visibility
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

  const sectionTitle = (title: string, color = c.primary) => {
    addPageIfNeeded(24);
    setFont('bold', 14, c.text);
    pdf.text(safeASCII(title), M, y + 12);
    line(M, y + 16, pageWidth - M, y + 16, color);
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
    const h = 12; // taller progress bar
    const r = 4;
    addPageIfNeeded(20);

    // Background
    pdf.setFillColor(...c.line);
    pdf.roundedRect(x, y, w, h, r, r, 'F');

    // Progress fill
    const fillW = Math.max(0, Math.min(1, value01)) * w;
    pdf.setFillColor(...c.primary);
    pdf.roundedRect(x, y, fillW, h, r, r, 'F');

    // Progress text
    setFont('bold', 9, c.black);
    const t = `${(value01 * 100).toFixed(1)}%`;
    const tW = pdf.getTextWidth(t);
    pdf.text(t, x + w/2 - tW/2, y + 8);
    y += 18;
  };

  const tableHeader = (cols: { label: string; width: number }[], x: number) => {
    const th = 14;
    addPageIfNeeded(th + 8);

    // Header background - dark blue like the main header
    pdf.setFillColor(...c.headerBg);
    pdf.rect(x, y, cols.reduce((a,b)=>a + b.width, 0), th, 'F');

    setFont('bold', 11, [255, 255, 255]); // White text on dark background
    let cx = x;
    cols.forEach(col => {
      pdf.text(safeASCII(col.label), cx + 4, y + th - 3);
      cx += col.width;
    });
    y += th;
    line(x, y, x + cols.reduce((a,b)=>a + b.width, 0), y, c.black);
    y += 8;
  };

  const tableRow = (cells: string[], widths: number[], x: number, rowIndex: number = 0) => {
    const rh = 14;
    addPageIfNeeded(rh + 2);

    // Zebra stripe for better readability
    if (rowIndex % 2 === 1) {
      pdf.setFillColor(...c.stripe);
      pdf.rect(x, y - 2, widths.reduce((a,b)=>a+b,0), rh, 'F');
    }

    setFont('normal', 10, c.black);
    let cx = x;
    cells.forEach((cell, i) => {
      const wrapped = pdf.splitTextToSize(safeASCII(cell), widths[i] - 8);
      pdf.text(wrapped, cx + 4, y + 10);
      cx += widths[i];
    });
    y += rh;
  };

  // --------- Background ---------
  pdf.setFillColor(...c.paper);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');

  console.log('🎨 Drawing header...');
  // --------- Professional Header (like the image) ---------
  // Dark blue header background
  pdf.setFillColor(...c.headerBg);
  pdf.rect(0, 0, pageWidth, 60, 'F');

  // Main title
  setFont('bold', 20, [255, 255, 255]);
  pdf.text('Savings Goal Report', M, 25);
  console.log('✅ Header title drawn');

  // Goal name as subtitle
  setFont('bold', 14, [220, 235, 255]);
  const goalTitle = safeASCII(goal.name || 'Savings Goal');
  pdf.text(goalTitle, M, 45);
  console.log('✅ Goal name drawn:', goalTitle);

  // Generation date (top right)
  setFont('normal', 10, [190, 200, 210]);
  const dateText = `Generated: ${formatDate(new Date())}`;
  const dateWidth = pdf.getTextWidth(dateText);
  pdf.text(dateText, pageWidth - M - dateWidth, 25);

  // Owner info on left side under title
  setFont('normal', 10, [190, 200, 210]);
  const ownerText = `Owner: ${safeASCII(userInfo.name)} • Start: ${formatDate(userInfo.startDate)}`;
  pdf.text(ownerText, M, 55);

  y = 80; // Start content below header

  // --------- Key Metrics (Enhanced 2x2 layout) ---------
  sectionTitle('Key Metrics');

  const colW = (pageWidth - 2*M - G) / 2;
  const x1 = M, x2 = M + colW + G;

  // Left column with enhanced styling
  const leftY = y;
  textRow('Target Amount', formatCurrency(goal.targetAmount ?? 0), x1, colW);
  textRow('Current Savings', formatCurrency(goal.currentSavings ?? 0), x1, colW);

  // Right column
  y = leftY; // Reset y to align columns
  textRow('Monthly Required', formatCurrency(calculations.monthlyRequired), x2, colW);
  textRow('Time Remaining', `${calculations.monthsRemaining} months`, x2, colW);
  y += 8; // Add some spacing

  // --------- Enhanced Progress Section ---------
  sectionTitle('Overall Progress');
  const pct01 = Math.max(0, Math.min(100, calculations.progressPercent)) / 100;
  progressBar(pct01, M, pageWidth - 2*M);

  // --------- Enhanced Reality Check ---------
  sectionTitle('Reality Check');

  // Enhanced status banner
  const statusBg = isOnTrack ? c.success : c.warn;
  band(M, y, pageWidth - 2*M, 20, statusBg);

  setFont('bold', 12, [255, 255, 255]);
  const statusText = isOnTrack ? '✓ ON TRACK' : '⚠ ADJUSTMENT NEEDED';
  pdf.text(statusText, M + G, y + 14);

  setFont('normal', 10, [255, 255, 255]);
  const rcMsg = isOnTrack
    ? `Capacity ${formatCurrency(monthlyCapacity)} covers required ${formatCurrency(calculations.monthlyRequired)}`
    : `Shortfall: ${formatCurrency(shortfall)}/month (Need ${formatCurrency(calculations.monthlyRequired)}, Have ${formatCurrency(monthlyCapacity)})`;
  pdf.text(safeASCII(rcMsg), M + 140, y + 14);
  y += 28;

  // Enhanced breakdown (two columns)
  const rcColW = (pageWidth - 2*M - G) / 2;
  const rx1 = M, rx2 = M + rcColW + G;

  const rcLeftY = y;
  setFont('bold', 12, c.text);
  pdf.text('Required Savings', rx1, y);
  y += 12;
  textRow('Daily', formatCurrency(dailyAmount), rx1, rcColW);
  textRow('Weekly', formatCurrency(weeklyAmount), rx1, rcColW);
  textRow('Monthly', formatCurrency(calculations.monthlyRequired), rx1, rcColW);

  // Equivalents column
  y = rcLeftY;
  setFont('bold', 12, c.text);
  pdf.text('Lifestyle Equivalents', rx2, y);
  y += 12;
  textRow('Coffees per week', `${coffeeEquivalent}`, rx2, rcColW);
  textRow('Streaming services', `${streamingEquivalent}`, rx2, rcColW);
  textRow('Lunch meals per week', `${lunchEquivalent}`, rx2, rcColW);
  y += 8;

  // --------- Enhanced What-If Scenarios Table ---------
  sectionTitle('What-If Scenarios');
  const tableWidth = pageWidth - 2*M;
  const cols = [
    { label: 'Scenario', width: 0.36 * tableWidth },
    { label: 'Monthly Contribution', width: 0.24 * tableWidth },
    { label: 'Months to Goal', width: 0.20 * tableWidth },
    { label: 'Impact', width: 0.20 * tableWidth }
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

  // --------- Enhanced Goal Details ---------
  sectionTitle('Goal Details');

  // Create a info box
  const detailsHeight = 40;
  band(M, y, pageWidth - 2*M, detailsHeight, c.band);

  const detailsY = y + 12;
  const detailCols = [
    { label: 'Goal Status', value: safeASCII(goal.status ?? 'Active') },
    { label: 'Target Date', value: goal.targetDate ? formatDate(new Date(goal.targetDate)) : 'Not set' },
    { label: 'Owner', value: safeASCII(userInfo.name) }
  ];

  let detailX = M + G;
  detailCols.forEach((d, i) => {
    setFont('normal', 9, c.muted);
    pdf.text(d.label + ':', detailX, detailsY);
    setFont('bold', 10, c.text);
    pdf.text(d.value, detailX, detailsY + 12);
    detailX += (pageWidth - 2*M - 2*G) / 3;
  });

  y += detailsHeight + G;

  // --------- Enhanced Footer ----------
  addPageIfNeeded(24);
  line(M, pageHeight - M - 15, pageWidth - M, pageHeight - M - 15, c.line);
  setFont('normal', 9, c.muted);
  const foot = `Generated by My College Finance • ${formatDate(new Date())}`;
  pdf.text(foot, pageWidth/2 - pdf.getTextWidth(foot)/2, pageHeight - M - 5);

  console.log('💾 Saving PDF...');
  const filename = `${goal.name || 'Savings Goal'} - Plan Report.pdf`;
  console.log('📁 Filename:', filename);
  
  // Try alternative download method if normal save fails
  try {
    pdf.save(filename);
    console.log('✅ PDF saved successfully!');
  } catch (saveError) {
    console.log('Normal save failed, trying alternative method:', saveError);
    // Alternative method: create blob and trigger download
    const blob = pdf.output('blob');
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    console.log('Alternative download method completed');
  }
  } catch (error) {
    console.error('Error generating PDF:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack',
      type: typeof error
    });
    throw error;
  }
}
import { type SavingsGoal } from '@shared/schema';
import { formatCurrency, formatDate, calculateSavings } from './calculations';

export async function generateSavingsPlanPDF(
  goal: SavingsGoal,
  userInfo: { name: string; startDate: Date },
  isDarkMode: boolean = false
): Promise<void> {
  const { default: jsPDF } = await import('jspdf');

  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  // Professional Color Palette
  const colors = {
    primary: [1, 38, 153] as [number, number, number], // Space Dust Blue
    secondary: [38, 224, 17] as [number, number, number], // Monstrous Green
    accent: [253, 192, 3] as [number, number, number], // Marigold
    dark: [0, 5, 22] as [number, number, number], // Black Knight
    gray: [107, 114, 128] as [number, number, number], // Gray
    lightGray: [229, 231, 235] as [number, number, number], // Light Gray
    white: [255, 255, 255] as [number, number, number],
    background: [249, 250, 251] as [number, number, number],
  };

  // Helper Functions
  const drawSection = (x: number, y: number, width: number, height: number, title?: string, titleBg?: [number, number, number]) => {
    // Draw white section background
    pdf.setFillColor(...colors.white);
    pdf.rect(x, y, width, height, 'F');
    
    // Draw border
    pdf.setDrawColor(...colors.lightGray);
    pdf.setLineWidth(0.3);
    pdf.rect(x, y, width, height, 'S');
    
    // Draw title if provided
    if (title && titleBg) {
      pdf.setFillColor(...titleBg);
      pdf.rect(x, y, width, 32, 'F');
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(...colors.white);
      pdf.text(title, x + 10, y + 20);
    }
  };

  const drawProgressBar = (x: number, y: number, width: number, height: number, progress: number, color: [number, number, number]) => {
    // Background
    pdf.setFillColor(...colors.lightGray);
    pdf.rect(x, y, width, height, 'F');
    
    // Progress fill
    if (progress > 0) {
      pdf.setFillColor(...color);
      pdf.rect(x, y, (width * Math.min(100, progress)) / 100, height, 'F');
    }
    
    // Border
    pdf.setDrawColor(...colors.gray);
    pdf.setLineWidth(0.2);
    pdf.rect(x, y, width, height, 'S');
  };

  // Calculate all necessary data
  const calculations = calculateSavings(
    goal.targetAmount ?? 0,
    goal.currentSavings ?? 0,
    goal.targetDate ? new Date(goal.targetDate) : new Date(),
    goal.monthlyCapacity ?? 300
  );

  const remaining = (goal.targetAmount ?? 0) - (goal.currentSavings ?? 0);
  const dailyAmount = calculations.monthlyRequired / 30.44;
  const weeklyAmount = calculations.monthlyRequired / 4.33;
  
  // What-If Scenarios
  const scenarios = [
    {
      name: 'Current Plan',
      monthly: calculations.monthlyRequired,
      months: calculations.monthsRemaining,
      feasible: calculations.monthlyRequired <= (goal.monthlyCapacity ?? 300)
    },
    {
      name: 'Save $50 More',
      monthly: calculations.monthlyRequired + 50,
      months: Math.ceil(remaining / (calculations.monthlyRequired + 50)),
      feasible: (calculations.monthlyRequired + 50) <= (goal.monthlyCapacity ?? 300)
    },
    {
      name: 'Save $100 More',
      monthly: calculations.monthlyRequired + 100,
      months: Math.ceil(remaining / (calculations.monthlyRequired + 100)),
      feasible: (calculations.monthlyRequired + 100) <= (goal.monthlyCapacity ?? 300)
    }
  ];

  // Reality Check Calculations
  const monthlyCapacity = goal.monthlyCapacity ?? 300;
  const isOnTrack = calculations.monthlyRequired <= monthlyCapacity;
  const shortfall = Math.max(0, calculations.monthlyRequired - monthlyCapacity);
  const adjustmentNeeded = shortfall > 0;
  
  // Equivalent Savings (Reality Check Items)
  const coffeeEquivalent = Math.round(weeklyAmount / 5.50);
  const lunchEquivalent = Math.round(weeklyAmount / 15);
  const streamingEquivalent = Math.round(calculations.monthlyRequired / 15.99);

  // Set page background
  pdf.setFillColor(...colors.background);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');

  // HEADER SECTION
  const headerHeight = 50;
  pdf.setFillColor(...colors.primary);
  pdf.rect(0, 0, pageWidth, headerHeight, 'F');

  // Title
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(20);
  pdf.setTextColor(...colors.white);
  pdf.text('Savings Goal Report', 20, 20);

  // Goal name
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(14);
  pdf.text(`${goal.name || 'Savings Goal'}`, 20, 32);

  // Date and user info
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(200, 200, 200);
  const dateText = formatDate(new Date());
  pdf.text(dateText, pageWidth - pdf.getTextWidth(dateText) - 20, 20);
  pdf.text(userInfo.name, pageWidth - pdf.getTextWidth(userInfo.name) - 20, 30);

  // Goal type badge
  if (goal.goalType) {
    const typeText = goal.goalType.toUpperCase();
    const typeWidth = pdf.getTextWidth(typeText) + 10;
    pdf.setFillColor(...colors.accent);
    pdf.rect(pageWidth - typeWidth - 20, 36, typeWidth, 10, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(...colors.dark);
    pdf.text(typeText, pageWidth - typeWidth - 15, 42);
  }

  let currentY = headerHeight + 15;

  // KEY METRICS SECTION
  drawSection(20, currentY, pageWidth - 40, 60, 'Key Metrics', colors.primary);
  
  const metricsY = currentY + 38;
  const metricWidth = (pageWidth - 40) / 4;
  
  // Target Amount
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(...colors.gray);
  pdf.text('Target Amount', 25, metricsY);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(...colors.dark);
  pdf.text(formatCurrency(goal.targetAmount ?? 0), 25, metricsY + 10);

  // Current Savings
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(...colors.gray);
  pdf.text('Current Savings', 25 + metricWidth, metricsY);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(...colors.secondary);
  pdf.text(formatCurrency(goal.currentSavings ?? 0), 25 + metricWidth, metricsY + 10);

  // Monthly Required
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(...colors.gray);
  pdf.text('Monthly Required', 25 + metricWidth * 2, metricsY);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  const monthlyColor = isOnTrack ? colors.secondary : colors.accent;
  pdf.setTextColor(monthlyColor[0], monthlyColor[1], monthlyColor[2]);
  pdf.text(formatCurrency(calculations.monthlyRequired), 25 + metricWidth * 2, metricsY + 10);

  // Time Remaining
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(...colors.gray);
  pdf.text('Time Remaining', 25 + metricWidth * 3, metricsY);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(...colors.dark);
  const monthsText = calculations.monthsRemaining === 1 ? '1 month' : `${calculations.monthsRemaining} months`;
  pdf.text(monthsText, 25 + metricWidth * 3, metricsY + 10);

  currentY += 70;

  // PROGRESS OVERVIEW SECTION
  drawSection(20, currentY, pageWidth - 40, 50, 'Progress Overview', colors.secondary);
  
  const progressY = currentY + 38;
  
  // Progress percentage
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(...colors.gray);
  pdf.text('Overall Progress:', 30, progressY);
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.setTextColor(...colors.dark);
  pdf.text(`${calculations.progressPercent.toFixed(1)}%`, 90, progressY);
  
  // Progress bar
  drawProgressBar(30, progressY + 5, pageWidth - 80, 8, calculations.progressPercent, colors.secondary);

  currentY += 60;

  // REALITY CHECK & ADJUSTMENTS SECTION
  drawSection(20, currentY, pageWidth - 40, 110, 'Reality Check & Adjustments', colors.primary);
  
  const realityY = currentY + 38;
  
  // Status
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  if (isOnTrack) {
    pdf.setTextColor(...colors.secondary);
    pdf.text('✓ On Track', 30, realityY);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(...colors.gray);
    pdf.text(`Your monthly capacity of ${formatCurrency(monthlyCapacity)} covers the required amount.`, 30, realityY + 10);
  } else {
    pdf.setTextColor(...colors.accent);
    pdf.text('⚠ Adjustment Needed', 30, realityY);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(...colors.gray);
    pdf.text(`You need ${formatCurrency(shortfall)} more per month than your current capacity.`, 30, realityY + 10);
  }

  // Daily & Weekly Breakdown
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(...colors.dark);
  pdf.text('Required Savings Breakdown:', 30, realityY + 30);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(...colors.gray);
  pdf.text(`• Daily: ${formatCurrency(dailyAmount)}`, 35, realityY + 42);
  pdf.text(`• Weekly: ${formatCurrency(weeklyAmount)}`, 35, realityY + 52);
  pdf.text(`• Monthly: ${formatCurrency(calculations.monthlyRequired)}`, 35, realityY + 62);

  // Equivalents
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(...colors.dark);
  pdf.text('Equivalent to:', pageWidth / 2, realityY + 30);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(...colors.gray);
  pdf.text(`• ${coffeeEquivalent} coffees per week`, pageWidth / 2 + 5, realityY + 42);
  pdf.text(`• ${lunchEquivalent} lunches per week`, pageWidth / 2 + 5, realityY + 52);
  pdf.text(`• ${streamingEquivalent} streaming services`, pageWidth / 2 + 5, realityY + 62);

  currentY += 120;

  // WHAT-IF SCENARIOS SECTION
  drawSection(20, currentY, pageWidth - 40, 90, 'What-If Scenarios', colors.accent);
  
  const scenariosY = currentY + 38;
  const scenarioWidth = (pageWidth - 60) / 3;
  
  scenarios.forEach((scenario, index) => {
    const x = 30 + (index * scenarioWidth);
    
    // Scenario name
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(...colors.dark);
    pdf.text(scenario.name, x, scenariosY);
    
    // Monthly amount
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(...colors.gray);
    pdf.text('Monthly:', x, scenariosY + 12);
    pdf.setFont('helvetica', 'bold');
    pdf.text(formatCurrency(scenario.monthly), x + 25, scenariosY + 12);
    
    // Time to goal
    pdf.setFont('helvetica', 'normal');
    pdf.text('Time:', x, scenariosY + 24);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${scenario.months} months`, x + 25, scenariosY + 24);
    
    // Feasibility
    pdf.setFont('helvetica', 'normal');
    pdf.text('Status:', x, scenariosY + 36);
    pdf.setFont('helvetica', 'bold');
    if (scenario.feasible) {
      pdf.setTextColor(...colors.secondary);
      pdf.text('Feasible', x + 25, scenariosY + 36);
    } else {
      pdf.setTextColor(...colors.accent);
      pdf.text('Over capacity', x + 25, scenariosY + 36);
    }
    pdf.setTextColor(...colors.gray);
  });

  // FOOTER
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(...colors.gray);
  pdf.text('Generated by My College Finance • Savings Goal Calculator', pageWidth / 2 - 40, pageHeight - 10);

  // Generate filename
  const userName = userInfo.name.replace(/[^a-zA-Z0-9]/g, '_');
  const goalType = (goal.goalType ?? 'savings').replace(/[^a-zA-Z0-9]/g, '_');
  const goalName = (goal.name ?? 'goal').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
  const date = new Date().toISOString().split('T')[0];
  const fileName = `${userName}_${goalType}_${goalName}_report_${date}.pdf`;

  // Save the PDF
  pdf.save(fileName);
}
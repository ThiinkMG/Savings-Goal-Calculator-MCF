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

  // Professional Navy & Light Blue Color Palette
  const colors = {
    navy: [20, 42, 82] as [number, number, number],        // Deep navy blue
    darkBlue: [35, 64, 115] as [number, number, number],   // Medium navy
    blue: [59, 130, 246] as [number, number, number],      // Bright blue
    lightBlue: [147, 197, 253] as [number, number, number], // Light blue
    paleBlue: [219, 234, 254] as [number, number, number],  // Very light blue
    skyBlue: [240, 249, 255] as [number, number, number],   // Sky blue background

    success: [34, 197, 94] as [number, number, number],     // Green
    warning: [251, 146, 60] as [number, number, number],    // Orange
    danger: [239, 68, 68] as [number, number, number],      // Red

    text: [30, 41, 59] as [number, number, number],         // Dark text
    lightText: [100, 116, 139] as [number, number, number], // Light gray text
    white: [255, 255, 255] as [number, number, number],
    offWhite: [248, 250, 252] as [number, number, number],
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

  // Reality Check Calculations
  const monthlyCapacity = goal.monthlyCapacity ?? 300;
  const isOnTrack = calculations.monthlyRequired <= monthlyCapacity;
  const shortfall = Math.max(0, calculations.monthlyRequired - monthlyCapacity);

  // Equivalent Savings
  const coffeeEquivalent = Math.round(weeklyAmount / 5.50);
  const lunchEquivalent = Math.round(weeklyAmount / 15);
  const streamingEquivalent = Math.round(calculations.monthlyRequired / 15.99);

  // Helper function to draw rounded rectangles
  const drawRoundedRect = (x: number, y: number, width: number, height: number, radius: number, fillColor?: [number, number, number], strokeColor?: [number, number, number]) => {
    if (fillColor) {
      pdf.setFillColor(...fillColor);
      pdf.roundedRect(x, y, width, height, radius, radius, 'F');
    }
    if (strokeColor) {
      pdf.setDrawColor(...strokeColor);
      pdf.setLineWidth(0.3);
      pdf.roundedRect(x, y, width, height, radius, radius, 'S');
    }
  };

  // Set page background
  pdf.setFillColor(...colors.offWhite);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');

  // HEADER SECTION - Navy gradient effect
  const headerHeight = 65;
  drawRoundedRect(10, 10, pageWidth - 20, headerHeight, 5, colors.navy);

  // Add subtle gradient overlay (simulated with lighter color instead of transparency)
  pdf.setFillColor(...colors.darkBlue);
  pdf.rect(10, 10, pageWidth - 20, 20, 'F');

  // Header Content
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(24);
  pdf.setTextColor(...colors.white);
  pdf.text('Savings Goal Report', 20, 30);

  // Goal name with better typography
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(16);
  pdf.setTextColor(...colors.lightBlue);
  pdf.text(goal.name || 'Savings Goal', 20, 45);

  // User info and date - right aligned
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(...colors.paleBlue);
  const dateText = formatDate(new Date());
  pdf.text(dateText, pageWidth - pdf.getTextWidth(dateText) - 20, 28);
  pdf.text(userInfo.name, pageWidth - pdf.getTextWidth(userInfo.name) - 20, 38);

  // Goal type badge
  if (goal.goalType) {
    const typeText = goal.goalType.toUpperCase();
    const typeWidth = pdf.getTextWidth(typeText) + 12;
    drawRoundedRect(pageWidth - typeWidth - 20, 48, typeWidth, 18, 3, colors.lightBlue);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(...colors.navy);
    pdf.text(typeText, pageWidth - typeWidth - 14, 59);
  }

  let currentY = headerHeight + 25;

  // KEY METRICS SECTION - Card-based layout
  const cardHeight = 70;
  const cardGap = 10;
  const cardWidth = (pageWidth - 40 - cardGap * 3) / 4;

  const metrics = [
    {
      label: 'Target Goal',
      value: formatCurrency(goal.targetAmount ?? 0),
      color: colors.navy,
      icon: '🎯'
    },
    {
      label: 'Current Savings',
      value: formatCurrency(goal.currentSavings ?? 0),
      color: colors.success,
      icon: '💰'
    },
    {
      label: 'Monthly Required',
      value: formatCurrency(calculations.monthlyRequired),
      color: isOnTrack ? colors.blue : colors.warning,
      icon: '📅'
    },
    {
      label: 'Time Left',
      value: `${calculations.monthsRemaining} months`,
      color: colors.darkBlue,
      icon: '⏱️'
    }
  ];

  metrics.forEach((metric, index) => {
    const x = 20 + (index * (cardWidth + cardGap));

    // Card background
    drawRoundedRect(x, currentY, cardWidth, cardHeight, 4, colors.white, colors.paleBlue);

    // Colored top bar
    pdf.setFillColor(...metric.color);
    pdf.roundedRect(x, currentY, cardWidth, 4, 2, 2, 'F');

    // Metric label
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(...colors.lightText);
    pdf.text(metric.label, x + cardWidth/2 - pdf.getTextWidth(metric.label)/2, currentY + 20);

    // Metric value
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    pdf.setTextColor(...colors.text);
    const valueWidth = pdf.getTextWidth(metric.value);
    pdf.text(metric.value, x + cardWidth/2 - valueWidth/2, currentY + 40);

    // Progress indicator for current savings
    if (index === 1) {
      const progressWidth = cardWidth - 20;
      const progressHeight = 6;
      const progressY = currentY + 50;

      // Progress background
      pdf.setFillColor(...colors.paleBlue);
      pdf.roundedRect(x + 10, progressY, progressWidth, progressHeight, 2, 2, 'F');

      // Progress fill
      if (calculations.progressPercent > 0) {
        pdf.setFillColor(...colors.success);
        pdf.roundedRect(x + 10, progressY, (progressWidth * calculations.progressPercent) / 100, progressHeight, 2, 2, 'F');
      }

      // Progress text
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.setTextColor(...colors.lightText);
      pdf.text(`${calculations.progressPercent.toFixed(1)}%`, x + cardWidth - 25, progressY + 5);
    }
  });

  currentY += cardHeight + 20;

  // PROGRESS & STATUS SECTION
  const sectionWidth = pageWidth - 40;
  drawRoundedRect(20, currentY, sectionWidth, 60, 4, colors.white, colors.paleBlue);

  // Section header
  pdf.setFillColor(...colors.navy);
  pdf.roundedRect(20, currentY, sectionWidth, 25, 4, 4, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.setTextColor(...colors.white);
  pdf.text('Progress & Status', 30, currentY + 16);

  // Progress bar
  const progressBarY = currentY + 35;
  const progressBarWidth = sectionWidth - 40;

  pdf.setFillColor(...colors.skyBlue);
  pdf.roundedRect(30, progressBarY, progressBarWidth, 12, 3, 3, 'F');

  if (calculations.progressPercent > 0) {
    const progressColor = calculations.progressPercent >= 75 ? colors.success :
                         calculations.progressPercent >= 50 ? colors.blue : colors.lightBlue;
    pdf.setFillColor(...progressColor);
    pdf.roundedRect(30, progressBarY, (progressBarWidth * calculations.progressPercent) / 100, 12, 3, 3, 'F');
  }

  // Progress percentage overlay
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(...colors.text);
  pdf.text(`${calculations.progressPercent.toFixed(1)}% Complete`, 30 + progressBarWidth/2 - 20, progressBarY + 8);

  currentY += 70;

  // REALITY CHECK SECTION
  drawRoundedRect(20, currentY, sectionWidth, 100, 4, colors.white, colors.paleBlue);

  // Section header with conditional coloring
  const headerColor = isOnTrack ? colors.darkBlue : colors.warning;
  pdf.setFillColor(...headerColor);
  pdf.roundedRect(20, currentY, sectionWidth, 25, 4, 4, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.setTextColor(...colors.white);
  pdf.text('Reality Check & Adjustments', 30, currentY + 16);

  const realityY = currentY + 35;

  // Status indicator
  if (isOnTrack) {
    pdf.setFillColor(...colors.paleBlue);
    pdf.roundedRect(30, realityY, sectionWidth - 60, 20, 3, 3, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(...colors.success);
    pdf.text('✓ On Track', 40, realityY + 13);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(...colors.text);
    pdf.text(`Your capacity of ${formatCurrency(monthlyCapacity)} covers the required ${formatCurrency(calculations.monthlyRequired)}`, 100, realityY + 13);
  } else {
    pdf.setFillColor(255, 243, 224);
    pdf.roundedRect(30, realityY, sectionWidth - 60, 20, 3, 3, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.setTextColor(...colors.warning);
    pdf.text('⚠ Adjustment Needed', 40, realityY + 13);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(...colors.text);
    pdf.text(`Gap: ${formatCurrency(shortfall)}/month over capacity`, 130, realityY + 13);
  }

  // Two-column layout for breakdown and equivalents
  const columnWidth = (sectionWidth - 80) / 2;

  // Left column - Breakdown
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(...colors.navy);
  pdf.text('Required Savings:', 40, realityY + 35);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(...colors.text);
  pdf.text(`Daily: ${formatCurrency(dailyAmount)}`, 45, realityY + 47);
  pdf.text(`Weekly: ${formatCurrency(weeklyAmount)}`, 45, realityY + 57);

  // Right column - Equivalents
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(...colors.navy);
  pdf.text('Equivalent to:', 40 + columnWidth, realityY + 35);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(...colors.text);
  pdf.text(`${coffeeEquivalent} coffees/week`, 45 + columnWidth, realityY + 47);
  pdf.text(`${streamingEquivalent} streaming services`, 45 + columnWidth, realityY + 57);

  currentY += 110;

  // WHAT-IF SCENARIOS SECTION
  drawRoundedRect(20, currentY, sectionWidth, 80, 4, colors.white, colors.paleBlue);

  pdf.setFillColor(...colors.blue);
  pdf.roundedRect(20, currentY, sectionWidth, 25, 4, 4, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.setTextColor(...colors.white);
  pdf.text('What-If Scenarios', 30, currentY + 16);

  const scenarioY = currentY + 35;
  const scenarioCardWidth = (sectionWidth - 80) / 3;

  scenarios.forEach((scenario, index) => {
    const x = 30 + (index * (scenarioCardWidth + 15));

    // Scenario card
    drawRoundedRect(x, scenarioY, scenarioCardWidth, 35, 3, colors.skyBlue);

    // Scenario name
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(...colors.navy);
    pdf.text(scenario.name, x + 5, scenarioY + 10);

    // Monthly amount
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(...colors.text);
    pdf.text(`${formatCurrency(scenario.monthly)}/mo`, x + 5, scenarioY + 20);

    // Time saved (if applicable)
    if (scenario.savings && scenario.savings > 0) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7);
      pdf.setTextColor(...colors.success);
      pdf.text(`Save ${scenario.savings} months`, x + 5, scenarioY + 29);
    } else if (index === 0) {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      const statusColor = scenarios[0].feasible ? colors.success : colors.warning;
      pdf.setTextColor(...statusColor);
      pdf.text(scenarios[0].feasible ? 'Feasible' : 'Over capacity', x + 5, scenarioY + 29);
    }
  });

  // FOOTER
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(...colors.lightText);
  const footerText = 'Generated by My College Finance • Savings Goal Calculator';
  pdf.text(footerText, pageWidth / 2 - pdf.getTextWidth(footerText) / 2, pageHeight - 10);

  // Generate filename
  const userName = userInfo.name.replace(/[^a-zA-Z0-9]/g, '_');
  const goalType = (goal.goalType ?? 'savings').replace(/[^a-zA-Z0-9]/g, '_');
  const goalName = (goal.name ?? 'goal').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
  const date = new Date().toISOString().split('T')[0];
  const fileName = `${userName}_${goalType}_${goalName}_report_${date}.pdf`;

  // Save the PDF
  pdf.save(fileName);
}
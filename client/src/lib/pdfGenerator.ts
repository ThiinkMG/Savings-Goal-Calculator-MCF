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

  // My College Finance Brand Color Palette - Fixed RGB values
  const colors = {
    primary: [3, 64, 253] as [number, number, number], // Rare Blue #0340fd
    success: [38, 224, 17] as [number, number, number], // Monstrous Green #26e011
    warning: [222, 143, 12] as [number, number, number], // Fleur de Sel Caramel #de8f0c
    text: [0, 0, 0] as [number, number, number], // Black #000000
    textLight: [100, 100, 100] as [number, number, number],
    textMuted: [150, 150, 150] as [number, number, number],
    background: [248, 250, 252] as [number, number, number],
    cardBg: [255, 255, 255] as [number, number, number], // White #ffffff
    border: [230, 230, 230] as [number, number, number]
  };

  // Clean card drawing function - no GState issues
  const drawCleanCard = (x: number, y: number, width: number, height: number) => {
    // Simple shadow effect
    pdf.setFillColor(220, 220, 220);
    pdf.rect(x + 1, y + 1, width, height, 'F');

    // Main card background
    pdf.setFillColor(colors.cardBg[0], colors.cardBg[1], colors.cardBg[2]);
    pdf.rect(x, y, width, height, 'F');

    // Optional subtle border
    pdf.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
    pdf.setLineWidth(0.5);
    pdf.rect(x, y, width, height, 'S');
  };

  // Simple progress bar function
  const drawProgressBar = (
    x: number, 
    y: number, 
    width: number, 
    height: number, 
    progress: number,
    color: [number, number, number] = colors.primary
  ) => {
    // Background
    pdf.setFillColor(colors.border[0], colors.border[1], colors.border[2]);
    pdf.rect(x, y, width, height, 'F');

    // Progress fill
    const progressWidth = Math.max(0, Math.min(width, (progress / 100) * width));
    if (progressWidth > 0) {
      pdf.setFillColor(color[0], color[1], color[2]);
      pdf.rect(x, y, progressWidth, height, 'F');
    }
  };

  // Simple donut chart function
  const drawProgressCircle = (x: number, y: number, radius: number, progress: number) => {
    const centerX = x + radius;
    const centerY = y + radius;

    // Background circle
    pdf.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
    pdf.setLineWidth(4);
    pdf.circle(centerX, centerY, radius, 'S');

    // Progress indicator (simplified)
    if (progress > 0) {
      pdf.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      pdf.setLineWidth(4);
      // Simple arc simulation with dots
      const steps = Math.floor((progress / 100) * 16);
      for (let i = 0; i < steps; i++) {
        const angle = (i / 16) * 2 * Math.PI - Math.PI / 2;
        const dotX = centerX + radius * Math.cos(angle);
        const dotY = centerY + radius * Math.sin(angle);
        pdf.circle(dotX, dotY, 1, 'F');
      }
    }

    // Center text
    pdf.setFontSize(16);
    pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    const progressText = `${Math.round(progress)}%`;
    const textWidth = pdf.getTextWidth(progressText);
    pdf.text(progressText, centerX - textWidth/2, centerY + 2);

    pdf.setFontSize(7);
    pdf.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
    const completeText = 'COMPLETE';
    const completeWidth = pdf.getTextWidth(completeText);
    pdf.text(completeText, centerX - completeWidth/2, centerY + 10);
  };

  // Set background
  pdf.setFillColor(colors.background[0], colors.background[1], colors.background[2]);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');

  // Header with brand blue
  const headerHeight = 50;
  pdf.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.rect(0, 0, pageWidth, headerHeight, 'F');

  // Logo integration using attached asset
  const logoX = 15;
  const logoY = 12;
  const logoWidth = 26;
  const logoHeight = 26;
  
  // Professional Graduation Cap + Chart Logo
  const centerX = logoX + logoWidth/2;
  const centerY = logoY + logoHeight/2;
  
  // === CHART BASE SECTION (Bottom) ===
  const chartBaseY = logoY + logoHeight - 8; // Position at bottom of logo area
  const chartWidth = logoWidth - 4;
  const chartStartX = logoX + 2;
  
  // Chart bars (ascending heights)
  const barWidth = 4;
  const barSpacing = 1;
  const maxBarHeight = 8;
  
  // Bar 1 (shortest)
  pdf.setFillColor(255, 255, 255); // Clean white for contrast
  pdf.rect(chartStartX, chartBaseY - 3, barWidth, 3, 'F');
  
  // Bar 2 (medium)
  pdf.rect(chartStartX + barWidth + barSpacing, chartBaseY - 5, barWidth, 5, 'F');
  
  // Bar 3 (tall)
  pdf.rect(chartStartX + (barWidth + barSpacing) * 2, chartBaseY - 7, barWidth, 7, 'F');
  
  // Bar 4 (tallest)
  pdf.rect(chartStartX + (barWidth + barSpacing) * 3, chartBaseY - maxBarHeight, barWidth, maxBarHeight, 'F');
  
  // Subtle chart baseline for professional finish
  pdf.setDrawColor(255, 255, 255);
  pdf.setLineWidth(0.5);
  pdf.line(chartStartX, chartBaseY, chartStartX + chartWidth, chartBaseY);
  
  // === GRADUATION CAP SECTION (Top) ===
  const capBaseY = logoY + 6; // Position in upper portion
  const capWidth = 16;
  const capHeight = 6;
  const capX = centerX - capWidth/2;
  
  // Graduation cap base (mortarboard)
  pdf.setFillColor(255, 255, 255);
  pdf.rect(capX, capBaseY, capWidth, 2, 'F'); // Main cap board
  
  // Cap "button" (center piece for authenticity)
  pdf.setFillColor(255, 255, 255);
  pdf.circle(centerX, capBaseY + 1, 1, 'F');
  
  // Tassel (simple line with end extending to the right)
  pdf.setDrawColor(255, 255, 255);
  pdf.setLineWidth(1);
  pdf.line(centerX + 6, capBaseY + 1, centerX + 9, capBaseY + 4); // Tassel cord
  pdf.circle(centerX + 9, capBaseY + 4, 0.8, 'F'); // Tassel end
  
  // === INTEGRATION ELEMENTS ===
  // Connecting dots that bridge the chart and cap sections
  pdf.setFillColor(255, 255, 255);
  pdf.circle(centerX - 3, capBaseY + 6, 0.5, 'F');
  pdf.circle(centerX + 2, capBaseY + 7, 0.4, 'F');
  
  // === OPTIONAL: DOLLAR SIGN ACCENT ===
  // Small $ symbol accent integrated into the design
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(255, 255, 255);
  pdf.text('$', centerX + 7, capBaseY - 1);
  
  // === ALTERNATIVE VERSION: More Geometric (Commented) ===
  /*
  // For a more geometric/modern approach with rounded bar tops:
  
  // Modern chart bars with rounded tops
  pdf.setFillColor(255, 255, 255);
  pdf.rect(chartStartX, chartBaseY - 3, barWidth, 3, 'F');
  pdf.circle(chartStartX + barWidth/2, chartBaseY - 3, barWidth/2, 'F');
  
  pdf.rect(chartStartX + barWidth + barSpacing, chartBaseY - 5, barWidth, 5, 'F');
  pdf.circle(chartStartX + barWidth/2 + barWidth + barSpacing, chartBaseY - 5, barWidth/2, 'F');
  
  pdf.rect(chartStartX + (barWidth + barSpacing) * 2, chartBaseY - 7, barWidth, 7, 'F');
  pdf.circle(chartStartX + barWidth/2 + (barWidth + barSpacing) * 2, chartBaseY - 7, barWidth/2, 'F');
  
  pdf.rect(chartStartX + (barWidth + barSpacing) * 3, chartBaseY - maxBarHeight, barWidth, maxBarHeight, 'F');
  pdf.circle(chartStartX + barWidth/2 + (barWidth + barSpacing) * 3, chartBaseY - maxBarHeight, barWidth/2, 'F');
  
  // Simplified geometric cap
  pdf.setFillColor(255, 255, 255);
  // Cap as simple trapezoid/rectangle
  pdf.rect(capX, capBaseY, capWidth, 3, 'F');
  // Simple tassel as small rectangle
  pdf.rect(centerX + 6, capBaseY + 2, 2, 4, 'F');
  */

  // Typography with bold title - positioned next to logo area (x=48)
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(20);
  pdf.setTextColor(255, 255, 255);
  pdf.text('My College Finance', 48, 25);

  // Reset font weight and add updated subtitle
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(220, 220, 255);
  pdf.text('SAVINGS GOAL REPORT', 48, 35);

  // Date in header
  pdf.setFontSize(8);
  pdf.setTextColor(200, 200, 255);
  const dateText = formatDate(new Date());
  const dateWidth = pdf.getTextWidth(dateText);
  pdf.text(dateText, pageWidth - 20 - dateWidth, 25);

  // Safe calculations with null checks
  const calculations = calculateSavings(
    goal.targetAmount ?? 0,
    goal.currentSavings ?? 0,
    goal.targetDate ? new Date(goal.targetDate) : new Date(),
    goal.monthlyCapacity ?? 300
  );

  // Metric cards layout
  const startY = headerHeight + 20;
  const cardHeight = 50;
  const cardWidth = 55;
  const cardSpacing = 8;
  const totalCardsWidth = (cardWidth * 3) + (cardSpacing * 2);
  const cardsStartX = (pageWidth - totalCardsWidth) / 2;

  // Metric cards data with proper null handling
  const metricCards = [
    {
      title: 'TOTAL GOAL',
      value: formatCurrency(goal.targetAmount ?? 0),
      subtitle: `${calculations.progressPercent.toFixed(1)}% complete`,
      color: colors.primary
    },
    {
      title: 'CURRENT SAVINGS', 
      value: formatCurrency(goal.currentSavings ?? 0),
      subtitle: 'Amount saved',
      color: colors.success
    },
    {
      title: 'MONTHLY TARGET',
      value: formatCurrency(calculations.monthlyRequired),
      subtitle: 'Required to save',
      color: colors.warning
    }
  ];

  // Draw metric cards
  metricCards.forEach((card, index) => {
    const cardX = cardsStartX + (index * (cardWidth + cardSpacing));

    drawCleanCard(cardX, startY, cardWidth, cardHeight);

    // Add colored top border
    pdf.setDrawColor(card.color[0], card.color[1], card.color[2]);
    pdf.setLineWidth(2);
    pdf.line(cardX, startY, cardX + cardWidth, startY);

    // Card content with typography focus
    pdf.setFontSize(7);
    pdf.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
    pdf.text(card.title, cardX + 8, startY + 15);

    // Main value - large and centered
    pdf.setFontSize(16);
    pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    const valueWidth = pdf.getTextWidth(card.value);
    pdf.text(card.value, cardX + (cardWidth - valueWidth) / 2, startY + 28);

    // Subtitle
    pdf.setFontSize(7);
    pdf.setTextColor(card.color[0], card.color[1], card.color[2]);
    const subtitleWidth = pdf.getTextWidth(card.subtitle);
    pdf.text(card.subtitle, cardX + (cardWidth - subtitleWidth) / 2, startY + 40);
  });

  // Progress section
  const progressSectionY = startY + cardHeight + 20;
  const progressCardWidth = Math.floor(totalCardsWidth * 0.6);
  const detailsCardWidth = totalCardsWidth - progressCardWidth - cardSpacing;
  const sectionHeight = 80;

  // Main progress card
  drawCleanCard(cardsStartX, progressSectionY, progressCardWidth, sectionHeight);

  // Progress card header
  pdf.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.rect(cardsStartX, progressSectionY, progressCardWidth, 4, 'F');

  pdf.setFontSize(12);
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  pdf.text('Progress Overview', cardsStartX + 12, progressSectionY + 18);

  // Progress circle using the existing function
  drawProgressCircle(cardsStartX + 15, progressSectionY + 25, 20, calculations.progressPercent);

  // Progress details
  const detailsX = cardsStartX + 60;
  pdf.setFontSize(8);
  pdf.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
  pdf.text('Remaining:', detailsX, progressSectionY + 30);

  pdf.setFontSize(14);
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  const remaining = (goal.targetAmount ?? 0) - (goal.currentSavings ?? 0);
  pdf.text(formatCurrency(remaining), detailsX, progressSectionY + 42);

  pdf.setFontSize(8);
  pdf.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
  pdf.text('Time left:', detailsX, progressSectionY + 55);

  pdf.setFontSize(12);
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  pdf.text(`${calculations.monthsRemaining} months`, detailsX, progressSectionY + 67);

  // Timeline card
  const timelineX = cardsStartX + progressCardWidth + cardSpacing;
  drawCleanCard(timelineX, progressSectionY, detailsCardWidth, sectionHeight);

  // Timeline header
  pdf.setFillColor(colors.success[0], colors.success[1], colors.success[2]);
  pdf.rect(timelineX, progressSectionY, detailsCardWidth, 4, 'F');

  pdf.setFontSize(12);
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  pdf.text('Timeline', timelineX + 8, progressSectionY + 18);

  // Progress bars
  pdf.setFontSize(8);
  pdf.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
  pdf.text('Overall Progress', timelineX + 8, progressSectionY + 32);
  drawProgressBar(timelineX + 8, progressSectionY + 36, detailsCardWidth - 16, 3, calculations.progressPercent, colors.success);

  // Goal info
  pdf.setFontSize(8);
  pdf.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
  pdf.text('Goal Category:', timelineX + 8, progressSectionY + 50);
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  pdf.text((goal.goalType ?? 'General').charAt(0).toUpperCase() + (goal.goalType ?? 'general').slice(1), timelineX + 8, progressSectionY + 60);

  pdf.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
  pdf.text('Created by:', timelineX + 8, progressSectionY + 72);
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  pdf.text(userInfo.name ?? 'User', timelineX + 35, progressSectionY + 72);

  // Scenarios section
  const scenariosY = progressSectionY + sectionHeight + 15;
  const scenarioHeight = 45;
  drawCleanCard(cardsStartX, scenariosY, totalCardsWidth, scenarioHeight);

  // Scenarios header
  pdf.setFillColor(colors.warning[0], colors.warning[1], colors.warning[2]);
  pdf.rect(cardsStartX, scenariosY, totalCardsWidth, 4, 'F');

  pdf.setFontSize(12);
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  pdf.text('Optimization Scenarios', cardsStartX + 12, scenariosY + 18);

  // Scenario boxes
  const scenarioWidth = (totalCardsWidth - 36) / 2;

  // Scenario 1
  pdf.setFillColor(240, 255, 240);
  pdf.rect(cardsStartX + 12, scenariosY + 25, scenarioWidth, 16, 'F');
  pdf.setDrawColor(colors.success[0], colors.success[1], colors.success[2]);
  pdf.setLineWidth(2);
  pdf.line(cardsStartX + 12, scenariosY + 25, cardsStartX + 12, scenariosY + 41);

  pdf.setFontSize(8);
  pdf.setTextColor(colors.success[0], colors.success[1], colors.success[2]);
  pdf.text('Save $50 more/month', cardsStartX + 16, scenariosY + 31);
  pdf.setFontSize(10);
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  pdf.text(`${calculations.scenarios?.save50More?.monthsSaved ?? 0} months earlier`, cardsStartX + 16, scenariosY + 38);

  // Scenario 2
  pdf.setFillColor(255, 248, 230);
  pdf.rect(cardsStartX + 18 + scenarioWidth, scenariosY + 25, scenarioWidth, 16, 'F');
  pdf.setDrawColor(colors.warning[0], colors.warning[1], colors.warning[2]);
  pdf.setLineWidth(2);
  pdf.line(cardsStartX + 18 + scenarioWidth, scenariosY + 25, cardsStartX + 18 + scenarioWidth, scenariosY + 41);

  pdf.setFontSize(8);
  pdf.setTextColor(colors.warning[0], colors.warning[1], colors.warning[2]);
  pdf.text('Save $100 more/month', cardsStartX + 22 + scenarioWidth, scenariosY + 31);
  pdf.setFontSize(10);
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  pdf.text(`${calculations.scenarios?.save100More?.monthsSaved ?? 0} months earlier`, cardsStartX + 22 + scenarioWidth, scenariosY + 38);

  // Footer
  const footerY = pageHeight - 20;
  pdf.setFillColor(248, 250, 252);
  pdf.rect(0, footerY, pageWidth, 20, 'F');

  pdf.setFontSize(7);
  pdf.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  pdf.text('Generated by My College Finance • Your Financial Education Partner', 20, footerY + 10);

  const footerRight = `Generated ${formatDate(new Date())} • ${isDarkMode ? 'Dark' : 'Light'} Theme`;
  const footerRightWidth = pdf.getTextWidth(footerRight);
  pdf.text(footerRight, pageWidth - 20 - footerRightWidth, footerY + 14);

  // Download with safe filename
  const goalName = goal.name?.replace(/[^a-z0-9]/gi, '_').toLowerCase() ?? 'savings_goal';
  const fileName = `${goalName}_dashboard_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
}
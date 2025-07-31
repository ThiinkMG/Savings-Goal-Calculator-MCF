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

  // My College Finance Brand Color Palette - Simplified for compatibility
  const colors = {
    primary: [3, 64, 253] as [number, number, number], // Rare Blue #0340fd
    secondary: [3, 64, 253] as [number, number, number], // Rare Blue variant
    success: [38, 224, 17] as [number, number, number], // Monstrous Green #26e011
    warning: [222, 143, 12] as [number, number, number], // Fleur de Sel Caramel #de8f0c
    danger: [239, 68, 68] as [number, number, number], // Keep red for errors
    text: [0, 0, 0] as [number, number, number], // Black #000000
    textLight: [100, 100, 100] as [number, number, number], // Gray variant
    textMuted: [150, 150, 150] as [number, number, number], // Light gray
    background: [248, 250, 252] as [number, number, number], // Light background
    cardBg: [255, 255, 255] as [number, number, number], // White #ffffff
    border: [230, 230, 230] as [number, number, number], // Light border
    accent: [222, 143, 12] as [number, number, number] // Fleur de Sel Caramel as accent
  };

  // Clean modern cards with simple shadow effect
  const drawCleanCard = (
    x: number, 
    y: number, 
    width: number, 
    height: number
  ) => {
    // Simple shadow effect
    pdf.setFillColor(220, 220, 220);
    pdf.rect(x + 1, y + 1, width, height, 'F');

    // Main card background - clean white
    pdf.setFillColor(colors.cardBg[0], colors.cardBg[1], colors.cardBg[2]);
    pdf.rect(x, y, width, height, 'F');

    // Light border
    pdf.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
    pdf.setLineWidth(0.5);
    pdf.rect(x, y, width, height, 'S');
  };

  // Enhanced progress bar
  const drawModernProgressBar = (
    x: number, 
    y: number, 
    width: number, 
    height: number, 
    progress: number,
    color: [number, number, number] = colors.primary
  ) => {
    // Background track
    pdf.setFillColor(colors.border[0], colors.border[1], colors.border[2]);
    pdf.rect(x, y, width, height, 'F');

    // Progress fill
    const progressWidth = Math.max(0, Math.min(width, (progress / 100) * width));
    if (progressWidth > 0) {
      pdf.setFillColor(color[0], color[1], color[2]);
      pdf.rect(x, y, progressWidth, height, 'F');
    }
  };

  // Donut chart with simple arc simulation
  const drawDonutChart = (
    centerX: number, 
    centerY: number, 
    radius: number, 
    progress: number
  ) => {
    // Background circle
    pdf.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
    pdf.setLineWidth(6);
    pdf.circle(centerX, centerY, radius - 3, 'S');

    // Progress arc simulation using multiple small circles
    if (progress > 0) {
      pdf.setFillColor(colors.success[0], colors.success[1], colors.success[2]);

      const steps = Math.max(1, Math.floor((progress / 100) * 20));
      const angleStep = (2 * Math.PI) / 20;

      for (let i = 0; i < steps; i++) {
        const angle = i * angleStep - Math.PI / 2; // Start from top
        const x1 = centerX + (radius - 3) * Math.cos(angle);
        const y1 = centerY + (radius - 3) * Math.sin(angle);
        pdf.circle(x1, y1, 1.5, 'F');
      }
    }

    // Center text
    pdf.setFontSize(18);
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

  // Set clean background
  pdf.setFillColor(colors.background[0], colors.background[1], colors.background[2]);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');

  // Modern header
  const headerHeight = 50;
  pdf.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.rect(0, 0, pageWidth, headerHeight, 'F');

  // Header text
  pdf.setFontSize(20);
  pdf.setTextColor(255, 255, 255);
  pdf.text('My College Finance', 20, 22);

  pdf.setFontSize(10);
  pdf.setTextColor(220, 220, 255);
  pdf.text('SAVINGS GOAL DASHBOARD', 20, 32);

  // Date in header (right aligned)
  pdf.setFontSize(8);
  pdf.setTextColor(200, 200, 255);
  const dateText = formatDate(new Date());
  const dateWidth = pdf.getTextWidth(dateText);
  pdf.text(dateText, pageWidth - 20 - dateWidth, 22);

  const calculations = calculateSavings(
    goal.targetAmount || 0,
    goal.currentSavings || 0,
    new Date(goal.targetDate || Date.now()),
    goal.monthlyCapacity || 300
  );

  // Enhanced metrics cards with professional layout
  const startY = headerHeight + 24;
  const cardHeight = 55;
  const cardWidth = 58;
  const cardSpacing = 8;
  const totalCardsWidth = (cardWidth * 3) + (cardSpacing * 2);
  const cardsStartX = (pageWidth - totalCardsWidth) / 2;

  // Metric cards data
  const metricCards = [
    {
      title: 'TOTAL GOAL',
      value: formatCurrency(goal.targetAmount || 0),
      subtitle: `${calculations.progressPercent.toFixed(1)}% complete`,
      color: colors.primary
    },
    {
      title: 'CURRENT SAVINGS', 
      value: formatCurrency(goal.currentSavings || 0),
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

  // Draw metric cards with enhanced modern design
  metricCards.forEach((card, index) => {
    const cardX = cardsStartX + (index * (cardWidth + cardSpacing));

    drawCleanCard(cardX, startY, cardWidth, cardHeight);

    // Add colored top border
    pdf.setDrawColor(card.color[0], card.color[1], card.color[2]);
    pdf.setLineWidth(2);
    pdf.line(cardX, startY, cardX + cardWidth, startY);

    // Category label at top
    pdf.setFontSize(7);
    pdf.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
    pdf.text(card.title, cardX + 8, startY + 14);

    // Main value (large, centered)
    pdf.setFontSize(18);
    pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    const valueWidth = pdf.getTextWidth(card.value);
    pdf.text(card.value, cardX + (cardWidth - valueWidth) / 2, startY + 28);

    // Progress indicator (smaller, colored)
    pdf.setFontSize(7);
    pdf.setTextColor(card.color[0], card.color[1], card.color[2]);
    const subtitleWidth = pdf.getTextWidth(card.subtitle);
    pdf.text(card.subtitle, cardX + (cardWidth - subtitleWidth) / 2, startY + 42);
  });

  // Large progress section
  const progressSectionY = startY + cardHeight + 24;
  const progressCardWidth = Math.floor(totalCardsWidth * 0.58);
  const detailsCardWidth = totalCardsWidth - progressCardWidth - cardSpacing;
  const progressCardHeight = 92;

  // Main progress card
  drawCleanCard(cardsStartX, progressSectionY, progressCardWidth, progressCardHeight);

  // Add colored header
  pdf.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.rect(cardsStartX, progressSectionY, progressCardWidth, 6, 'F');

  pdf.setFontSize(13);
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  pdf.text('Progress Overview', cardsStartX + 12, progressSectionY + 20);

  // Large donut chart
  drawDonutChart(cardsStartX + 20, progressSectionY + 28, 26, calculations.progressPercent);

  // Progress details next to chart
  const detailsX = cardsStartX + 72;
  
  // Remaining amount stat box
  pdf.setFillColor(250, 251, 252);
  pdf.rect(detailsX, progressSectionY + 32, progressCardWidth - 82, 18, 'F');
  
  pdf.setFontSize(8);
  pdf.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
  pdf.text('REMAINING AMOUNT', detailsX + 4, progressSectionY + 38);

  pdf.setFontSize(14);
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  const remaining = (goal.targetAmount || 0) - (goal.currentSavings || 0);
  pdf.text(formatCurrency(remaining), detailsX + 4, progressSectionY + 46);

  // Time remaining stat box
  pdf.setFillColor(250, 251, 252);
  pdf.rect(detailsX, progressSectionY + 54, progressCardWidth - 82, 18, 'F');
  
  pdf.setFontSize(8);
  pdf.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
  pdf.text('TIME REMAINING', detailsX + 4, progressSectionY + 60);

  pdf.setFontSize(12);
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  pdf.text(`${calculations.monthsRemaining} months`, detailsX + 4, progressSectionY + 68);

  pdf.setFontSize(7);
  pdf.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  pdf.text(`Target: ${formatDate(new Date(goal.targetDate || Date.now()))}`, detailsX + 4, progressSectionY + 80);

  // Timeline card
  const timelineX = cardsStartX + progressCardWidth + cardSpacing;
  drawCleanCard(timelineX, progressSectionY, detailsCardWidth, progressCardHeight);

  // Add colored header
  pdf.setFillColor(colors.success[0], colors.success[1], colors.success[2]);
  pdf.rect(timelineX, progressSectionY, detailsCardWidth, 6, 'F');

  pdf.setFontSize(13);
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  pdf.text('Timeline', timelineX + 8, progressSectionY + 20);

  // Progress bars
  pdf.setFontSize(8);
  pdf.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
  pdf.text('Overall Progress', timelineX + 8, progressSectionY + 32);
  
  pdf.setFontSize(10);
  pdf.setTextColor(colors.success[0], colors.success[1], colors.success[2]);
  pdf.text(`${Math.round(calculations.progressPercent)}%`, timelineX + detailsCardWidth - 20, progressSectionY + 32);
  
  drawModernProgressBar(timelineX + 8, progressSectionY + 36, detailsCardWidth - 16, 4, calculations.progressPercent, colors.success);

  // Monthly progress
  const monthlyProgress = Math.min(100, ((goal.currentSavings || 0) % calculations.monthlyRequired) / calculations.monthlyRequired * 100);
  pdf.setFontSize(8);
  pdf.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
  pdf.text('This Month', timelineX + 8, progressSectionY + 50);
  
  pdf.setFontSize(10);
  pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.text(`${Math.round(monthlyProgress)}%`, timelineX + detailsCardWidth - 20, progressSectionY + 50);
  
  drawModernProgressBar(timelineX + 8, progressSectionY + 54, detailsCardWidth - 16, 4, monthlyProgress, colors.primary);

  // Goal details
  pdf.setFillColor(248, 250, 252);
  pdf.rect(timelineX + 8, progressSectionY + 64, detailsCardWidth - 16, 22, 'F');
  
  pdf.setFontSize(7);
  pdf.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
  pdf.text('Goal Category:', timelineX + 12, progressSectionY + 72);
  pdf.setFontSize(9);
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  pdf.text((goal.goalType || 'general').charAt(0).toUpperCase() + (goal.goalType || 'general').slice(1), timelineX + 12, progressSectionY + 78);

  pdf.setFontSize(7);
  pdf.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
  pdf.text('Created by:', timelineX + 12, progressSectionY + 82);
  pdf.setFontSize(8);
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  pdf.text(userInfo.name, timelineX + 35, progressSectionY + 82);

  // Scenarios section
  const scenariosY = progressSectionY + progressCardHeight + 16;
  const scenarioCardHeight = 50;
  drawCleanCard(cardsStartX, scenariosY, totalCardsWidth, scenarioCardHeight);

  // Add colored header
  pdf.setFillColor(colors.warning[0], colors.warning[1], colors.warning[2]);
  pdf.rect(cardsStartX, scenariosY, totalCardsWidth, 6, 'F');

  pdf.setFontSize(13);
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  pdf.text('Optimization Scenarios', cardsStartX + 12, scenariosY + 20);

  // Scenario boxes
  const scenarioWidth = (totalCardsWidth - 36) / 2;
  const scenarioHeight = 22;

  // Scenario 1
  pdf.setFillColor(220, 252, 231);
  pdf.rect(cardsStartX + 12, scenariosY + 26, scenarioWidth, scenarioHeight, 'F');
  
  pdf.setDrawColor(colors.success[0], colors.success[1], colors.success[2]);
  pdf.setLineWidth(2);
  pdf.line(cardsStartX + 12, scenariosY + 26, cardsStartX + 12, scenariosY + 26 + scenarioHeight);

  pdf.setFontSize(8);
  pdf.setTextColor(colors.success[0], colors.success[1], colors.success[2]);
  pdf.text('Save $50 more/month', cardsStartX + 18, scenariosY + 32);
  pdf.setFontSize(10);
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  pdf.text(`${calculations.scenarios.save50More.monthsSaved} months earlier`, cardsStartX + 18, scenariosY + 42);

  // Scenario 2
  pdf.setFillColor(237, 233, 254);
  pdf.rect(cardsStartX + 18 + scenarioWidth, scenariosY + 26, scenarioWidth, scenarioHeight, 'F');
  
  pdf.setDrawColor(colors.accent[0], colors.accent[1], colors.accent[2]);
  pdf.setLineWidth(2);
  pdf.line(cardsStartX + 18 + scenarioWidth, scenariosY + 26, cardsStartX + 18 + scenarioWidth, scenariosY + 26 + scenarioHeight);

  pdf.setFontSize(8);
  pdf.setTextColor(colors.accent[0], colors.accent[1], colors.accent[2]);
  pdf.text('Save $100 more/month', cardsStartX + 24 + scenarioWidth, scenariosY + 32);
  pdf.setFontSize(10);
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  pdf.text(`${calculations.scenarios.save100More.monthsSaved} months earlier`, cardsStartX + 24 + scenarioWidth, scenariosY + 42);

  // Footer
  const footerY = pageHeight - 22;
  pdf.setFillColor(colors.border[0], colors.border[1], colors.border[2]);
  pdf.rect(0, footerY, pageWidth, 1, 'F');

  pdf.setFontSize(8);
  pdf.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  pdf.text('My College Finance - Educate • Motivate • Elevate', 20, footerY + 12);

  pdf.setFontSize(7);
  pdf.text(`Generated on ${formatDate(new Date())}`, pageWidth - 60, footerY + 12);

  // Save the PDF
  pdf.save(`savings-plan-${goal.goalType || 'goal'}-${formatDate(new Date())}.pdf`);
}
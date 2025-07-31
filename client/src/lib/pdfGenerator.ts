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

  // Enhanced modern color palette matching the reference
  const colors = {
    primary: [67, 97, 238] as [number, number, number], // Rich blue
    secondary: [99, 102, 241] as [number, number, number], // Indigo
    success: [16, 185, 129] as [number, number, number], // Emerald
    warning: [245, 158, 11] as [number, number, number], // Amber
    danger: [239, 68, 68] as [number, number, number],
    text: [30, 41, 59] as [number, number, number], // Slate-800
    textLight: [100, 116, 139] as [number, number, number], // Slate-500
    textMuted: [148, 163, 184] as [number, number, number], // Slate-400
    background: [248, 250, 252] as [number, number, number], // Slate-50
    cardBg: [255, 255, 255] as [number, number, number],
    border: [241, 245, 249] as [number, number, number], // Slate-100
    accent: [139, 92, 246] as [number, number, number] // Violet
  };

  // Clean modern cards with typography focus (no icons)
  const drawCleanCard = (
    x: number, 
    y: number, 
    width: number, 
    height: number
  ) => {
    // Subtle shadow effect for depth
    pdf.setFillColor(0, 0, 0);
    pdf.rect(x + 1, y + 2, width, height, 'F');

    // Main card background - clean white
    pdf.setFillColor(colors.cardBg[0], colors.cardBg[1], colors.cardBg[2]);
    pdf.rect(x, y, width, height, 'F');

    // No border for cleaner look
  };

  // Enhanced progress bar with rounded appearance
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

    // Rounded ends simulation
    pdf.circle(x + height/2, y + height/2, height/2, 'F');
    pdf.circle(x + width - height/2, y + height/2, height/2, 'F');

    // Progress fill
    const progressWidth = Math.max(0, Math.min(width, (progress / 100) * width));
    if (progressWidth > height) {
      pdf.setFillColor(color[0], color[1], color[2]);
      pdf.rect(x, y, progressWidth, height, 'F');
      pdf.circle(x + height/2, y + height/2, height/2, 'F');
      pdf.circle(x + progressWidth - height/2, y + height/2, height/2, 'F');
    }
  };

  // Advanced donut chart with better arc simulation
  const drawDonutChart = (x: number, y: number, radius: number, progress: number) => {
    const centerX = x + radius;
    const centerY = y + radius;

    // Background circle (thick stroke)
    pdf.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
    pdf.setLineWidth(6);
    pdf.circle(centerX, centerY, radius - 3, 'S');

    // Progress arc simulation with multiple small arcs
    if (progress > 0) {
      pdf.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      pdf.setLineWidth(6);

      const steps = Math.max(1, Math.floor((progress / 100) * 24)); // More steps for smoother arc
      const angleStep = (2 * Math.PI) / 24;

      for (let i = 0; i < steps; i++) {
        const angle = i * angleStep - Math.PI / 2; // Start from top
        const x1 = centerX + (radius - 3) * Math.cos(angle);
        const y1 = centerY + (radius - 3) * Math.sin(angle);
        pdf.circle(x1, y1, 1.5, 'F');
      }
    }

    // Center content with better typography
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

  // Modern header with gradient simulation
  const headerHeight = 50;
  pdf.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.rect(0, 0, pageWidth, headerHeight, 'F');

  // Gradient overlay simulation
  pdf.setFillColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
  pdf.rect(0, 0, pageWidth, headerHeight/2, 'F');

  // Header text with better typography
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
  const startY = headerHeight + 18;
  const cardHeight = 45;
  const cardWidth = 54;
  const cardSpacing = 7;
  const totalCardsWidth = (cardWidth * 3) + (cardSpacing * 2);
  const cardsStartX = (pageWidth - totalCardsWidth) / 2;

  // Metric cards data with enhanced styling
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

  // Draw metric cards with clean typography-focused design
  metricCards.forEach((card, index) => {
    const cardX = cardsStartX + (index * (cardWidth + cardSpacing));

    drawCleanCard(cardX, startY, cardWidth, cardHeight);

    // Bold title as the main focal point (larger, more prominent)
    pdf.setFontSize(16);
    pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    pdf.text(card.value, cardX + 8, startY + 20);

    // Subtitle/label below the main value
    pdf.setFontSize(8);
    pdf.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
    pdf.text(card.title, cardX + 8, startY + 30);

    // Status/progress indicator (smallest text)
    pdf.setFontSize(7);
    pdf.setTextColor(card.color[0], card.color[1], card.color[2]);
    pdf.text(card.subtitle, cardX + 8, startY + 38);
  });

  // Large progress section with side-by-side layout
  const progressSectionY = startY + cardHeight + 18;
  const progressCardWidth = Math.floor(totalCardsWidth * 0.62);
  const detailsCardWidth = totalCardsWidth - progressCardWidth - cardSpacing;

  // Main progress card - clean design
  drawCleanCard(cardsStartX, progressSectionY, progressCardWidth, 85);

  pdf.setFontSize(12);
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  pdf.text('Progress Overview', cardsStartX + 12, progressSectionY + 16);

  // Large donut chart
  drawDonutChart(cardsStartX + 18, progressSectionY + 25, 22, calculations.progressPercent);

  // Progress details next to chart
  const detailsX = cardsStartX + 65;
  pdf.setFontSize(9);
  pdf.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
  pdf.text('Remaining Amount', detailsX, progressSectionY + 30);

  pdf.setFontSize(14);
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  const remaining = (goal.targetAmount || 0) - (goal.currentSavings || 0);
  pdf.text(formatCurrency(remaining), detailsX, progressSectionY + 40);

  pdf.setFontSize(9);
  pdf.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
  pdf.text('Time Remaining', detailsX, progressSectionY + 55);

  pdf.setFontSize(12);
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  pdf.text(`${calculations.monthsRemaining} months`, detailsX, progressSectionY + 65);

  pdf.setFontSize(7);
  pdf.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  pdf.text(`Target: ${formatDate(new Date(goal.targetDate || Date.now()))}`, detailsX, progressSectionY + 75);

  // Timeline/Details card
  const timelineX = cardsStartX + progressCardWidth + cardSpacing;
  drawCleanCard(timelineX, progressSectionY, detailsCardWidth, 85);

  pdf.setFontSize(11);
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  pdf.text('Timeline', timelineX + 8, progressSectionY + 16);

  // Progress bars for different metrics
  pdf.setFontSize(7);
  pdf.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
  pdf.text('Overall Progress', timelineX + 8, progressSectionY + 28);
  drawModernProgressBar(timelineX + 8, progressSectionY + 32, detailsCardWidth - 16, 3, calculations.progressPercent, colors.success);

  // Monthly progress simulation
  const monthlyProgress = Math.min(100, ((goal.currentSavings || 0) % calculations.monthlyRequired) / calculations.monthlyRequired * 100);
  pdf.text('This Month', timelineX + 8, progressSectionY + 43);
  drawModernProgressBar(timelineX + 8, progressSectionY + 47, detailsCardWidth - 16, 3, monthlyProgress, colors.primary);

  // Goal details
  pdf.setFontSize(7);
  pdf.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
  pdf.text('Goal Category:', timelineX + 8, progressSectionY + 60);
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  pdf.text(goal.goalType.charAt(0).toUpperCase() + goal.goalType.slice(1), timelineX + 8, progressSectionY + 68);

  pdf.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
  pdf.text('Created by:', timelineX + 8, progressSectionY + 78);
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  pdf.text(userInfo.name, timelineX + 35, progressSectionY + 78);

  // What-if scenarios section with enhanced styling
  const scenariosY = progressSectionY + 95;
  drawCleanCard(cardsStartX, scenariosY, totalCardsWidth, 40);

  pdf.setFontSize(11);
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  pdf.text('Optimization Scenarios', cardsStartX + 12, scenariosY + 16);

  // Scenario boxes with colored backgrounds
  const scenarioWidth = (totalCardsWidth - 32) / 2;

  // Scenario 1 - Enhanced styling
  pdf.setFillColor(220, 252, 231); // Light green background
  pdf.rect(cardsStartX + 12, scenariosY + 22, scenarioWidth, 14, 'F');

  pdf.setFontSize(7);
  pdf.setTextColor(colors.success[0], colors.success[1], colors.success[2]);
  pdf.text('💡 Save $50 more/month', cardsStartX + 16, scenariosY + 28);
  pdf.setFontSize(6);
  pdf.text(`${calculations.scenarios.save50More.monthsSaved} months earlier`, cardsStartX + 16, scenariosY + 33);

  // Scenario 2 - Enhanced styling
  pdf.setFillColor(237, 233, 254); // Light purple background
  pdf.rect(cardsStartX + 12 + scenarioWidth + 8, scenariosY + 22, scenarioWidth, 14, 'F');

  pdf.setFontSize(7);
  pdf.setTextColor(colors.accent[0], colors.accent[1], colors.accent[2]);
  pdf.text('🚀 Save $100 more/month', cardsStartX + 16 + scenarioWidth + 8, scenariosY + 28);
  pdf.setFontSize(6);
  pdf.text(`${calculations.scenarios.save100More.monthsSaved} months earlier`, cardsStartX + 16 + scenarioWidth + 8, scenariosY + 33);

  // Enhanced footer
  const footerY = pageHeight - 22;
  pdf.setFillColor(248, 250, 252); // Light gray background
  pdf.rect(0, footerY, pageWidth, 22, 'F');

  pdf.setFontSize(7);
  pdf.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  pdf.text('Generated by My College Finance • Your Financial Education Partner', 20, footerY + 10);

  const footerRight = `Generated ${formatDate(new Date())} • ${isDarkMode ? 'Dark' : 'Light'} Theme`;
  const footerRightWidth = pdf.getTextWidth(footerRight);
  pdf.text(footerRight, pageWidth - 20 - footerRightWidth, footerY + 14);

  // Download with professional filename
  const fileName = `${goal.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_savings_dashboard_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
}
import { type SavingsGoal } from '@shared/schema';
import { formatCurrency, formatDate, calculateSavings } from './calculations';

export async function generateSavingsPlanPDF(
  goal: SavingsGoal,
  userInfo: { name: string; startDate: Date },
  isDarkMode: boolean = false
): Promise<void> {
  // Dynamic import for jsPDF to avoid SSR issues
  const { default: jsPDF } = await import('jspdf');
  
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  
  // Modern color palette with proper typing
  const colors = {
    primary: [61, 90, 254] as [number, number, number],
    success: [34, 197, 94] as [number, number, number],
    warning: [251, 146, 60] as [number, number, number],
    danger: [239, 68, 68] as [number, number, number],
    text: [15, 23, 42] as [number, number, number],
    textLight: [71, 85, 105] as [number, number, number],
    textMuted: [148, 163, 184] as [number, number, number],
    background: [248, 250, 252] as [number, number, number],
    cardBg: [255, 255, 255] as [number, number, number],
    border: [226, 232, 240] as [number, number, number],
    accent: [139, 92, 246] as [number, number, number],
    secondary: [16, 185, 129] as [number, number, number]
  };

  // Helper function to draw modern card with shadow effect
  const drawCard = (x: number, y: number, width: number, height: number, hasIcon: boolean = false) => {
    // Shadow effect
    pdf.setFillColor(0, 0, 0, 0.08);
    pdf.rect(x + 1, y + 1, width, height, 'F');
    
    // Main card
    pdf.setFillColor(colors.cardBg[0], colors.cardBg[1], colors.cardBg[2]);
    pdf.rect(x, y, width, height, 'F');
    
    // Border
    pdf.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
    pdf.setLineWidth(0.3);
    pdf.rect(x, y, width, height, 'S');
  };

  // Helper function to draw progress bar
  const drawProgressBar = (x: number, y: number, width: number, height: number, progress: number) => {
    // Background
    pdf.setFillColor(colors.border[0], colors.border[1], colors.border[2]);
    pdf.rect(x, y, width, height, 'F');
    
    // Progress fill
    const progressWidth = (progress / 100) * width;
    if (progressWidth > 0) {
      pdf.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      pdf.rect(x, y, progressWidth, height, 'F');
    }
  };

  // Helper function to draw progress circle (simplified but effective)
  const drawProgressCircle = (x: number, y: number, radius: number, progress: number) => {
    const centerX = x + radius;
    const centerY = y + radius;
    
    // Background circle
    pdf.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
    pdf.setLineWidth(4);
    pdf.circle(centerX, centerY, radius, 'S');
    
    // Progress indicator (use filled arc approximation)
    if (progress > 0) {
      pdf.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      // Draw progress as filled circle segments
      const segments = Math.floor((progress / 100) * 16);
      for (let i = 0; i < segments; i++) {
        const angle = (i / 16) * 2 * Math.PI - Math.PI / 2;
        const dotX = centerX + (radius - 2) * Math.cos(angle);
        const dotY = centerY + (radius - 2) * Math.sin(angle);
        pdf.circle(dotX, dotY, 1.5, 'F');
      }
    }
  };

  // Calculate all data upfront
  const calculations = calculateSavings(
    goal.targetAmount,
    goal.currentSavings || 0,
    new Date(goal.targetDate),
    goal.monthlyCapacity || 300
  );

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
  pdf.text('My College Finance', 20, 25);
  
  pdf.setFontSize(10);
  pdf.setTextColor(200, 220, 255);
  pdf.text('SAVINGS GOAL DASHBOARD', 20, 35);

  // Date and user info in header
  pdf.setFontSize(8);
  pdf.setTextColor(180, 200, 255);
  const currentDate = formatDate(new Date());
  const headerInfo = `${userInfo.name} • ${currentDate}`;
  const headerInfoWidth = pdf.getTextWidth(headerInfo);
  pdf.text(headerInfo, pageWidth - headerInfoWidth - 20, 30);

  // Main content area starts after header
  let currentY = headerHeight + 15;

  // Key metrics cards row
  const cardWidth = 50;
  const cardHeight = 35;
  const cardSpacing = 8;
  const startX = 20;

  // Goal Amount Card
  drawCard(startX, currentY, cardWidth, cardHeight);
  pdf.setFontSize(8);
  pdf.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  pdf.text('GOAL AMOUNT', startX + 4, currentY + 8);
  pdf.setFontSize(14);
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  pdf.text(formatCurrency(goal.targetAmount), startX + 4, currentY + 18);
  pdf.setFontSize(7);
  pdf.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  pdf.text(`Target: ${formatDate(new Date(goal.targetDate))}`, startX + 4, currentY + 28);

  // Current Savings Card
  const card2X = startX + cardWidth + cardSpacing;
  drawCard(card2X, currentY, cardWidth, cardHeight);
  pdf.setFontSize(8);
  pdf.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  pdf.text('SAVED SO FAR', card2X + 4, currentY + 8);
  pdf.setFontSize(14);
  pdf.setTextColor(colors.success[0], colors.success[1], colors.success[2]);
  pdf.text(formatCurrency(goal.currentSavings || 0), card2X + 4, currentY + 18);
  pdf.setFontSize(7);
  pdf.setTextColor(colors.success[0], colors.success[1], colors.success[2]);
  pdf.text(`${calculations.progressPercent.toFixed(1)}% Complete`, card2X + 4, currentY + 28);

  // Monthly Required Card
  const card3X = card2X + cardWidth + cardSpacing;
  drawCard(card3X, currentY, cardWidth, cardHeight);
  pdf.setFontSize(8);
  pdf.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  pdf.text('MONTHLY NEEDED', card3X + 4, currentY + 8);
  pdf.setFontSize(14);
  pdf.setTextColor(calculations.isFeasible ? colors.primary[0] : colors.danger[0], 
                   calculations.isFeasible ? colors.primary[1] : colors.danger[1], 
                   calculations.isFeasible ? colors.primary[2] : colors.danger[2]);
  pdf.text(formatCurrency(calculations.monthlyRequired), card3X + 4, currentY + 18);
  pdf.setFontSize(7);
  pdf.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  pdf.text(`${calculations.monthsRemaining} months left`, card3X + 4, currentY + 28);

  currentY += cardHeight + 20;

  // Progress Visualization Section
  const progressSectionHeight = 60;
  drawCard(startX, currentY, pageWidth - 40, progressSectionHeight);
  
  pdf.setFontSize(12);
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  pdf.text('Progress Overview', startX + 8, currentY + 12);
  
  // Progress circle
  const circleX = startX + 15;
  const circleY = currentY + 20;
  drawProgressCircle(circleX, circleY, 15, calculations.progressPercent);
  
  // Progress percentage in center
  pdf.setFontSize(12);
  pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  const progressText = `${Math.round(calculations.progressPercent)}%`;
  const progressTextWidth = pdf.getTextWidth(progressText);
  pdf.text(progressText, circleX + 15 - progressTextWidth/2, circleY + 18);

  // Progress details
  const detailsX = circleX + 40;
  pdf.setFontSize(9);
  pdf.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
  pdf.text('Amount Remaining:', detailsX, currentY + 20);
  pdf.setFontSize(11);
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  pdf.text(formatCurrency(calculations.amountNeeded), detailsX, currentY + 28);

  pdf.setFontSize(9);
  pdf.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
  pdf.text('Status:', detailsX, currentY + 38);
  pdf.setFontSize(10);
  pdf.setTextColor(calculations.isFeasible ? colors.success[0] : colors.warning[0],
                   calculations.isFeasible ? colors.success[1] : colors.warning[1],
                   calculations.isFeasible ? colors.success[2] : colors.warning[2]);
  pdf.text(calculations.isFeasible ? 'On Track' : 'Needs Adjustment', detailsX, currentY + 46);

  // Progress bar
  const barY = currentY + 52;
  drawProgressBar(detailsX, barY, 80, 4, calculations.progressPercent);

  currentY += progressSectionHeight + 15;

  // Goal Details Section
  const detailsSectionHeight = 45;
  drawCard(startX, currentY, pageWidth - 40, detailsSectionHeight);
  
  pdf.setFontSize(12);
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  pdf.text('Goal Details', startX + 8, currentY + 12);
  
  // Two column layout for details
  const col1X = startX + 8;
  const col2X = startX + 90;
  
  pdf.setFontSize(9);
  pdf.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
  pdf.text('Goal Name:', col1X, currentY + 22);
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  pdf.text(goal.name, col1X + 25, currentY + 22);
  
  pdf.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
  pdf.text('Category:', col1X, currentY + 30);
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  pdf.text(goal.goalType.charAt(0).toUpperCase() + goal.goalType.slice(1), col1X + 25, currentY + 30);

  pdf.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
  pdf.text('Created:', col2X, currentY + 22);
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  pdf.text(formatDate(userInfo.startDate), col2X + 20, currentY + 22);
  
  pdf.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
  pdf.text('Monthly Capacity:', col2X, currentY + 30);
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  pdf.text(formatCurrency(goal.monthlyCapacity || 300), col2X + 35, currentY + 30);

  currentY += detailsSectionHeight + 15;

  // What-If Scenarios Section
  const scenarioHeight = 40;
  drawCard(startX, currentY, pageWidth - 40, scenarioHeight);
  
  pdf.setFontSize(12);
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  pdf.text('What-If Scenarios', startX + 8, currentY + 12);
  
  pdf.setFontSize(9);
  pdf.setTextColor(colors.success[0], colors.success[1], colors.success[2]);
  pdf.text(`💰 Save $50 more monthly: Reach goal ${calculations.scenarios.save50More.monthsSaved} months earlier`, 
           startX + 8, currentY + 22);
  
  pdf.setTextColor(colors.accent[0], colors.accent[1], colors.accent[2]);
  pdf.text(`💰 Save $100 more monthly: Reach goal ${calculations.scenarios.save100More.monthsSaved} months earlier`, 
           startX + 8, currentY + 30);

  // Footer
  pdf.setFontSize(7);
  pdf.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  pdf.text('Generated by My College Finance • Educate • Motivate • Elevate', 20, pageHeight - 15);
  pdf.text(`Report created on ${currentDate} • ${isDarkMode ? 'Dark' : 'Light'} Mode`, 20, pageHeight - 8);

  // Download the PDF
  const fileName = `${goal.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_savings_dashboard_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
}
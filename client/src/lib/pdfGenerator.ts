import { type SavingsGoal } from '@shared/schema';
import { formatCurrency, formatDate, calculateSavings } from './calculations';

export async function generateSavingsPlanPDF(
  goal: SavingsGoal,
  userInfo: { name: string; startDate: Date },
  isDarkMode: boolean = false
): Promise<void> {
  // Dynamic import for jsPDF to avoid SSR issues
  const { default: jsPDF } = await import('jspdf');
  
  const pdf = new jsPDF();
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
    background: [248, 250, 252] as [number, number, number],
    cardBg: [255, 255, 255] as [number, number, number],
    border: [226, 232, 240] as [number, number, number],
    accent: [139, 92, 246] as [number, number, number]
  };

  // Helper function to draw card
  const drawCard = (x: number, y: number, width: number, height: number) => {
    pdf.setFillColor(colors.cardBg[0], colors.cardBg[1], colors.cardBg[2]);
    pdf.rect(x, y, width, height, 'F');
    pdf.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
    pdf.setLineWidth(0.5);
    pdf.rect(x, y, width, height, 'S');
  };

  // Helper function to draw progress circle (simplified)
  const drawProgressCircle = (x: number, y: number, radius: number, progress: number) => {
    const centerX = x + radius;
    const centerY = y + radius;
    
    // Background circle
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(3);
    pdf.circle(centerX, centerY, radius, 'S');
    
    // Progress indicator (simplified as a filled circle for progress > 0)
    if (progress > 0) {
      pdf.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      const progressRadius = (progress / 100) * radius * 0.8;
      pdf.circle(centerX, centerY, progressRadius, 'F');
    }
  };

  // Set background
  pdf.setFillColor(colors.background[0], colors.background[1], colors.background[2]);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');

  // Header with logo placeholder and title
  pdf.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.rect(0, 0, pageWidth, 50, 'F');
  
  pdf.setFontSize(24);
  pdf.setTextColor(255, 255, 255);
  pdf.text('My College Finance', 20, 25);
  
  pdf.setFontSize(12);
  pdf.setTextColor(200, 200, 255);
  pdf.text('SAVINGS GOAL DASHBOARD', 20, 35);

  const calculations = calculateSavings(
    goal.targetAmount,
    goal.currentSavings,
    new Date(goal.targetDate),
    goal.monthlyCapacity || 300
  );

  // Main metrics cards (top row)
  const cardY = 65;
  const cardHeight = 45;
  const cardWidth = 60;
  const spacing = 5;

  // Total Goal Card
  drawCard(20, cardY, cardWidth, cardHeight);
  pdf.setFontSize(10);
  pdf.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
  pdf.text('TOTAL GOAL', 25, cardY + 12);
  pdf.setFontSize(18);
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  pdf.text(formatCurrency(goal.targetAmount), 25, cardY + 25);
  pdf.setFontSize(8);
  pdf.setTextColor(colors.success[0], colors.success[1], colors.success[2]);
  pdf.text(`${calculations.progressPercent.toFixed(1)}%`, 25, cardY + 35);

  // Current Savings Card  
  drawCard(20 + cardWidth + spacing, cardY, cardWidth, cardHeight);
  pdf.setFontSize(10);
  pdf.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
  pdf.text('CURRENT SAVINGS', 25 + cardWidth + spacing, cardY + 12);
  pdf.setFontSize(18);
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  pdf.text(formatCurrency(goal.currentSavings), 25 + cardWidth + spacing, cardY + 25);
  pdf.setFontSize(8);
  pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.text('SAVED', 25 + cardWidth + spacing, cardY + 35);

  // Monthly Required Card
  drawCard(20 + (cardWidth + spacing) * 2, cardY, cardWidth, cardHeight);
  pdf.setFontSize(10);
  pdf.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
  pdf.text('MONTHLY REQUIRED', 25 + (cardWidth + spacing) * 2, cardY + 12);
  pdf.setFontSize(18);
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  pdf.text(formatCurrency(calculations.monthlyRequired), 25 + (cardWidth + spacing) * 2, cardY + 25);
  pdf.setFontSize(8);
  pdf.setTextColor(colors.warning[0], colors.warning[1], colors.warning[2]);
  pdf.text('PER MONTH', 25 + (cardWidth + spacing) * 2, cardY + 35);

  // Progress Visualization Card
  const progressY = cardY + cardHeight + 15;
  drawCard(20, progressY, 90, 80);
  
  pdf.setFontSize(12);
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  pdf.text('Progress Overview', 25, progressY + 15);
  
  // Draw progress circle
  drawProgressCircle(35, progressY + 25, 20, calculations.progressPercent);
  
  // Progress percentage in center
  pdf.setFontSize(16);
  pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.text(`${Math.round(calculations.progressPercent)}%`, 50, progressY + 50);
  pdf.setFontSize(8);
  pdf.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
  pdf.text('COMPLETE', 47, progressY + 58);

  // Timeline info
  pdf.setFontSize(10);
  pdf.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
  pdf.text('Time Remaining:', 75, progressY + 35);
  pdf.setFontSize(12);
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  pdf.text(`${calculations.monthsRemaining} months`, 75, progressY + 45);
  
  pdf.setFontSize(10);
  pdf.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
  pdf.text('Target Date:', 75, progressY + 55);
  pdf.setFontSize(10);
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  pdf.text(formatDate(new Date(goal.targetDate)), 75, progressY + 65);

  // Goal Details Card
  const detailsY = progressY + 90;
  drawCard(20, detailsY, 170, 60);
  
  pdf.setFontSize(12);
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  pdf.text('Goal Details', 25, detailsY + 15);
  
  pdf.setFontSize(10);
  pdf.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
  pdf.text('Goal Name:', 25, detailsY + 30);
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  pdf.text(goal.name, 55, detailsY + 30);
  
  pdf.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
  pdf.text('Category:', 25, detailsY + 40);
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  pdf.text(goal.goalType.charAt(0).toUpperCase() + goal.goalType.slice(1), 55, detailsY + 40);
  
  pdf.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
  pdf.text('Created by:', 25, detailsY + 50);
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  pdf.text(userInfo.name, 55, detailsY + 50);

  // What-If Scenarios Card
  const scenariosY = detailsY + 70;
  drawCard(20, scenariosY, 170, 50);
  
  pdf.setFontSize(12);
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  pdf.text('What-If Scenarios', 25, scenariosY + 15);
  
  pdf.setFontSize(9);
  pdf.setTextColor(colors.success[0], colors.success[1], colors.success[2]);
  pdf.text(`Save $50 more: Reach goal ${calculations.scenarios.save50More.monthsSaved} months earlier`, 25, scenariosY + 28);
  pdf.setTextColor(colors.accent[0], colors.accent[1], colors.accent[2]);
  pdf.text(`Save $100 more: Reach goal ${calculations.scenarios.save100More.monthsSaved} months earlier`, 25, scenariosY + 38);

  // Footer
  pdf.setFontSize(8);
  pdf.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
  pdf.text('Generated by My College Finance • Your Financial Education Partner', 20, pageHeight - 15);
  pdf.text(`Created on ${formatDate(new Date())} • ${isDarkMode ? 'Dark' : 'Light'} Theme`, 20, pageHeight - 8);

  // Download the PDF
  const fileName = `${goal.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_dashboard_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
}

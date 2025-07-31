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

  // Enhanced header with brand blue gradient effect
  const headerHeight = 60;
  pdf.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.rect(0, 0, pageWidth, headerHeight, 'F');
  
  // Add subtle gradient effect with lighter blue
  pdf.setFillColor(colors.primary[0] + 20, colors.primary[1] + 20, colors.primary[2]);
  pdf.rect(0, 0, pageWidth, 8, 'F');

  // Personalized header with user's name - Poppins Bold style simulation
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.setTextColor(255, 255, 255);
  const goalNumber = goal.id || 1;
  const personalizedTitle = `${userInfo.name}: Goal #${goalNumber} Report`;
  pdf.text(personalizedTitle, 20, 25);

  // Brand name with enhanced styling - Lato Semi-Bold simulation
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(colors.warning[0], colors.warning[1], colors.warning[2]); // Caramel accent
  pdf.text('My College Finance', 20, 40);

  // Subtitle with improved styling - Open Sans Regular simulation
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(220, 230, 255);
  pdf.text('SAVINGS GOAL ANALYSIS REPORT', 20, 50);

  // Enhanced date section in header
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(200, 220, 255);
  const dateText = `Generated: ${formatDate(new Date())}`;
  const dateWidth = pdf.getTextWidth(dateText);
  pdf.text(dateText, pageWidth - 20 - dateWidth, 30);
  
  // Goal type indicator
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(colors.success[0], colors.success[1], colors.success[2]);
  const goalTypeText = `${(goal.goalType ?? 'General').toUpperCase()} GOAL`;
  const goalTypeWidth = pdf.getTextWidth(goalTypeText);
  pdf.text(goalTypeText, pageWidth - 20 - goalTypeWidth, 45);

  // Safe calculations with null checks
  const calculations = calculateSavings(
    goal.targetAmount ?? 0,
    goal.currentSavings ?? 0,
    goal.targetDate ? new Date(goal.targetDate) : new Date(),
    goal.monthlyCapacity ?? 300
  );

  // Enhanced section positioning with brand styling
  const startY = headerHeight + 25;
  
  // Add brand accent line below header
  pdf.setDrawColor(colors.warning[0], colors.warning[1], colors.warning[2]);
  pdf.setLineWidth(2);
  pdf.line(20, headerHeight + 10, pageWidth - 20, headerHeight + 10);

  // Metric cards layout
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

    // Enhanced card content with brand typography
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
    pdf.text(card.title, cardX + 8, startY + 15);

    // Main value - large and centered with brand styling
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    const valueWidth = pdf.getTextWidth(card.value);
    pdf.text(card.value, cardX + (cardWidth - valueWidth) / 2, startY + 30);

    // Enhanced subtitle with brand color
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(card.color[0], card.color[1], card.color[2]);
    const subtitleWidth = pdf.getTextWidth(card.subtitle);
    pdf.text(card.subtitle, cardX + (cardWidth - subtitleWidth) / 2, startY + 42);
  });

  // Enhanced Progress section with modern styling
  const progressSectionY = startY + cardHeight + 25;
  const progressCardWidth = Math.floor(totalCardsWidth * 0.65);
  const detailsCardWidth = totalCardsWidth - progressCardWidth - cardSpacing;
  const sectionHeight = 95;

  // Main progress card with enhanced styling
  drawCleanCard(cardsStartX, progressSectionY, progressCardWidth, sectionHeight);

  // Progress card header with gradient-like effect
  pdf.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.rect(cardsStartX, progressSectionY, progressCardWidth, 6, 'F');
  
  // Add subtle header shadow
  pdf.setFillColor(0, 0, 0, 0.1);
  pdf.rect(cardsStartX, progressSectionY + 6, progressCardWidth, 1, 'F');

  // Enhanced header typography
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(255, 255, 255);
  pdf.text('Progress Overview', cardsStartX + 15, progressSectionY + 20);

  // Progress circle with enhanced positioning and larger size
  const circleX = cardsStartX + 20;
  const circleY = progressSectionY + 35;
  const circleRadius = 24;
  drawProgressCircle(circleX, circleY, circleRadius, calculations.progressPercent);

  // Enhanced progress details with better spacing and typography
  const detailsX = cardsStartX + 75;
  
  // Remaining amount section
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
  pdf.text('Remaining:', detailsX, progressSectionY + 32);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  const remaining = (goal.targetAmount ?? 0) - (goal.currentSavings ?? 0);
  pdf.text(formatCurrency(remaining), detailsX, progressSectionY + 46);

  // Time left section with enhanced styling
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
  pdf.text('Time left:', detailsX, progressSectionY + 62);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(colors.success[0], colors.success[1], colors.success[2]);
  const timeText = calculations.monthsRemaining === 1 ? '1 month' : `${calculations.monthsRemaining} months`;
  pdf.text(timeText, detailsX, progressSectionY + 76);

  // Add progress status indicator
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  const statusColor = calculations.progressPercent >= 75 ? colors.success : 
                     calculations.progressPercent >= 50 ? colors.warning : colors.primary;
  pdf.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
  const statusText = calculations.progressPercent >= 75 ? 'On track!' : 
                    calculations.progressPercent >= 50 ? 'Good progress' : 'Keep going!';
  pdf.text(statusText, detailsX, progressSectionY + 85);

  // Enhanced Timeline & Details card
  const timelineX = cardsStartX + progressCardWidth + cardSpacing;
  drawCleanCard(timelineX, progressSectionY, detailsCardWidth, sectionHeight);

  // Timeline header with enhanced styling
  pdf.setFillColor(colors.success[0], colors.success[1], colors.success[2]);
  pdf.rect(timelineX, progressSectionY, detailsCardWidth, 6, 'F');
  
  // Add subtle header shadow
  pdf.setFillColor(0, 0, 0, 0.1);
  pdf.rect(timelineX, progressSectionY + 6, detailsCardWidth, 1, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(255, 255, 255);
  pdf.text('Goal Details', timelineX + 12, progressSectionY + 20);

  // Enhanced progress bar with label
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
  pdf.text('Overall Progress', timelineX + 12, progressSectionY + 35);
  
  // Progress percentage display
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(colors.success[0], colors.success[1], colors.success[2]);
  pdf.text(`${Math.round(calculations.progressPercent)}%`, timelineX + detailsCardWidth - 25, progressSectionY + 35);
  
  drawProgressBar(timelineX + 12, progressSectionY + 39, detailsCardWidth - 24, 4, calculations.progressPercent, colors.success);

  // Goal category with enhanced styling and icon-like indicator
  pdf.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2], 0.1);
  pdf.rect(timelineX + 12, progressSectionY + 52, detailsCardWidth - 24, 12, 'F');
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
  pdf.text('Goal Category:', timelineX + 16, progressSectionY + 58);
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  const goalTypeCapitalized = (goal.goalType ?? 'General').charAt(0).toUpperCase() + (goal.goalType ?? 'general').slice(1);
  pdf.text(goalTypeCapitalized, timelineX + 16, progressSectionY + 68);

  // Enhanced user info section
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
  pdf.text('Created by:', timelineX + 12, progressSectionY + 82);
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  pdf.text(userInfo.name ?? 'User', timelineX + 42, progressSectionY + 82);

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

  // Enhanced footer with brand styling
  const footerY = pageHeight - 25;
  pdf.setFillColor(colors.background[0], colors.background[1], colors.background[2]);
  pdf.rect(0, footerY, pageWidth, 25, 'F');
  
  // Brand accent line above footer
  pdf.setDrawColor(colors.warning[0], colors.warning[1], colors.warning[2]);
  pdf.setLineWidth(1);
  pdf.line(20, footerY, pageWidth - 20, footerY);

  // Enhanced footer content with brand personality
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.text('My College Finance', 20, footerY + 12);
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);  
  pdf.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  pdf.text('Knowledgeable • Empowering • Approachable • Reliable • Inclusive', 75, footerY + 12);

  // Enhanced footer right with personalization
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  const footerRight = `${userInfo.name} • ${formatDate(new Date())}`;
  const footerRightWidth = pdf.getTextWidth(footerRight);
  pdf.text(footerRight, pageWidth - 20 - footerRightWidth, footerY + 18);

  // Download with safe filename
  const goalName = goal.name?.replace(/[^a-z0-9]/gi, '_').toLowerCase() ?? 'savings_goal';
  const fileName = `${goalName}_dashboard_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
}
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

  // My College Finance Brand Color Palette - Updated Brand Colors
  const colors = {
    primary: [3, 64, 253] as [number, number, number], // Rare Blue #0340fd
    success: [38, 224, 17] as [number, number, number], // Monstrous Green #26e011
    warning: [253, 192, 3] as [number, number, number], // Marigold #fdc003
    text: [0, 5, 22] as [number, number, number], // Black Knight #000516
    textLight: [90, 90, 90] as [number, number, number],
    textMuted: [140, 140, 140] as [number, number, number],
    background: [248, 250, 252] as [number, number, number],
    cardBg: [255, 255, 255] as [number, number, number], // White #ffffffff
    border: [225, 225, 225] as [number, number, number],
    lightAccent: [240, 245, 255] as [number, number, number]
  };

  // Simple, clean card drawing function - works reliably with jsPDF
  const drawCard = (x: number, y: number, width: number, height: number, shadowOffset: number = 1) => {
    // Simple shadow
    if (shadowOffset > 0) {
      pdf.setFillColor(210, 210, 210);
      pdf.rect(x + shadowOffset, y + shadowOffset, width, height, 'F');
    }

    // Main card background
    pdf.setFillColor(colors.cardBg[0], colors.cardBg[1], colors.cardBg[2]);
    pdf.rect(x, y, width, height, 'F');

    // Clean border
    pdf.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
    pdf.setLineWidth(0.5);
    pdf.rect(x, y, width, height, 'S');
  };

  // Improved progress bar - simple but effective
  const drawProgressBar = (
    x: number, 
    y: number, 
    width: number, 
    height: number, 
    progress: number,
    color: [number, number, number] = colors.primary
  ) => {
    // Background
    pdf.setFillColor(240, 240, 240);
    pdf.rect(x, y, width, height, 'F');

    // Border
    pdf.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
    pdf.setLineWidth(0.3);
    pdf.rect(x, y, width, height, 'S');

    // Progress fill
    const progressWidth = Math.max(0, Math.min(width, (progress / 100) * width));
    if (progressWidth > 0) {
      pdf.setFillColor(color[0], color[1], color[2]);
      pdf.rect(x, y, progressWidth, height, 'F');
    }
  };

  // Cleaner circular progress - simplified for better rendering
  const drawProgressCircle = (x: number, y: number, radius: number, progress: number) => {
    const centerX = x + radius;
    const centerY = y + radius;

    // Background circle
    pdf.setDrawColor(235, 235, 235);
    pdf.setLineWidth(6);
    pdf.circle(centerX, centerY, radius, 'S');

    // Progress arc - simplified approach
    if (progress > 0) {
      pdf.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      pdf.setLineWidth(6);

      // Create progress arc with dots (more reliable than complex arcs)
      const steps = Math.floor((progress / 100) * 24);
      for (let i = 0; i < steps; i++) {
        const angle = (i / 24) * 2 * Math.PI - Math.PI / 2;
        const dotX = centerX + radius * Math.cos(angle);
        const dotY = centerY + radius * Math.sin(angle);
        pdf.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
        pdf.circle(dotX, dotY, 1.5, 'F');
      }
    }

    // Center text - improved typography
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    const progressText = `${Math.round(progress)}%`;
    const textWidth = pdf.getTextWidth(progressText);
    pdf.text(progressText, centerX - textWidth/2, centerY + 2);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
    const completeText = 'COMPLETE';
    const completeWidth = pdf.getTextWidth(completeText);
    pdf.text(completeText, centerX - completeWidth/2, centerY + 12);
  };

  // Set background
  pdf.setFillColor(colors.background[0], colors.background[1], colors.background[2]);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');

  // Clean header design - increased height to accommodate goal name
  const headerHeight = 78;
  pdf.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.rect(0, 0, pageWidth, headerHeight, 'F');

  // Header accent stripe
  pdf.setFillColor(colors.warning[0], colors.warning[1], colors.warning[2]);
  pdf.rect(0, headerHeight - 4, pageWidth, 4, 'F');

  // Enhanced personalized header following brand guidelines
  pdf.setFont('helvetica', 'bold'); // Simulating Poppins Bold
  pdf.setFontSize(20);
  pdf.setTextColor(255, 255, 255);
  
  // Goal number logic: use goal.id if it exists and isn't 'temp-id', otherwise default to 1
  const goalNumber = (goal.id && goal.id !== 'temp-id') ? goal.id : 1;
  const personalizedTitle = `${userInfo.name}: Goal #${goalNumber} Report`;
  pdf.text(personalizedTitle, 20, 28);

  // Goal name display - use goal name or default
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  pdf.setTextColor(colors.warning[0], colors.warning[1], colors.warning[2]); // Marigold color
  const goalName = goal.name || 'My Current Goal';
  pdf.text(`"${goalName}"`, 20, 40);

  // Brand name with WHITE and BOLD styling as requested
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(15); // Simulating Lato Semi-Bold scaled for PDF
  pdf.setTextColor(255, 255, 255); // WHITE as requested
  pdf.text('My College Finance', 20, 52);

  // Subtitle
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11); // Simulating Open Sans Regular scaled for PDF
  pdf.setTextColor(220, 230, 255);
  pdf.text('SAVINGS GOAL ANALYSIS REPORT', 20, 62);

  // Right side header info
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(200, 220, 255);
  const dateText = `Generated: ${formatDate(new Date())}`;
  const dateWidth = pdf.getTextWidth(dateText);
  pdf.text(dateText, pageWidth - 20 - dateWidth, 30);

  // Goal type indicator
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(colors.success[0], colors.success[1], colors.success[2]);
  const goalTypeText = `${(goal.goalType ?? 'General').toUpperCase()} GOAL`;
  const goalTypeWidth = pdf.getTextWidth(goalTypeText);
  pdf.text(goalTypeText, pageWidth - 20 - goalTypeWidth, 47);

  // Brand personality tagline
  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(8);
  pdf.setTextColor(180, 200, 255);
  const tagline = 'Knowledgeable • Empowering • Approachable';
  const taglineWidth = pdf.getTextWidth(tagline);
  pdf.text(tagline, pageWidth - 20 - taglineWidth, 55);

  // Safe calculations with null checks
  const calculations = calculateSavings(
    goal.targetAmount ?? 0,
    goal.currentSavings ?? 0,
    goal.targetDate ? new Date(goal.targetDate) : new Date(),
    goal.monthlyCapacity ?? 300
  );

  // Section positioning
  const startY = headerHeight + 25;

  // Accent lines below header
  pdf.setDrawColor(colors.warning[0], colors.warning[1], colors.warning[2]);
  pdf.setLineWidth(2);
  pdf.line(20, headerHeight + 12, pageWidth - 20, headerHeight + 12);

  // Metric cards layout - improved spacing
  const cardHeight = 55;
  const cardWidth = 58;
  const cardSpacing = 12;
  const totalCardsWidth = (cardWidth * 3) + (cardSpacing * 2);
  const cardsStartX = (pageWidth - totalCardsWidth) / 2;

  // Metric cards data
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

  // Draw metric cards with cleaner design
  metricCards.forEach((card, index) => {
    const cardX = cardsStartX + (index * (cardWidth + cardSpacing));

    drawCard(cardX, startY, cardWidth, cardHeight, 2);

    // Top colored border
    pdf.setFillColor(card.color[0], card.color[1], card.color[2]);
    pdf.rect(cardX, startY, cardWidth, 3, 'F');

    // Card title
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
    pdf.text(card.title, cardX + 6, startY + 16);

    // Main value - centered and prominent
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    const valueWidth = pdf.getTextWidth(card.value);
    pdf.text(card.value, cardX + (cardWidth - valueWidth) / 2, startY + 32);

    // Subtitle
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(card.color[0], card.color[1], card.color[2]);
    const subtitleWidth = pdf.getTextWidth(card.subtitle);
    pdf.text(card.subtitle, cardX + (cardWidth - subtitleWidth) / 2, startY + 44);
  });

  // Progress section - cleaner layout
  const progressSectionY = startY + cardHeight + 30;
  const leftColumnWidth = Math.floor(totalCardsWidth * 0.62);
  const rightColumnWidth = totalCardsWidth - leftColumnWidth - 15;
  const sectionHeight = 100;

  // Main progress card
  drawCard(cardsStartX, progressSectionY, leftColumnWidth, sectionHeight, 3);

  // Progress header
  pdf.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.rect(cardsStartX, progressSectionY, leftColumnWidth, 25, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(255, 255, 255);
  pdf.text('Progress Overview', cardsStartX + 15, progressSectionY + 16);

  // Progress circle
  const circleX = cardsStartX + 15;
  const circleY = progressSectionY + 35;
  const circleRadius = 25;
  drawProgressCircle(circleX, circleY, circleRadius, calculations.progressPercent);

  // Progress details - right side of circle
  const detailsX = cardsStartX + 80;

  // Remaining amount
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
  pdf.text('Remaining:', detailsX, progressSectionY + 45);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  const remaining = (goal.targetAmount ?? 0) - (goal.currentSavings ?? 0);
  pdf.text(formatCurrency(remaining), detailsX, progressSectionY + 58);

  // Time left
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
  pdf.text('Time left:', detailsX, progressSectionY + 72);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  pdf.setTextColor(colors.success[0], colors.success[1], colors.success[2]);
  const timeText = calculations.monthsRemaining === 1 ? '1 month' : `${calculations.monthsRemaining} months`;
  pdf.text(timeText, detailsX, progressSectionY + 84);

  // Status indicator
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  const statusColor = calculations.progressPercent >= 75 ? colors.success : 
                     calculations.progressPercent >= 50 ? colors.warning : colors.primary;
  pdf.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
  const statusText = calculations.progressPercent >= 75 ? 'Excellent progress!' : 
                    calculations.progressPercent >= 50 ? 'Good progress' : 'Keep going!';
  pdf.text(statusText, detailsX, progressSectionY + 95);

  // Details card (right column)
  const timelineX = cardsStartX + leftColumnWidth + 15;
  drawCard(timelineX, progressSectionY, rightColumnWidth, sectionHeight, 3);

  // Details header
  pdf.setFillColor(colors.success[0], colors.success[1], colors.success[2]);
  pdf.rect(timelineX, progressSectionY, rightColumnWidth, 25, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(255, 255, 255);
  pdf.text('Goal Details', timelineX + 12, progressSectionY + 16);

  // Progress bar
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
  pdf.text('Overall Progress', timelineX + 12, progressSectionY + 40);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(colors.success[0], colors.success[1], colors.success[2]);
  pdf.text(`${Math.round(calculations.progressPercent)}%`, timelineX + rightColumnWidth - 20, progressSectionY + 40);

  drawProgressBar(timelineX + 12, progressSectionY + 44, rightColumnWidth - 24, 5, calculations.progressPercent, colors.success);

  // Goal category
  pdf.setFillColor(colors.lightAccent[0], colors.lightAccent[1], colors.lightAccent[2]);
  pdf.rect(timelineX + 12, progressSectionY + 58, rightColumnWidth - 24, 16, 'F');

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
  pdf.text('Goal Category:', timelineX + 16, progressSectionY + 66);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  const goalTypeCapitalized = (goal.goalType ?? 'General').charAt(0).toUpperCase() + (goal.goalType ?? 'general').slice(1);
  pdf.text(goalTypeCapitalized, timelineX + 16, progressSectionY + 70);

  // User info
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
  pdf.text('Created by:', timelineX + 12, progressSectionY + 86);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  pdf.text(userInfo.name ?? 'User', timelineX + 45, progressSectionY + 86);

  // Scenarios section - improved design
  const scenariosY = progressSectionY + sectionHeight + 20;
  const scenarioHeight = 50;
  drawCard(cardsStartX, scenariosY, totalCardsWidth, scenarioHeight, 3);

  // Header
  pdf.setFillColor(colors.warning[0], colors.warning[1], colors.warning[2]);
  pdf.rect(cardsStartX, scenariosY, totalCardsWidth, 20, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.setTextColor(255, 255, 255);
  pdf.text('Optimization Scenarios', cardsStartX + 15, scenariosY + 13);

  // Scenario boxes - cleaner design
  const scenarioWidth = (totalCardsWidth - 40) / 2;

  // Scenario 1
  pdf.setFillColor(245, 255, 245);
  pdf.rect(cardsStartX + 15, scenariosY + 25, scenarioWidth, 20, 'F');
  pdf.setDrawColor(colors.success[0], colors.success[1], colors.success[2]);
  pdf.setLineWidth(2);
  pdf.line(cardsStartX + 15, scenariosY + 25, cardsStartX + 15, scenariosY + 45);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(colors.success[0], colors.success[1], colors.success[2]);
  pdf.text('Save $50 more/month', cardsStartX + 20, scenariosY + 33);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  pdf.text(`${calculations.scenarios?.save50More?.monthsSaved ?? 0} months earlier`, cardsStartX + 20, scenariosY + 41);

  // Scenario 2
  pdf.setFillColor(255, 248, 235);
  pdf.rect(cardsStartX + 25 + scenarioWidth, scenariosY + 25, scenarioWidth, 20, 'F');
  pdf.setDrawColor(colors.warning[0], colors.warning[1], colors.warning[2]);
  pdf.setLineWidth(2);
  pdf.line(cardsStartX + 25 + scenarioWidth, scenariosY + 25, cardsStartX + 25 + scenarioWidth, scenariosY + 45);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(colors.warning[0], colors.warning[1], colors.warning[2]);
  pdf.text('Save $100 more/month', cardsStartX + 30 + scenarioWidth, scenariosY + 33);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  pdf.text(`${calculations.scenarios?.save100More?.monthsSaved ?? 0} months earlier`, cardsStartX + 30 + scenarioWidth, scenariosY + 41);

  // Clean footer
  const footerY = pageHeight - 30;

  // Footer background
  pdf.setFillColor(colors.background[0], colors.background[1], colors.background[2]);
  pdf.rect(0, footerY, pageWidth, 30, 'F');

  // Accent line
  pdf.setDrawColor(colors.warning[0], colors.warning[1], colors.warning[2]);
  pdf.setLineWidth(1);
  pdf.line(20, footerY + 5, pageWidth - 20, footerY + 5);

  // Footer content
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.text('My College Finance', 20, footerY + 15);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);  
  pdf.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  pdf.text('Knowledgeable • Empowering • Approachable • Reliable • Inclusive', 20, footerY + 22);

  // Footer right
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  const footerRight = `Report for ${userInfo.name} • ${formatDate(new Date())}`;
  const footerRightWidth = pdf.getTextWidth(footerRight);
  pdf.text(footerRight, pageWidth - 20 - footerRightWidth, footerY + 15);

  // Enhanced filename with user name and goal number
  const userName = userInfo.name?.replace(/[^a-z0-9\s]/gi, '').replace(/\s+/g, '_').toLowerCase() ?? 'user';
  const goalNameFile = goal.name?.replace(/[^a-z0-9\s]/gi, '').replace(/\s+/g, '_').toLowerCase() ?? 'savings_goal';
  const fileName = `${userName}_goal_${goalNumber}_${goalNameFile}_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
}
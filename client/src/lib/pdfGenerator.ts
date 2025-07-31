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

  // My College Finance Brand Color Palette - Space Dust Theme
  const colors = {
    primary: [1, 38, 153] as [number, number, number], // Space Dust #012699
    primaryLight: [20, 60, 180] as [number, number, number], // Lighter Space Dust variant
    primaryDark: [0, 25, 120] as [number, number, number], // Darker Space Dust variant
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

  // Clean, uncluttered header design with Space Dust background and extra breathing room
  const headerHeight = 50;
  pdf.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.rect(0, 0, pageWidth, headerHeight, 'F');

  // Thinner Marigold accent bottom border
  pdf.setFillColor(colors.warning[0], colors.warning[1], colors.warning[2]);
  pdf.rect(0, headerHeight - 1, pageWidth, 1, 'F');

  // HERO: Goal Name - Largest, most prominent
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(22);
  pdf.setTextColor(255, 255, 255);
  const goalName = goal.name || 'My Current Goal';
  pdf.text(`"${goalName}"`, 20, 18);

  // SECONDARY: User context - Clean spacing below goal name
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(14);
  pdf.setTextColor(220, 235, 255); // Lighter blue for better contrast
  const goalNumber = (goal.id && goal.id !== 'temp-id') ? goal.id : 1;
  const userContext = `${userInfo.name}: Goal #${goalNumber} Report`;
  pdf.text(userContext, 20, 30);

  // TERTIARY: Report type only - Clean, single element with more breathing room
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);
  pdf.setTextColor(200, 215, 245);
  pdf.text('Savings Goal Analysis Report', 20, 43);

  // RIGHT SIDE: Clean metadata section
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(200, 215, 245);
  const dateText = `Generated: ${formatDate(new Date())}`;
  const dateWidth = pdf.getTextWidth(dateText);
  pdf.text(dateText, pageWidth - 20 - dateWidth, 16);

  // Goal type badge - More subtle
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7);
  pdf.setTextColor(colors.success[0], colors.success[1], colors.success[2]);
  const goalTypeText = `${(goal.goalType ?? 'General').toUpperCase()} GOAL`;
  const goalTypeWidth = pdf.getTextWidth(goalTypeText);
  pdf.text(goalTypeText, pageWidth - 20 - goalTypeWidth, 26);



  // Safe calculations with null checks
  const calculations = calculateSavings(
    goal.targetAmount ?? 0,
    goal.currentSavings ?? 0,
    goal.targetDate ? new Date(goal.targetDate) : new Date(),
    goal.monthlyCapacity ?? 300
  );

  // Section positioning
  const startY = headerHeight + 25;

  // Medium gray accent line below header
  pdf.setDrawColor(128, 128, 128); // Medium gray
  pdf.setLineWidth(1);
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

  // Reality Check Analysis section - enhanced design
  const realityCheckY = progressSectionY + sectionHeight + 20;
  const realityCheckHeight = 130;
  drawCard(cardsStartX, realityCheckY, totalCardsWidth, realityCheckHeight, 3);

  // Calculate Reality Check data
  const goalRemaining = (goal.targetAmount ?? 0) - (goal.currentSavings ?? 0);
  const monthlyRequired = calculations.monthlyRequired;
  const monthsRemaining = calculations.monthsRemaining;
  
  const getFeasibilityScore = () => {
    if (monthlyRequired > 500) return { score: "Challenging", color: [220, 38, 38] };
    if (monthlyRequired > 300) return { score: "Moderate", color: [217, 119, 6] };
    return { score: "Achievable", color: [5, 150, 105] };
  };
  
  const getSuccessRate = () => {
    if (monthlyRequired > 400) return 45;
    if (monthlyRequired > 300) return 65;
    if (monthlyRequired > 200) return 80;
    return 85;
  };
  
  const dailyAmount = monthlyRequired / 30.44;
  const weeklyAmount = monthlyRequired / 4.33;
  const coffeeEquivalent = Math.round(monthlyRequired / 5.50);
  
  const calculateAdjustment = (adjustment: number) => {
    const newMonthly = monthlyRequired + adjustment;
    const newMonths = goalRemaining / newMonthly;
    const monthsDifference = monthsRemaining - newMonths;
    return monthsDifference;
  };
  
  const feasibility = getFeasibilityScore();
  const successRate = getSuccessRate();

  // Header
  pdf.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.rect(cardsStartX, realityCheckY, totalCardsWidth, 20, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.setTextColor(255, 255, 255);
  pdf.text('Reality Check Analysis', cardsStartX + 15, realityCheckY + 13);

  // Reality Check cards
  const realityCardWidth = (totalCardsWidth - 45) / 2;

  // Plan Feasibility Card
  pdf.setFillColor(248, 250, 252);
  pdf.rect(cardsStartX + 15, realityCheckY + 25, realityCardWidth, 25, 'F');
  pdf.setDrawColor(16, 185, 129);
  pdf.setLineWidth(2);
  pdf.line(cardsStartX + 15, realityCheckY + 25, cardsStartX + 15, realityCheckY + 50);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  pdf.text('Plan Feasibility', cardsStartX + 20, realityCheckY + 33);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(feasibility.color[0], feasibility.color[1], feasibility.color[2]);
  pdf.text(feasibility.score, cardsStartX + 20, realityCheckY + 43);

  // Success Probability Card
  pdf.setFillColor(248, 250, 252);
  pdf.rect(cardsStartX + 30 + realityCardWidth, realityCheckY + 25, realityCardWidth, 25, 'F');
  pdf.setDrawColor(59, 130, 246);
  pdf.setLineWidth(2);
  pdf.line(cardsStartX + 30 + realityCardWidth, realityCheckY + 25, cardsStartX + 30 + realityCardWidth, realityCheckY + 50);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  pdf.text('Success Probability', cardsStartX + 35 + realityCardWidth, realityCheckY + 33);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(59, 130, 246);
  pdf.text(`${successRate}% likely to succeed`, cardsStartX + 35 + realityCardWidth, realityCheckY + 43);

  // Daily Reality Breakdown
  const dailyBreakdownY = realityCheckY + 60;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  pdf.text('Daily Reality Breakdown', cardsStartX + 15, dailyBreakdownY);

  const breakdownCardWidth = (totalCardsWidth - 60) / 3;
  
  // Per Day
  pdf.setFillColor(241, 245, 249);
  pdf.rect(cardsStartX + 15, dailyBreakdownY + 10, breakdownCardWidth, 20, 'F');
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  pdf.text('Per Day', cardsStartX + 18, dailyBreakdownY + 18);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  pdf.text(formatCurrency(dailyAmount), cardsStartX + 18, dailyBreakdownY + 25);

  // Per Week
  pdf.setFillColor(241, 245, 249);
  pdf.rect(cardsStartX + 25 + breakdownCardWidth, dailyBreakdownY + 10, breakdownCardWidth, 20, 'F');
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  pdf.text('Per Week', cardsStartX + 28 + breakdownCardWidth, dailyBreakdownY + 18);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  pdf.text(formatCurrency(weeklyAmount), cardsStartX + 28 + breakdownCardWidth, dailyBreakdownY + 25);

  // Coffee Equivalent
  pdf.setFillColor(241, 245, 249);
  pdf.rect(cardsStartX + 35 + (breakdownCardWidth * 2), dailyBreakdownY + 10, breakdownCardWidth, 20, 'F');
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  pdf.text('Coffee Equivalent', cardsStartX + 38 + (breakdownCardWidth * 2), dailyBreakdownY + 18);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  pdf.text(`${coffeeEquivalent} cups/month`, cardsStartX + 38 + (breakdownCardWidth * 2), dailyBreakdownY + 25);

  // Precision Adjustments
  const adjustmentsY = dailyBreakdownY + 40;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  pdf.text('Precision Adjustments', cardsStartX + 15, adjustmentsY);

  pdf.setFillColor(248, 250, 252);
  pdf.rect(cardsStartX + 15, adjustmentsY + 10, totalCardsWidth - 30, 25, 'F');
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  
  pdf.text('Save $25 more per month:', cardsStartX + 20, adjustmentsY + 20);
  pdf.setTextColor(5, 150, 105);
  pdf.text(`${calculateAdjustment(25).toFixed(1)} months earlier`, cardsStartX + 110, adjustmentsY + 20);
  
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  pdf.text('Save $50 more per month:', cardsStartX + 20, adjustmentsY + 30);
  pdf.setTextColor(5, 150, 105);
  pdf.text(`${calculateAdjustment(50).toFixed(1)} months earlier`, cardsStartX + 110, adjustmentsY + 30);

  // Clean footer
  const footerY = pageHeight - 30;

  // Footer background
  pdf.setFillColor(colors.background[0], colors.background[1], colors.background[2]);
  pdf.rect(0, footerY, pageWidth, 30, 'F');

  // Accent line
  pdf.setDrawColor(colors.warning[0], colors.warning[1], colors.warning[2]);
  pdf.setLineWidth(1);
  pdf.line(20, footerY + 5, pageWidth - 20, footerY + 5);

  // Footer content with clickable link
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  const brandText = 'MY COLLEGE FINANCE';
  const brandWidth = pdf.getTextWidth(brandText);
  pdf.textWithLink(brandText, 20, footerY + 15, { url: 'https://www.mycollegefinance.com/' });
  
  // Add underline to indicate it's a link
  pdf.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.setLineWidth(0.3);
  pdf.line(20, footerY + 16, 20 + brandWidth, footerY + 16);

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
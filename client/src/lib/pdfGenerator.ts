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
  
  // Enhanced calculation function with What-If scenarios
  const calculateWhatIfScenarios = (targetAmount: number, currentSavings: number, targetDate: Date, monthlyRequired: number) => {
    const remaining = targetAmount - currentSavings;
    const today = new Date();
    const monthsRemaining = Math.max(1, Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30)));
    
    const dailyAmount = monthlyRequired / 30.44;
    const weeklyAmount = monthlyRequired / 4.33;
    
    // What-if scenarios
    const save25More = {
      amount: monthlyRequired + 25,
      monthsSaved: Math.max(0, monthsRemaining - Math.ceil(remaining / (monthlyRequired + 25)))
    };
    
    const save50More = {
      amount: monthlyRequired + 50,
      monthsSaved: Math.max(0, monthsRemaining - Math.ceil(remaining / (monthlyRequired + 50)))
    };
    
    const save100More = {
      amount: monthlyRequired + 100,
      monthsSaved: Math.max(0, monthsRemaining - Math.ceil(remaining / (monthlyRequired + 100)))
    };
    
    // Feasibility and success rate
    const getFeasibilityScore = () => {
      if (monthlyRequired > 500) return { score: "Very Challenging", color: [220, 38, 38], rate: 45 };
      if (monthlyRequired > 300) return { score: "Moderately Hard", color: [217, 119, 6], rate: 65 };
      return { score: "Realistic", color: [5, 150, 105], rate: 85 };
    };
    
    // Opportunity cost calculations
    const coffeePerWeek = Math.min(Math.round((weeklyAmount) / 5.50), 7);
    const lunchPerWeek = Math.min(Math.round((weeklyAmount) / 15), 5);
    const streamingServices = Math.min(Math.round(monthlyRequired / 15), 3);
    
    const feasibility = getFeasibilityScore();
    
    return {
      dailyAmount,
      weeklyAmount,
      save25More,
      save50More,
      save100More,
      feasibility,
      coffeePerWeek,
      lunchPerWeek,
      streamingServices
    };
  };

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
  
  // Enhanced What-If Scenarios calculations
  const whatIfData = calculateWhatIfScenarios(
    goal.targetAmount ?? 0,
    goal.currentSavings ?? 0,
    goal.targetDate ? new Date(goal.targetDate) : new Date(),
    calculations.monthlyRequired
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

  // Enhanced What-If Scenarios section (replaces old Reality Check)
  const whatIfSectionY = progressSectionY + sectionHeight + 20;
  const whatIfSectionHeight = 280; // Increased height for more content
  drawCard(cardsStartX, whatIfSectionY, totalCardsWidth, whatIfSectionHeight, 3);

  // Use enhanced What-If data
  const goalRemaining = (goal.targetAmount ?? 0) - (goal.currentSavings ?? 0);
  const monthlyRequired = calculations.monthlyRequired;
  const monthsRemaining = calculations.monthsRemaining;
  const feasibility = whatIfData.feasibility;
  const successRate = feasibility.rate;

  // Header - What-If Scenarios
  pdf.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.rect(cardsStartX, whatIfSectionY, totalCardsWidth, 25, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(255, 255, 255);
  pdf.text('What-If Scenarios & Progress Analysis', cardsStartX + 15, whatIfSectionY + 16);

  // Feasibility and Success Rate Cards
  const summaryCardWidth = (totalCardsWidth - 60) / 3;
  let currentY = whatIfSectionY + 35;
  
  // Plan Feasibility Card
  pdf.setFillColor(248, 250, 252);
  pdf.rect(cardsStartX + 15, currentY, summaryCardWidth, 30, 'F');
  pdf.setDrawColor(feasibility.color[0], feasibility.color[1], feasibility.color[2]);
  pdf.setLineWidth(2);
  pdf.line(cardsStartX + 15, currentY, cardsStartX + 15, currentY + 30);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  pdf.text('Plan Difficulty', cardsStartX + 20, currentY + 10);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(feasibility.color[0], feasibility.color[1], feasibility.color[2]);
  pdf.text(feasibility.score, cardsStartX + 20, currentY + 22);

  // Success Rate Card
  pdf.setFillColor(248, 250, 252);
  pdf.rect(cardsStartX + 30 + summaryCardWidth, currentY, summaryCardWidth, 30, 'F');
  pdf.setDrawColor(59, 130, 246);
  pdf.setLineWidth(2);
  pdf.line(cardsStartX + 30 + summaryCardWidth, currentY, cardsStartX + 30 + summaryCardWidth, currentY + 30);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  pdf.text('Success Rate', cardsStartX + 35 + summaryCardWidth, currentY + 10);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(59, 130, 246);
  pdf.text(`${successRate}%`, cardsStartX + 35 + summaryCardWidth, currentY + 22);
  
  // Daily Breakdown Card
  pdf.setFillColor(248, 250, 252);
  pdf.rect(cardsStartX + 45 + (summaryCardWidth * 2), currentY, summaryCardWidth, 30, 'F');
  pdf.setDrawColor(colors.warning[0], colors.warning[1], colors.warning[2]);
  pdf.setLineWidth(2);
  pdf.line(cardsStartX + 45 + (summaryCardWidth * 2), currentY, cardsStartX + 45 + (summaryCardWidth * 2), currentY + 30);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  pdf.text('Per Day', cardsStartX + 50 + (summaryCardWidth * 2), currentY + 10);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  pdf.text(formatCurrency(whatIfData.dailyAmount), cardsStartX + 50 + (summaryCardWidth * 2), currentY + 22);

  // What-If Scenario Analysis
  currentY += 45;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  pdf.text('What If You Save More Each Month?', cardsStartX + 15, currentY);
  
  currentY += 15;
  const scenarioCardWidth = (totalCardsWidth - 75) / 3;
  
  // Save $25 More Scenario
  pdf.setFillColor(220, 252, 231);
  pdf.rect(cardsStartX + 15, currentY, scenarioCardWidth, 35, 'F');
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  pdf.text('Save $25 More', cardsStartX + 20, currentY + 10);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(colors.success[0], colors.success[1], colors.success[2]);
  pdf.text(`${formatCurrency(whatIfData.save25More.amount)}/mo`, cardsStartX + 20, currentY + 20);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  pdf.text(`${whatIfData.save25More.monthsSaved} months earlier`, cardsStartX + 20, currentY + 30);
  
  // Save $50 More Scenario
  pdf.setFillColor(219, 234, 254);
  pdf.rect(cardsStartX + 30 + scenarioCardWidth, currentY, scenarioCardWidth, 35, 'F');
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  pdf.text('Save $50 More', cardsStartX + 35 + scenarioCardWidth, currentY + 10);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(59, 130, 246);
  pdf.text(`${formatCurrency(whatIfData.save50More.amount)}/mo`, cardsStartX + 35 + scenarioCardWidth, currentY + 20);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  pdf.text(`${whatIfData.save50More.monthsSaved} months earlier`, cardsStartX + 35 + scenarioCardWidth, currentY + 30);
  
  // Save $100 More Scenario
  pdf.setFillColor(254, 240, 138);
  pdf.rect(cardsStartX + 45 + (scenarioCardWidth * 2), currentY, scenarioCardWidth, 35, 'F');
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
  pdf.text('Save $100 More', cardsStartX + 50 + (scenarioCardWidth * 2), currentY + 10);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(colors.warning[0], colors.warning[1], colors.warning[2]);
  pdf.text(`${formatCurrency(whatIfData.save100More.amount)}/mo`, cardsStartX + 50 + (scenarioCardWidth * 2), currentY + 20);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  pdf.text(`${whatIfData.save100More.monthsSaved} months earlier`, cardsStartX + 50 + (scenarioCardWidth * 2), currentY + 30);

  // Smart Ways to Save More - Opportunity Cost Analysis
  currentY += 50;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  pdf.text('Smart Ways to Reach Your Goal', cardsStartX + 15, currentY);

  currentY += 15;
  pdf.setFillColor(248, 250, 252);
  pdf.rect(cardsStartX + 15, currentY, totalCardsWidth - 30, 50, 'F');
  
  // Coffee savings
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  pdf.text('☕ Make coffee at home:', cardsStartX + 20, currentY + 12);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(colors.success[0], colors.success[1], colors.success[2]);
  pdf.text(`Skip ${whatIfData.coffeePerWeek} coffees/week → Save ~$110/month`, cardsStartX + 20, currentY + 22);
  
  // Lunch savings
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  pdf.text('🍽️ Pack lunch instead:', cardsStartX + 20, currentY + 32);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.text(`Pack ${whatIfData.lunchPerWeek} lunches/week → Save ~$180/month`, cardsStartX + 20, currentY + 42);
  
  // Streaming savings
  if (whatIfData.streamingServices > 0) {
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    pdf.text('📱 Cancel streaming services:', cardsStartX + 20, currentY + 52);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(colors.warning[0], colors.warning[1], colors.warning[2]);
    pdf.text(`Cancel ${whatIfData.streamingServices} services → Save ~$45/month`, cardsStartX + 20, currentY + 62);
  }

  // Progress Insights Section
  const insightsY = currentY + 75;
  
  // Progress Insights Header
  pdf.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.rect(cardsStartX, insightsY, totalCardsWidth, 20, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.setTextColor(255, 255, 255);
  pdf.text('Progress Insights', cardsStartX + 15, insightsY + 13);

  // Generate insights based on progress
  const generateInsights = () => {
    const insights = [];
    
    if (calculations.progressPercent >= 100) {
      insights.push({
        title: 'Goal Achieved!',
        message: 'Congratulations! You\'ve reached your savings target.',
        color: colors.success
      });
    } else if (calculations.progressPercent >= 75) {
      insights.push({
        title: 'Almost There!',
        message: `You're ${Math.round(calculations.progressPercent)}% complete. Stay consistent to reach your goal.`,
        color: colors.primary
      });
    } else if (calculations.progressPercent >= 50) {
      insights.push({
        title: 'Halfway Mark!',
        message: 'Great progress! You\'ve built a solid foundation for your goal.',
        color: colors.primaryLight
      });
    } else if (calculations.progressPercent >= 25) {
      insights.push({
        title: 'Building Momentum',
        message: 'You\'re off to a good start! Keep up the consistent saving habit.',
        color: colors.warning
      });
    } else {
      insights.push({
        title: 'Getting Started',
        message: 'Every journey begins with a single step. You\'ve got this!',
        color: colors.primaryDark
      });
    }

    // Add capacity warning if needed
    const isCapacityInsufficient = (goal.monthlyCapacity ?? 0) < calculations.monthlyRequired;
    if (isCapacityInsufficient && calculations.progressPercent < 100) {
      insights.push({
        title: 'Capacity Alert',
        message: `Your monthly capacity ($${(goal.monthlyCapacity ?? 0).toLocaleString()}) is below what's needed ($${calculations.monthlyRequired.toLocaleString()}).`,
        color: [255, 165, 0] as [number, number, number] // Orange
      });
    }

    return insights.slice(0, 2); // Limit to 2 insights for space
  };

  const insights = generateInsights();
  
  // Draw insights
  insights.forEach((insight, index) => {
    const insightCardY = insightsY + 25 + (index * 35);
    
    pdf.setFillColor(248, 250, 252);
    pdf.rect(cardsStartX + 15, insightCardY, totalCardsWidth - 30, 30, 'F');
    
    // Colored left border
    pdf.setFillColor(insight.color[0], insight.color[1], insight.color[2]);
    pdf.rect(cardsStartX + 15, insightCardY, 3, 30, 'F');
    
    // Title
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(insight.color[0], insight.color[1], insight.color[2]);
    pdf.text(insight.title, cardsStartX + 25, insightCardY + 12);
    
    // Message
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    
    // Word wrap for long messages
    const maxWidth = totalCardsWidth - 50;
    const words = insight.message.split(' ');
    let line = '';
    let yOffset = 0;
    
    words.forEach((word, wordIndex) => {
      const testLine = line + word + ' ';
      const textWidth = pdf.getTextWidth(testLine);
      
      if (textWidth > maxWidth && line !== '') {
        pdf.text(line.trim(), cardsStartX + 25, insightCardY + 22 + yOffset);
        line = word + ' ';
        yOffset += 8;
      } else {
        line = testLine;
      }
    });
    
    if (line.trim() !== '') {
      pdf.text(line.trim(), cardsStartX + 25, insightCardY + 22 + yOffset);
    }
  });

  // Decision Helper Section
  const decisionHelperY = insightsY + 25 + (insights.length * 35) + 20;
  const isOverCapacity = (goal.monthlyCapacity ?? 0) < calculations.monthlyRequired;
  const highSavingsRequired = calculations.monthlyRequired > 300;
  
  if (decisionHelperY + 100 < pageHeight - 50) { // Check if we have space
    pdf.setFillColor(colors.warning[0], colors.warning[1], colors.warning[2]);
    pdf.rect(cardsStartX, decisionHelperY, totalCardsWidth, 20, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(255, 255, 255);
    pdf.text('Decision Helper', cardsStartX + 15, decisionHelperY + 13);

    let helperContentY = decisionHelperY + 30;

    // Show appropriate message based on goal status
    if (isOverCapacity) {
      // Capacity alert
      pdf.setFillColor(255, 240, 240);
      pdf.rect(cardsStartX + 15, helperContentY, totalCardsWidth - 30, 35, 'F');
      
      // Red left border
      pdf.setFillColor(239, 68, 68);
      pdf.rect(cardsStartX + 15, helperContentY, 3, 35, 'F');
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(239, 68, 68);
      pdf.text('Reality Check Alert!', cardsStartX + 25, helperContentY + 12);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
      pdf.text(`You need $${calculations.monthlyRequired}/month but set capacity at`, cardsStartX + 25, helperContentY + 22);
      pdf.text(`$${goal.monthlyCapacity}/month. Either increase your savings capacity`, cardsStartX + 25, helperContentY + 30);
      pdf.text('or extend your timeline.', cardsStartX + 25, helperContentY + 38);
      
      helperContentY += 45;
    } else if (highSavingsRequired) {
      // High savings recommendations
      pdf.setFillColor(254, 252, 232);
      pdf.rect(cardsStartX + 15, helperContentY, totalCardsWidth - 30, 55, 'F');
      
      // Amber left border
      pdf.setFillColor(245, 158, 11);
      pdf.rect(cardsStartX + 15, helperContentY, 3, 55, 'F');
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(245, 158, 11);
      pdf.text(`To save $${calculations.monthlyRequired}/month, choose 2-3 of these:`, cardsStartX + 25, helperContentY + 12);
      
      const recommendations = [
        'Make coffee at home 5 days/week (saves ~$110/month)',
        'Pack lunch 3 times/week (saves ~$180/month)',
        'Cancel 2 streaming services (saves ~$30/month)',
        'Limit dining out to 2x/month (saves ~$100/month)'
      ];

      recommendations.forEach((rec, index) => {
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
        pdf.text('✓', cardsStartX + 25, helperContentY + 22 + (index * 10));
        pdf.text(rec, cardsStartX + 32, helperContentY + 22 + (index * 10));
      });
      
      helperContentY += 65;
    } else {
      // Positive confirmation
      pdf.setFillColor(240, 253, 244);
      pdf.rect(cardsStartX + 15, helperContentY, totalCardsWidth - 30, 35, 'F');
      
      // Green left border
      pdf.setFillColor(34, 197, 94);
      pdf.rect(cardsStartX + 15, helperContentY, 3, 35, 'F');
      
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(34, 197, 94);
      pdf.text('Congratulations, you\'re good to go!', cardsStartX + 25, helperContentY + 12);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
      pdf.text('Your savings plan looks realistic and achievable. Alerts are only', cardsStartX + 25, helperContentY + 22);
      pdf.text('displayed when there\'s an issue or problem with your savings goal.', cardsStartX + 25, helperContentY + 30);
      
      helperContentY += 45;
    }

    // Quick Savings Tips Section (if space still allows)
    const tipsY = helperContentY + 10;
    if (tipsY + 60 < pageHeight - 50) {
      pdf.setFillColor(colors.success[0], colors.success[1], colors.success[2]);
      pdf.rect(cardsStartX, tipsY, totalCardsWidth, 20, 'F');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(12);
      pdf.setTextColor(255, 255, 255);
      pdf.text('Quick Savings Tips', cardsStartX + 15, tipsY + 13);

      // Trade-off tips
      const tips = [
        'Skip coffee shop 3x/week = Save ~$66/month',
        'Pack lunch 2x/week = Save ~$120/month',
        'Cancel 1 streaming service = Save ~$15/month',
        'Limit dining out = Save ~$80/month'
      ];

      tips.forEach((tip, index) => {
        if (tipsY + 30 + (index * 12) < pageHeight - 50) {
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(9);
          pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
          pdf.text(`• ${tip}`, cardsStartX + 20, tipsY + 30 + (index * 12));
        }
      });
    }
  }

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

  // Comprehensive What-If Scenarios filename with user name and goal type
  const userName = userInfo.name?.replace(/[^a-z0-9\s]/gi, '').replace(/\s+/g, '_').toLowerCase() ?? 'user';
  const goalType = goal.goalType?.replace(/[^a-z0-9\s]/gi, '').replace(/\s+/g, '_').toLowerCase() ?? 'savings';
  const goalNameFile = goal.name?.replace(/[^a-z0-9\s]/gi, '').replace(/\s+/g, '_').toLowerCase() ?? 'goal';
  const fileName = `${userName}_${goalType}_${goalNameFile}_what_if_scenarios_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
}
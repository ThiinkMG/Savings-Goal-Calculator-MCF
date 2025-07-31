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

  // Add logo and header text
  try {
    // Fetch and add logo image
    const logoUrl = 'https://static.wixstatic.com/media/c24a60_577eb503a3c1402b846b9ec4a2afd46e~mv2.png';
    
    // Create a canvas to convert the image to base64
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const logoImg = new Image();
    logoImg.crossOrigin = 'anonymous';
    
    await new Promise((resolve, reject) => {
      logoImg.onload = () => {
        const logoWidth = 30;
        const logoHeight = 30;
        
        // Set canvas size
        canvas.width = logoWidth * 2; // Higher resolution
        canvas.height = logoHeight * 2;
        
        // Draw image to canvas
        ctx?.drawImage(logoImg, 0, 0, canvas.width, canvas.height);
        
        // Convert to base64 and add to PDF
        const logoDataUrl = canvas.toDataURL('image/png');
        pdf.addImage(logoDataUrl, 'PNG', 20, 10, logoWidth, logoHeight);
        resolve(logoDataUrl);
      };
      
      logoImg.onerror = () => reject(new Error('Failed to load logo'));
      logoImg.src = logoUrl;
    });
    
    // Header text positioned next to logo
    pdf.setFontSize(20);
    pdf.setTextColor(255, 255, 255);
    pdf.text('My College Finance', 58, 22);

    pdf.setFontSize(10);
    pdf.setTextColor(220, 220, 255);
    pdf.text('SAVINGS GOAL DASHBOARD', 58, 32);
    
  } catch (error) {
    console.warn('Logo loading failed, using text-only header:', error);
    // Fallback if logo fails to load
    pdf.setFontSize(20);
    pdf.setTextColor(255, 255, 255);
    pdf.text('My College Finance', 20, 22);

    pdf.setFontSize(10);
    pdf.setTextColor(220, 220, 255);
    pdf.text('SAVINGS GOAL DASHBOARD', 20, 32);
  }

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

  // Draw metric cards with enhanced modern design
  metricCards.forEach((card, index) => {
    const cardX = cardsStartX + (index * (cardWidth + cardSpacing));

    drawCleanCard(cardX, startY, cardWidth, cardHeight);

    // Add subtle colored top border for visual interest
    pdf.setDrawColor(card.color[0], card.color[1], card.color[2]);
    pdf.setLineWidth(2);
    pdf.line(cardX, startY, cardX + cardWidth, startY);

    // Category label at top (smaller, uppercase)
    pdf.setFontSize(7);
    pdf.setTextColor(colors.textMuted[0], colors.textMuted[1], colors.textMuted[2]);
    pdf.text(card.title, cardX + 8, startY + 14);

    // Main value (large, bold, centered)
    pdf.setFontSize(18);
    pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    const valueWidth = pdf.getTextWidth(card.value);
    pdf.text(card.value, cardX + (cardWidth - valueWidth) / 2, startY + 28);

    // Progress/status indicator (smaller, colored)
    pdf.setFontSize(7);
    pdf.setTextColor(card.color[0], card.color[1], card.color[2]);
    const subtitleWidth = pdf.getTextWidth(card.subtitle);
    pdf.text(card.subtitle, cardX + (cardWidth - subtitleWidth) / 2, startY + 42);
  });

  // Large progress section with side-by-side layout
  const progressSectionY = startY + cardHeight + 24;
  const progressCardWidth = Math.floor(totalCardsWidth * 0.58);
  const detailsCardWidth = totalCardsWidth - progressCardWidth - cardSpacing;

  // Main progress card - enhanced design
  const progressCardHeight = 92;
  drawCleanCard(cardsStartX, progressSectionY, progressCardWidth, progressCardHeight);

  // Add colored header
  pdf.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.rect(cardsStartX, progressSectionY, progressCardWidth, 6, 'F');

  pdf.setFontSize(13);
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  pdf.text('Progress Overview', cardsStartX + 12, progressSectionY + 20);

  // Large donut chart with better positioning
  drawDonutChart(cardsStartX + 20, progressSectionY + 28, 26, calculations.progressPercent);

  // Progress details next to chart with better spacing
  const detailsX = cardsStartX + 72;
  
  // Mini stat boxes within the progress card
  pdf.setFillColor(250, 251, 252); // Very light background
  pdf.rect(detailsX, progressSectionY + 32, progressCardWidth - 82, 18, 'F');
  
  pdf.setFontSize(8);
  pdf.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
  pdf.text('REMAINING AMOUNT', detailsX + 4, progressSectionY + 38);

  pdf.setFontSize(14);
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  const remaining = (goal.targetAmount || 0) - (goal.currentSavings || 0);
  pdf.text(formatCurrency(remaining), detailsX + 4, progressSectionY + 46);

  // Second mini stat box
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

  // Timeline/Details card with enhanced styling
  const timelineX = cardsStartX + progressCardWidth + cardSpacing;
  drawCleanCard(timelineX, progressSectionY, detailsCardWidth, progressCardHeight);

  // Add colored header
  pdf.setFillColor(colors.success[0], colors.success[1], colors.success[2]);
  pdf.rect(timelineX, progressSectionY, detailsCardWidth, 6, 'F');

  pdf.setFontSize(13);
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  pdf.text('Timeline', timelineX + 8, progressSectionY + 20);

  // Enhanced progress bars with better visual hierarchy
  pdf.setFontSize(8);
  pdf.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
  pdf.text('Overall Progress', timelineX + 8, progressSectionY + 32);
  
  // Progress percentage on the right
  pdf.setFontSize(10);
  pdf.setTextColor(colors.success[0], colors.success[1], colors.success[2]);
  pdf.text(`${Math.round(calculations.progressPercent)}%`, timelineX + detailsCardWidth - 20, progressSectionY + 32);
  
  drawModernProgressBar(timelineX + 8, progressSectionY + 36, detailsCardWidth - 16, 4, calculations.progressPercent, colors.success);

  // Monthly progress with better styling
  const monthlyProgress = Math.min(100, ((goal.currentSavings || 0) % calculations.monthlyRequired) / calculations.monthlyRequired * 100);
  pdf.setFontSize(8);
  pdf.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
  pdf.text('This Month', timelineX + 8, progressSectionY + 50);
  
  pdf.setFontSize(10);
  pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.text(`${Math.round(monthlyProgress)}%`, timelineX + detailsCardWidth - 20, progressSectionY + 50);
  
  drawModernProgressBar(timelineX + 8, progressSectionY + 54, detailsCardWidth - 16, 4, monthlyProgress, colors.primary);

  // Goal details with better layout
  pdf.setFillColor(248, 250, 252); // Light background for info section
  pdf.rect(timelineX + 8, progressSectionY + 64, detailsCardWidth - 16, 22, 'F');
  
  pdf.setFontSize(7);
  pdf.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
  pdf.text('Goal Category:', timelineX + 12, progressSectionY + 72);
  pdf.setFontSize(9);
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  pdf.text(goal.goalType.charAt(0).toUpperCase() + goal.goalType.slice(1), timelineX + 12, progressSectionY + 78);

  pdf.setFontSize(7);
  pdf.setTextColor(colors.textLight[0], colors.textLight[1], colors.textLight[2]);
  pdf.text('Created by:', timelineX + 12, progressSectionY + 82);
  pdf.setFontSize(8);
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  pdf.text(userInfo.name, timelineX + 35, progressSectionY + 82);

  // What-if scenarios section with enhanced styling
  const scenariosY = progressSectionY + progressCardHeight + 16;
  const scenarioCardHeight = 50;
  drawCleanCard(cardsStartX, scenariosY, totalCardsWidth, scenarioCardHeight);

  // Add colored header
  pdf.setFillColor(colors.warning[0], colors.warning[1], colors.warning[2]);
  pdf.rect(cardsStartX, scenariosY, totalCardsWidth, 6, 'F');

  pdf.setFontSize(13);
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  pdf.text('Optimization Scenarios', cardsStartX + 12, scenariosY + 20);

  // Enhanced scenario boxes with modern card design
  const scenarioWidth = (totalCardsWidth - 36) / 2;
  const scenarioHeight = 22;

  // Scenario 1 - Modern card design
  pdf.setFillColor(220, 252, 231); // Light green background
  pdf.rect(cardsStartX + 12, scenariosY + 26, scenarioWidth, scenarioHeight, 'F');
  
  // Add green left border
  pdf.setDrawColor(colors.success[0], colors.success[1], colors.success[2]);
  pdf.setLineWidth(2);
  pdf.line(cardsStartX + 12, scenariosY + 26, cardsStartX + 12, scenariosY + 26 + scenarioHeight);

  pdf.setFontSize(8);
  pdf.setTextColor(colors.success[0], colors.success[1], colors.success[2]);
  pdf.text('Save $50 more/month', cardsStartX + 18, scenariosY + 32);
  pdf.setFontSize(10);
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  pdf.text(`${calculations.scenarios.save50More.monthsSaved} months earlier`, cardsStartX + 18, scenariosY + 42);

  // Scenario 2 - Modern card design
  pdf.setFillColor(237, 233, 254); // Light purple background
  pdf.rect(cardsStartX + 18 + scenarioWidth, scenariosY + 26, scenarioWidth, scenarioHeight, 'F');
  
  // Add purple left border
  pdf.setDrawColor(colors.accent[0], colors.accent[1], colors.accent[2]);
  pdf.setLineWidth(2);
  pdf.line(cardsStartX + 18 + scenarioWidth, scenariosY + 26, cardsStartX + 18 + scenarioWidth, scenariosY + 26 + scenarioHeight);

  pdf.setFontSize(8);
  pdf.setTextColor(colors.accent[0], colors.accent[1], colors.accent[2]);
  pdf.text('Save $100 more/month', cardsStartX + 24 + scenarioWidth, scenariosY + 32);
  pdf.setFontSize(10);
  pdf.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  pdf.text(`${calculations.scenarios.save100More.monthsSaved} months earlier`, cardsStartX + 24 + scenarioWidth, scenariosY + 42);

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
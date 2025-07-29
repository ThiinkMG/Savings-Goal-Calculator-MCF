export interface CalculationResult {
  monthlyRequired: number;
  monthsRemaining: number;
  amountNeeded: number;
  progressPercent: number;
  isFeasible: boolean;
  scenarios: {
    save50More: {
      monthlyAmount: number;
      monthsSaved: number;
    };
    save100More: {
      monthlyAmount: number;
      monthsSaved: number;
    };
  };
}

export function calculateSavings(
  targetAmount: number,
  currentSavings: number,
  targetDate: Date,
  monthlyCapacity?: number
): CalculationResult {
  const today = new Date();
  const monthsRemaining = Math.max(1, Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30)));
  const amountNeeded = Math.max(0, targetAmount - currentSavings);
  const monthlyRequired = amountNeeded / monthsRemaining;
  const progressPercent = targetAmount > 0 ? (currentSavings / targetAmount) * 100 : 0;
  const isFeasible = !monthlyCapacity || monthlyRequired <= monthlyCapacity;

  // What-if scenarios
  const scenario50More = {
    monthlyAmount: monthlyRequired + 50,
    monthsSaved: Math.max(0, monthsRemaining - Math.ceil(amountNeeded / (monthlyRequired + 50)))
  };

  const scenario100More = {
    monthlyAmount: monthlyRequired + 100,
    monthsSaved: Math.max(0, monthsRemaining - Math.ceil(amountNeeded / (monthlyRequired + 100)))
  };

  return {
    monthlyRequired: Math.round(monthlyRequired),
    monthsRemaining,
    amountNeeded,
    progressPercent: Math.round(progressPercent * 100) / 100,
    isFeasible,
    scenarios: {
      save50More: scenario50More,
      save100More: scenario100More
    }
  };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

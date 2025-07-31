import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Target, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ProgressVisualizationProps {
  targetAmount: number;
  currentSavings: number;
  monthlyRequired: number;
  monthsRemaining: number;
  progressPercent: number;
  monthlyCapacity: number;
}

export function ProgressVisualization({
  targetAmount,
  currentSavings,
  monthlyRequired,
  monthsRemaining,
  progressPercent,
  monthlyCapacity
}: ProgressVisualizationProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(progressPercent);
    }, 300);
    return () => clearTimeout(timer);
  }, [progressPercent]);

  const circumference = 2 * Math.PI * 56;
  const strokeDasharray = (animatedProgress / 100) * circumference;
  const amountRemaining = Math.max(0, targetAmount - currentSavings);
  
  // Calculate projected savings with current capacity
  const projectedTotal = currentSavings + (monthlyCapacity * monthsRemaining);
  const isCapacityInsufficient = monthlyCapacity < monthlyRequired;

  const milestones = [
    { label: 'Goal Set', achieved: true, icon: <Star className="w-3 h-3" /> },
    { label: '25% Complete', achieved: progressPercent >= 25, icon: <Target className="w-3 h-3" /> },
    { label: '50% Complete', achieved: progressPercent >= 50, icon: <Target className="w-3 h-3" /> },
    { label: '75% Complete', achieved: progressPercent >= 75, icon: <Target className="w-3 h-3" /> },
    { label: '100% Complete', achieved: progressPercent >= 100, icon: <TrendingUp className="w-3 h-3" /> },
  ];

  return (
    <Card className="animate-slide-in">
      <CardContent className="p-6">
        <h3 className="text-xl font-semibold text-foreground mb-6 text-center">
          Your Progress
        </h3>
        
        {/* Circular Progress */}
        <div className="flex justify-center mb-8">
          <div className="relative w-36 h-36">
            <svg className="w-36 h-36 progress-ring">
              <circle
                cx="72"
                cy="72"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-muted"
              />
              <circle
                cx="72"
                cy="72"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-brand-blue progress-ring-fill"
                strokeDasharray={`${strokeDasharray} ${circumference}`}
                strokeLinecap="round"
                style={{
                  transition: 'stroke-dasharray 1s ease-out',
                }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground">
                  {Math.round(progressPercent)}%
                </div>
                <div className="text-xs text-muted-foreground">Complete</div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="space-y-4">
          <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
            <span className="text-sm text-muted-foreground">Monthly Required</span>
            <span className="font-semibold brand-blue text-lg">
              ${monthlyRequired.toLocaleString()}
            </span>
          </div>
          
          <div className={`flex justify-between items-center p-4 rounded-lg ${
            isCapacityInsufficient 
              ? 'bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800' 
              : 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800'
          }`}>
            <span className="text-sm text-muted-foreground">Your Monthly Capacity</span>
            <span className={`font-semibold text-lg ${
              isCapacityInsufficient ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
            }`}>
              ${monthlyCapacity.toLocaleString()}
            </span>
          </div>
          
          <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
            <span className="text-sm text-muted-foreground">Projected Total</span>
            <span className={`font-semibold text-lg ${
              projectedTotal >= targetAmount ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'
            }`}>
              ${projectedTotal.toLocaleString()}
            </span>
          </div>
          
          <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
            <span className="text-sm text-muted-foreground">Time Remaining</span>
            <span className="font-semibold text-foreground">
              {monthsRemaining} months
            </span>
          </div>
          
          <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
            <span className="text-sm text-muted-foreground">Amount Remaining</span>
            <span className="font-semibold text-foreground">
              ${amountRemaining.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Milestone Badges */}
        <div className="mt-8">
          <h4 className="text-sm font-medium text-muted-foreground mb-3">
            Milestones
          </h4>
          <div className="flex flex-wrap gap-2">
            {milestones.map((milestone, index) => (
              <Badge
                key={index}
                variant={milestone.achieved ? "default" : "secondary"}
                className={`flex items-center gap-1 ${
                  milestone.achieved 
                    ? 'bg-brand-green text-white milestone-badge' 
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {milestone.icon}
                {milestone.label}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Target, TrendingUp, Lightbulb, AlertTriangle, CheckCircle, Clock, Award } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ProgressVisualizationProps {
  targetAmount: number;
  currentSavings: number;
  monthlyRequired: number;
  monthsRemaining: number;
  progressPercent: number;
  monthlyCapacity: number;
  selectedTradeOffs?: string[];
}

export function ProgressVisualization({
  targetAmount,
  currentSavings,
  monthlyRequired,
  monthsRemaining,
  progressPercent,
  monthlyCapacity,
  selectedTradeOffs = []
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

  // Generate progress insights based on current state
  const getProgressInsights = () => {
    const insights = [];
    
    if (progressPercent >= 100) {
      insights.push({
        type: 'success',
        icon: <CheckCircle className="w-4 h-4" />,
        title: 'Goal Achieved!',
        message: 'Congratulations! You\'ve reached your savings target.',
        bgColor: 'bg-green-50 dark:bg-green-950/20',
        textColor: 'text-green-800 dark:text-green-200',
        borderColor: 'border-green-200 dark:border-green-800'
      });
    } else if (progressPercent >= 75) {
      insights.push({
        type: 'success',
        icon: <TrendingUp className="w-4 h-4" />,
        title: 'Almost There!',
        message: `You're ${Math.round(progressPercent)}% complete. Stay consistent to reach your goal.`,
        bgColor: 'bg-blue-50 dark:bg-blue-950/20',
        textColor: 'text-blue-800 dark:text-blue-200',
        borderColor: 'border-blue-200 dark:border-blue-800'
      });
    } else if (progressPercent >= 50) {
      insights.push({
        type: 'progress',
        icon: <Target className="w-4 h-4" />,
        title: 'Halfway Mark!',
        message: 'Great progress! You\'ve built a solid foundation for your goal.',
        bgColor: 'bg-purple-50 dark:bg-purple-950/20',
        textColor: 'text-purple-800 dark:text-purple-200',
        borderColor: 'border-purple-200 dark:border-purple-800'
      });
    } else if (progressPercent >= 25) {
      insights.push({
        type: 'progress',
        icon: <Lightbulb className="w-4 h-4" />,
        title: 'Building Momentum',
        message: 'You\'re off to a good start! Keep up the consistent saving habit.',
        bgColor: 'bg-amber-50 dark:bg-amber-950/20',
        textColor: 'text-amber-800 dark:text-amber-200',
        borderColor: 'border-amber-200 dark:border-amber-800'
      });
    } else {
      insights.push({
        type: 'start',
        icon: <Star className="w-4 h-4" />,
        title: 'Getting Started',
        message: 'Every journey begins with a single step. You\'ve got this!',
        bgColor: 'bg-indigo-50 dark:bg-indigo-950/20',
        textColor: 'text-indigo-800 dark:text-indigo-200',
        borderColor: 'border-indigo-200 dark:border-indigo-800'
      });
    }

    // Add capacity warning if needed
    if (isCapacityInsufficient && progressPercent < 100) {
      insights.push({
        type: 'warning',
        icon: <AlertTriangle className="w-4 h-4" />,
        title: 'Capacity Alert',
        message: `Your monthly capacity ($${monthlyCapacity.toLocaleString()}) is below what's needed ($${monthlyRequired.toLocaleString()}).`,
        bgColor: 'bg-orange-50 dark:bg-orange-950/20',
        textColor: 'text-orange-800 dark:text-orange-200',
        borderColor: 'border-orange-200 dark:border-orange-800'
      });
    }

    // Add time-based insight
    if (monthsRemaining <= 3 && progressPercent < 90) {
      insights.push({
        type: 'urgent',
        icon: <Clock className="w-4 h-4" />,
        title: 'Time Running Short',
        message: `Only ${monthsRemaining} months left. Consider increasing your monthly savings.`,
        bgColor: 'bg-red-50 dark:bg-red-950/20',
        textColor: 'text-red-800 dark:text-red-200',
        borderColor: 'border-red-200 dark:border-red-800'
      });
    }

    return insights;
  };

  const progressInsights = getProgressInsights();

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

        {/* Progress Insights */}
        <div className="mt-8">
          <h4 className="text-sm font-medium text-muted-foreground mb-3">
            Progress Insights
          </h4>
          <div className="space-y-3">
            {progressInsights.map((insight, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${insight.bgColor} ${insight.borderColor}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`${insight.textColor} mt-0.5`}>
                    {insight.icon}
                  </div>
                  <div className="flex-1">
                    <h5 className={`font-medium text-sm ${insight.textColor} mb-1`}>
                      {insight.title}
                    </h5>
                    <p className={`text-xs ${insight.textColor.replace('800', '700').replace('200', '300')}`}>
                      {insight.message}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Saver Picks Section */}
            {selectedTradeOffs.length > 0 && (
              <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 rounded-lg border-l-4 border-green-500">
                <div className="flex items-center gap-2 mb-3">
                  <Award className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <h5 className="font-medium text-sm text-green-800 dark:text-green-200">Saver Picks</h5>
                </div>
                <div className="space-y-2">
                  {selectedTradeOffs.includes('coffee') && (
                    <div className="flex justify-between items-center p-2 bg-green-100 dark:bg-green-900/30 rounded-md">
                      <span className="text-xs">☕ Make coffee at home</span>
                      <span className="text-xs font-medium text-green-600">+$167/month</span>
                    </div>
                  )}
                  {selectedTradeOffs.includes('lunch') && (
                    <div className="flex justify-between items-center p-2 bg-green-100 dark:bg-green-900/30 rounded-md">
                      <span className="text-xs">🍽️ Pack lunch</span>
                      <span className="text-xs font-medium text-green-600">+$325/month</span>
                    </div>
                  )}
                  {selectedTradeOffs.includes('streaming') && (
                    <div className="flex justify-between items-center p-2 bg-green-100 dark:bg-green-900/30 rounded-md">
                      <span className="text-xs">📱 Reduce streaming services</span>
                      <span className="text-xs font-medium text-green-600">+$45/month</span>
                    </div>
                  )}
                  {selectedTradeOffs.includes('nightsout') && (
                    <div className="flex justify-between items-center p-2 bg-green-100 dark:bg-green-900/30 rounded-md">
                      <span className="text-xs">🎉 Fewer nights out</span>
                      <span className="text-xs font-medium text-green-600">+$150/month</span>
                    </div>
                  )}
                  {selectedTradeOffs.includes('transport') && (
                    <div className="flex justify-between items-center p-2 bg-green-100 dark:bg-green-900/30 rounded-md">
                      <span className="text-xs">🚗 Walk/bike more</span>
                      <span className="text-xs font-medium text-green-600">+$69/month</span>
                    </div>
                  )}
                  {selectedTradeOffs.includes('shopping') && (
                    <div className="flex justify-between items-center p-2 bg-green-100 dark:bg-green-900/30 rounded-md">
                      <span className="text-xs">🛍️ 24-hour rule</span>
                      <span className="text-xs font-medium text-green-600">+$45/month</span>
                    </div>
                  )}
                  {selectedTradeOffs.includes('selling') && (
                    <div className="flex justify-between items-center p-2 bg-green-100 dark:bg-green-900/30 rounded-md">
                      <span className="text-xs">📈 Sell unused items</span>
                      <span className="text-xs font-medium text-blue-600">+$150/month</span>
                    </div>
                  )}
                  <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-xs text-green-800 dark:text-green-200">Total Extra Savings:</span>
                      <span className="font-bold text-xs text-green-600 dark:text-green-400">
                        +${selectedTradeOffs.reduce((total, id) => {
                          const amounts = { coffee: 167, lunch: 325, streaming: 45, nightsout: 150, transport: 69, shopping: 45, selling: 150 };
                          return total + (amounts[id as keyof typeof amounts] || 0);
                        }, 0)}/month
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      This could finish your goal {Math.round(selectedTradeOffs.reduce((total, id) => {
                        const amounts = { coffee: 167, lunch: 325, streaming: 45, nightsout: 150, transport: 69, shopping: 45, selling: 150 };
                        return total + (amounts[id as keyof typeof amounts] || 0);
                      }, 0) / monthlyRequired * 30)} days sooner!
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

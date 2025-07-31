import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GraduationCap, Lightbulb, TrendingUp, Shield, ExternalLink } from 'lucide-react';
import { type GoalType } from '@shared/schema';

interface Tip {
  title: string;
  content: string;
  gradient: string;
  textColor: string;
}

const tipsByGoalType: Record<GoalType, Tip[]> = {
  education: [
    {
      title: 'Education ROI',
      content: 'Investing in education typically provides excellent long-term returns on investment.',
      gradient: 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20',
      textColor: 'text-blue-900 dark:text-blue-100'
    },
    {
      title: 'Tax Benefits',
      content: 'Look into tax-advantaged education savings accounts like 529 plans.',
      gradient: 'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20',
      textColor: 'text-purple-900 dark:text-purple-100'
    }
  ],
  emergency: [
    {
      title: 'Safety First',
      content: 'Aim for 3-6 months of expenses in your emergency fund for financial security.',
      gradient: 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20',
      textColor: 'text-green-900 dark:text-green-100'
    },
    {
      title: 'High-Yield Savings',
      content: 'Keep emergency funds in easily accessible, high-yield savings accounts.',
      gradient: 'bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-950/20 dark:to-cyan-950/20',
      textColor: 'text-teal-900 dark:text-teal-100'
    }
  ],
  home: [
    {
      title: 'Down Payment Goal',
      content: 'Traditional down payments range from 10-20% of the home purchase price.',
      gradient: 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20',
      textColor: 'text-amber-900 dark:text-amber-100'
    },
    {
      title: 'Additional Costs',
      content: 'Remember to budget for closing costs, inspections, and moving expenses.',
      gradient: 'bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20',
      textColor: 'text-yellow-900 dark:text-yellow-100'
    }
  ],
  vacation: [
    {
      title: 'Budget Planning',
      content: 'Break down your vacation into categories: transport, accommodation, food, activities.',
      gradient: 'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20',
      textColor: 'text-purple-900 dark:text-purple-100'
    },
    {
      title: 'Travel Rewards',
      content: 'Consider using travel reward credit cards to maximize your vacation budget.',
      gradient: 'bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-950/20',
      textColor: 'text-rose-900 dark:text-rose-100'
    }
  ],
  car: [
    {
      title: 'Total Cost of Ownership',
      content: 'Consider insurance, maintenance, fuel, and depreciation in your budget.',
      gradient: 'bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20',
      textColor: 'text-red-900 dark:text-red-100'
    },
    {
      title: 'New vs Used',
      content: 'Used cars can offer better value, but factor in potential repair costs.',
      gradient: 'bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20',
      textColor: 'text-orange-900 dark:text-orange-100'
    }
  ],
  retirement: [
    {
      title: 'Start Early',
      content: 'The power of compound interest makes early retirement saving incredibly valuable.',
      gradient: 'bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20',
      textColor: 'text-indigo-900 dark:text-indigo-100'
    },
    {
      title: 'Employer Match',
      content: 'Always contribute enough to get your full employer 401(k) match - it\'s free money!',
      gradient: 'bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20',
      textColor: 'text-violet-900 dark:text-violet-100'
    }
  ],
  investment: [
    {
      title: 'Diversification',
      content: 'Spread your investments across different asset classes to reduce risk.',
      gradient: 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20',
      textColor: 'text-emerald-900 dark:text-emerald-100'
    },
    {
      title: 'Dollar Cost Averaging',
      content: 'Invest the same amount regularly to reduce the impact of market volatility.',
      gradient: 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20',
      textColor: 'text-green-900 dark:text-green-100'
    }
  ],
  other: [
    {
      title: '50/30/20 Rule',
      content: 'Allocate 50% for needs, 30% for wants, and 20% for savings and debt repayment.',
      gradient: 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20',
      textColor: 'text-blue-900 dark:text-blue-100'
    },
    {
      title: 'Automate Savings',
      content: 'Set up automatic transfers to make saving effortless and consistent.',
      gradient: 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20',
      textColor: 'text-green-900 dark:text-green-100'
    }
  ]
};

interface EducationalTipsProps {
  selectedGoal: GoalType;
}

export function EducationalTips({ selectedGoal }: EducationalTipsProps) {
  const tips = tipsByGoalType[selectedGoal] || tipsByGoalType.other;

  return (
    <Card className="animate-slide-in">
      <CardContent className="p-6">
        <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
          <div className="p-2 bg-brand-green/10 rounded-lg">
            <GraduationCap className="w-5 h-5 brand-green" />
          </div>
          Smart Saving Tips
        </h3>
        
        <div className="space-y-4">
          {tips.map((tip, index) => (
            <div key={index} className={`p-4 rounded-lg ${tip.gradient}`}>
              <h4 className={`font-medium mb-2 ${tip.textColor}`}>
                {tip.title}
              </h4>
              <p className={`text-sm ${tip.textColor.replace('900', '700').replace('100', '300')}`}>
                {tip.content}
              </p>
              {/* Add button for 50/30/20 Rule */}
              {tip.title === '50/30/20 Rule' && (
                <Button
                  onClick={() => window.open('https://www.mycollegefinance.com/50-30-20-budget-calculator', '_blank')}
                  className="mt-3 bg-brand-blue hover:bg-brand-blue/90 text-[#030711] dark:text-white text-xs px-3 py-1 h-8"
                >
                  <ExternalLink className="w-3 h-3 mr-1 text-[#030711] dark:text-white" />
                  Try Our App
                </Button>
              )}
            </div>
          ))}
          
          {/* Knowledge Bank section */}
          <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 rounded-lg">
            <h4 className="font-medium text-emerald-900 dark:text-emerald-100 mb-2 flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              Knowledge Bank
            </h4>
            <p className="text-sm text-emerald-700 dark:text-emerald-300 mb-3">
              Explore our comprehensive financial learning hub with guides, calculators, and educational content.
            </p>
            <Button
              onClick={() => window.open('https://www.mycollegefinance.com/knowledge-bank', '_blank')}
              className="bg-brand-green hover:bg-brand-green/90 text-[#030711] dark:text-white text-xs px-3 py-1 h-8"
            >
              <ExternalLink className="w-3 h-3 mr-1 text-[#030711] dark:text-white" />
              Visit Knowledge Bank
            </Button>
          </div>
          
          {/* Universal tip */}
          <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg">
            <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-2 flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Start Small
            </h4>
            <p className="text-sm text-purple-700 dark:text-purple-300">
              Even small amounts add up over time. Consistency matters more than the amount.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

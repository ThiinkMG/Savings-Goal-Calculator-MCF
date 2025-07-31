import { Card, CardContent } from '@/components/ui/card';
import { GraduationCap, Lightbulb, TrendingUp, Shield } from 'lucide-react';
import { type GoalType } from '@shared/schema';

interface Tip {
  title: string;
  content: string;
  gradient: string;
  textColor: string;
  link?: {
    text: string;
    url: string;
  };
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
    },
    {
      title: 'Knowledge Bank',
      content: 'Explore our comprehensive financial learning hub with interactive tools, guides, and resources to master your personal finances.',
      gradient: 'bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950/20 dark:to-yellow-950/20',
      textColor: 'text-orange-900 dark:text-orange-100',
      link: {
        text: 'Learn more →',
        url: 'https://www.mycollegefinance.com/knowledge-bank'
      }
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
    },
    {
      title: 'Knowledge Bank',
      content: 'Explore our comprehensive financial learning hub with interactive tools, guides, and resources to master your personal finances.',
      gradient: 'bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950/20 dark:to-yellow-950/20',
      textColor: 'text-orange-900 dark:text-orange-100',
      link: {
        text: 'Learn more →',
        url: 'https://www.mycollegefinance.com/knowledge-bank'
      }
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
    },
    {
      title: 'Knowledge Bank',
      content: 'Explore our comprehensive financial learning hub with interactive tools, guides, and resources to master your personal finances.',
      gradient: 'bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950/20 dark:to-yellow-950/20',
      textColor: 'text-orange-900 dark:text-orange-100',
      link: {
        text: 'Learn more →',
        url: 'https://www.mycollegefinance.com/knowledge-bank'
      }
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
    },
    {
      title: 'Knowledge Bank',
      content: 'Explore our comprehensive financial learning hub with interactive tools, guides, and resources to master your personal finances.',
      gradient: 'bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950/20 dark:to-yellow-950/20',
      textColor: 'text-orange-900 dark:text-orange-100',
      link: {
        text: 'Learn more →',
        url: 'https://www.mycollegefinance.com/knowledge-bank'
      }
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
    },
    {
      title: 'Knowledge Bank',
      content: 'Explore our comprehensive financial learning hub with interactive tools, guides, and resources to master your personal finances.',
      gradient: 'bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950/20 dark:to-yellow-950/20',
      textColor: 'text-orange-900 dark:text-orange-100',
      link: {
        text: 'Learn more →',
        url: 'https://www.mycollegefinance.com/knowledge-bank'
      }
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
    },
    {
      title: 'Knowledge Bank',
      content: 'Explore our comprehensive financial learning hub with interactive tools, guides, and resources to master your personal finances.',
      gradient: 'bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950/20 dark:to-yellow-950/20',
      textColor: 'text-orange-900 dark:text-orange-100',
      link: {
        text: 'Learn more →',
        url: 'https://www.mycollegefinance.com/knowledge-bank'
      }
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
    },
    {
      title: 'Knowledge Bank',
      content: 'Explore our comprehensive financial learning hub with interactive tools, guides, and resources to master your personal finances.',
      gradient: 'bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950/20 dark:to-yellow-950/20',
      textColor: 'text-orange-900 dark:text-orange-100',
      link: {
        text: 'Learn more →',
        url: 'https://www.mycollegefinance.com/knowledge-bank'
      }
    }
  ],
  other: [
    {
      title: '50/30/20 Rule',
      content: 'Allocate 50% for needs, 30% for wants, and 20% for savings and debt repayment.',
      gradient: 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20',
      textColor: 'text-blue-900 dark:text-blue-100',
      link: {
        text: 'Try App →',
        url: 'https://www.mycollegefinance.com/50-30-20-budget-calculator'
      }
    },
    {
      title: 'Automate Savings',
      content: 'Set up automatic transfers to make saving effortless and consistent.',
      gradient: 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20',
      textColor: 'text-green-900 dark:text-green-100'
    },
    {
      title: 'Knowledge Bank',
      content: 'Explore our comprehensive financial learning hub with interactive tools, guides, and resources to master your personal finances.',
      gradient: 'bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950/20 dark:to-yellow-950/20',
      textColor: 'text-orange-900 dark:text-orange-100',
      link: {
        text: 'Learn more →',
        url: 'https://www.mycollegefinance.com/knowledge-bank'
      }
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
              {tip.link && (
                <a
                  href={tip.link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-block mt-2 text-sm font-medium ${tip.textColor} hover:underline cursor-pointer`}
                >
                  {tip.link.text}
                </a>
              )}
            </div>
          ))}
          
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

import { Card, CardContent } from '@/components/ui/card';
import { 
  GraduationCap, 
  Shield, 
  Home, 
  Plane, 
  Car, 
  PiggyBank,
  TrendingUp,
  Star 
} from 'lucide-react';
import { type GoalType } from '@shared/schema';

interface GoalOption {
  type: GoalType;
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}

const goalOptions: GoalOption[] = [
  {
    type: 'education',
    icon: <GraduationCap className="w-8 h-8" />,
    title: 'Education',
    description: 'College, courses, books',
    color: 'text-brand-blue'
  },
  {
    type: 'emergency',
    icon: <Shield className="w-8 h-8" />,
    title: 'Emergency Fund',
    description: 'Financial safety net',
    color: 'text-brand-green'
  },
  {
    type: 'home',
    icon: <Home className="w-8 h-8" />,
    title: 'Down Payment',
    description: 'House, apartment',
    color: 'text-brand-amber'
  },
  {
    type: 'vacation',
    icon: <Plane className="w-8 h-8" />,
    title: 'Vacation',
    description: 'Travel, experiences',
    color: 'text-purple-500'
  },
  {
    type: 'car',
    icon: <Car className="w-8 h-8" />,
    title: 'Vehicle',
    description: 'Car, motorcycle',
    color: 'text-red-500'
  },
  {
    type: 'retirement',
    icon: <PiggyBank className="w-8 h-8" />,
    title: 'Retirement',
    description: 'Future security',
    color: 'text-indigo-500'
  },
  {
    type: 'investment',
    icon: <TrendingUp className="w-8 h-8" />,
    title: 'Investment',
    description: 'Stocks, bonds',
    color: 'text-emerald-500'
  },
  {
    type: 'other',
    icon: <Star className="w-8 h-8" />,
    title: 'Other',
    description: 'Custom goal',
    color: 'text-pink-500'
  }
];

interface GoalSelectionCardProps {
  selectedGoal: GoalType | null;
  onGoalSelect: (goal: GoalType) => void;
}

export function GoalSelectionCard({ selectedGoal, onGoalSelect }: GoalSelectionCardProps) {
  return (
    <Card className="animate-slide-in">
      <CardContent className="p-6">
        <h3 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
          <div className="p-2 bg-brand-blue/10 rounded-lg">
            <Star className="w-5 h-5 brand-blue" />
          </div>
          Choose Your Savings Goal
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {goalOptions.map((option) => (
            <div
              key={option.type}
              className={`goal-card ${selectedGoal === option.type ? 'selected' : ''}`}
              onClick={() => onGoalSelect(option.type)}
            >
              <div className="text-center">
                <div className={`mb-3 ${option.color}`}>
                  {option.icon}
                </div>
                <h4 className="font-medium text-foreground mb-1 text-sm">
                  {option.title}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {option.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

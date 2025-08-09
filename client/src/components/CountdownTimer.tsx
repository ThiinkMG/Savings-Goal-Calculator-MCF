import { useState, useEffect } from 'react';

interface CountdownTimerProps {
  targetTime: string | Date;
  onComplete?: () => void;
  className?: string;
}

export function CountdownTimer({ targetTime, onComplete, className = "" }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    totalMs: number;
  }>({ hours: 0, minutes: 0, seconds: 0, totalMs: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const target = new Date(targetTime).getTime();
      const now = new Date().getTime();
      const difference = target - now;

      if (difference <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, totalMs: 0 });
        if (onComplete) {
          onComplete();
        }
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds, totalMs: difference });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetTime, onComplete]);

  if (timeLeft.totalMs <= 0) {
    return (
      <span className={`text-green-600 dark:text-green-400 font-medium ${className}`}>
        Available now!
      </span>
    );
  }

  const formatTime = (value: number) => value.toString().padStart(2, '0');

  return (
    <span className={`font-mono text-orange-600 dark:text-orange-400 font-medium ${className}`}>
      {timeLeft.hours > 0 && `${formatTime(timeLeft.hours)}:`}
      {formatTime(timeLeft.minutes)}:{formatTime(timeLeft.seconds)}
    </span>
  );
}
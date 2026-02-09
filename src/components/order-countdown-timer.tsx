import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

interface OrderCountdownTimerProps {
  estimatedDeliveryTime: string | null | undefined;
  className?: string;
}

export function OrderCountdownTimer({ estimatedDeliveryTime, className = "" }: OrderCountdownTimerProps) {
  const { t } = useLanguage();
  const [timeRemaining, setTimeRemaining] = useState<{
    minutes: number;
    seconds: number;
    isOverdue: boolean;
  } | null>(null);

  useEffect(() => {
    if (!estimatedDeliveryTime) {
      setTimeRemaining(null);
      return;
    }

    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const deliveryTime = new Date(estimatedDeliveryTime).getTime();
      const diff = deliveryTime - now;

      if (diff <= 0) {
        return { minutes: 0, seconds: 0, isOverdue: true };
      }

      const minutes = Math.floor(diff / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      return { minutes, seconds, isOverdue: false };
    };

    // Initial calculation
    setTimeRemaining(calculateTimeRemaining());

    // Update every second
    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining());
    }, 1000);

    return () => clearInterval(interval);
  }, [estimatedDeliveryTime]);

  if (!timeRemaining) {
    return null;
  }

  const { minutes, seconds, isOverdue } = timeRemaining;

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <Clock className={`w-4 h-4 ${isOverdue ? 'text-red-600' : 'text-blue-600'}`} />
      <span className={`text-sm font-medium ${isOverdue ? 'text-red-600' : 'text-blue-600'}`}>
        {isOverdue
          ? t("Yliajo!", "Overdue!")
          : `${minutes}:${seconds.toString().padStart(2, '0')}`
        }
      </span>
    </div>
  );
}

import React from 'react';
import { cn } from '@/lib/utils';

const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  variant = 'default',
  className,
  onClick,
}) => {
  const variantStyles = {
    default: 'border-border',
    warning: 'border-warning/30 bg-warning/5',
    success: 'border-success/30 bg-success/5',
    info: 'border-info/30 bg-info/5',
  };

  const iconStyles = {
    default: 'bg-primary/10 text-primary',
    warning: 'bg-warning/20 text-warning',
    success: 'bg-success/20 text-success',
    info: 'bg-info/20 text-info',
  };

  return (
    <div
      className={cn(
        'stat-card',
        variantStyles[variant],
        className,
        onClick && 'cursor-pointer hover:shadow-lg transition-shadow'
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-2xl font-display font-bold text-foreground mt-1">
            {value}
          </p>
          {trend && (
            <p
              className={cn(
                'text-xs mt-1',
                trend.isPositive ? 'text-success' : 'text-destructive'
              )}
            >
              {trend.isPositive ? '+' : '-'}
              {trend.value}% from last week
            </p>
          )}
        </div>
        <div className={cn('p-2.5 rounded-lg', iconStyles[variant])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};

export default StatCard;


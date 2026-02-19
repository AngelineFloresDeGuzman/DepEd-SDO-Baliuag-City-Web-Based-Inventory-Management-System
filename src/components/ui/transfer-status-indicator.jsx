import React from 'react';
import { Clock, CheckCircle, Truck, Package, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const TransferStatusIndicator = ({ status, urgency, className = '' }) => {
  // Map statuses to stages in the transfer process
  const stages = [
    { key: 'pending', label: 'Pending', icon: Clock, color: 'text-warning' },
    { key: 'under-review', label: 'Approved', icon: CheckCircle, color: 'text-info' },
    { key: 'in-transit', label: 'In Transit', icon: Truck, color: 'text-primary' },
    { key: 'received', label: 'Received', icon: Package, color: 'text-success' },
  ];

  // Determine current stage based on status
  const getCurrentStage = () => {
    if (!status) return -1;
    if (status === 'Rejected') return 'rejected';
    if (status?.includes('Pending')) return 0;
    if (status === 'Approved') return 1;
    if (status === 'In Transit' || status === 'Transferring') return 2;
    if (status === 'Received') return 3;
    return -1;
  };

  const currentStage = getCurrentStage();
  const isRejected = currentStage === 'rejected';

  // Calculate percentage completion
  const getProgress = () => {
    if (isRejected) return 0;
    if (currentStage === -1) return 0;
    return ((currentStage + 1) / stages.length) * 100;
  };

  const progress = getProgress();

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Urgency Badge */}
      {urgency && (
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-muted-foreground">Priority:</span>
          <Badge className={`
            ${urgency === 'critical' ? 'bg-destructive/20 text-destructive border-0' : ''}
            ${urgency === 'urgent' ? 'bg-warning/20 text-warning border-0' : ''}
            ${urgency === 'normal' ? 'bg-primary/20 text-primary border-0' : ''}
          `}>
            {urgency.charAt(0).toUpperCase() + urgency.slice(1)}
          </Badge>
        </div>
      )}

      {/* Status Indicator */}
      {isRejected ? (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 flex items-center gap-3">
          <XCircle className="w-5 h-5 text-destructive shrink-0" />
          <div>
            <p className="font-semibold text-destructive">Request Rejected</p>
            <p className="text-sm text-muted-foreground">This transfer request has been rejected by SDO</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Progress Bar */}
          <div className="relative h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Stage Labels */}
          <div className="flex justify-between">
            {stages.map((stage, idx) => {
              const Icon = stage.icon;
              const isActive = currentStage === idx;
              const isCompleted = currentStage > idx;

              return (
                <div key={stage.key} className="flex flex-col items-center gap-2">
                  {/* Icon Circle */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isActive || isCompleted
                        ? 'bg-primary/20 ring-2 ring-primary'
                        : 'bg-muted'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive
                          ? 'text-primary'
                          : isCompleted
                            ? 'text-success'
                            : 'text-muted-foreground'
                      }`}
                    />
                  </div>

                  {/* Label */}
                  <label className={`text-xs font-semibold text-center leading-tight max-w-[60px] ${
                    isActive
                      ? 'text-primary'
                      : isCompleted
                        ? 'text-success'
                        : 'text-muted-foreground'
                  }`}>
                    {stage.label}
                  </label>
                </div>
              );
            })}
          </div>

          {/* Current Status Text */}
          <div className="text-center pt-2">
            <p className="text-sm text-muted-foreground">
              Current Status: <span className="font-semibold text-foreground">{status}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransferStatusIndicator;

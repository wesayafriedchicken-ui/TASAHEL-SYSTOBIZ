import React from 'react';
import { useActionControls } from '../../hooks/useActionControls';
import { cn } from '../../lib/utils';

interface SecureActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  actionKey: string;
  targetEmployeeUserId?: number | string | null;
  targetEmployeeReportingToId?: number | string | null;
  defaultLabel?: string;
  icon?: React.ReactNode;
  wrapperClassName?: string;
}

export const SecureActionButton: React.FC<SecureActionButtonProps> = ({
  actionKey,
  targetEmployeeUserId,
  targetEmployeeReportingToId,
  defaultLabel,
  icon,
  className,
  wrapperClassName,
  children,
  onClick,
  disabled: propDisabled,
  title: propTitle,
  ...props
}) => {
  const { getActionStatus } = useActionControls();
  const status = getActionStatus(actionKey, targetEmployeeUserId, targetEmployeeReportingToId);

  // If hidden by admin security policy, render nothing
  if (!status.isVisible) {
    return null;
  }

  const isRestricted = status.isDisabled || propDisabled;
  const tooltip = status.tooltip || propTitle;
  const displayLabel = children || defaultLabel || status.labelEn;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (isRestricted) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <div 
      className={cn("relative inline-flex", wrapperClassName)}
      title={isRestricted ? tooltip : propTitle}
    >
      <button
        {...props}
        disabled={isRestricted}
        onClick={handleClick}
        className={cn(
          className,
          isRestricted && "opacity-50 cursor-not-allowed bg-slate-100 text-slate-400 border-slate-200 pointer-events-auto shadow-none"
        )}
      >
        {icon && <span className="shrink-0">{icon}</span>}
        {displayLabel}
      </button>
    </div>
  );
};

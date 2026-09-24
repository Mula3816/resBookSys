import React from 'react';
import { cn } from '../../utils/helpers';
import { getStatusColor } from '../../utils/helpers';

const Badge = React.forwardRef(({ 
  children, 
  className, 
  variant = 'default',
  status = null,
  ...props 
}, ref) => {
  const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
  
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    primary: 'bg-primary-100 text-primary-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
  };

  const classes = status ? getStatusColor(status) : variants[variant];

  return (
    <span
      ref={ref}
      className={cn(baseClasses, classes, className)}
      {...props}
    >
      {children}
    </span>
  );
});

Badge.displayName = 'Badge';

export default Badge;

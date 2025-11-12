'use client';

import { forwardRef, type HTMLAttributes, type KeyboardEvent } from 'react';
import { appIconMap } from './iconMap';

export type IconActivationMode = 'single' | 'double';

export interface AppLauncherIconProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'onClick' | 'onDoubleClick'> {
  name: string;
  icon: string;
  color: string;
  onActivate: () => void;
  activation?: IconActivationMode;
  containerClassName?: string;
  iconWrapperClassName?: string;
  iconClassName?: string;
  labelClassName?: string;
  ariaLabel?: string;
}

export const AppLauncherIcon = forwardRef<HTMLDivElement, AppLauncherIconProps>(
  function AppLauncherIcon(
    {
      name,
      icon,
      color,
      onActivate,
      activation = 'single',
      containerClassName = '',
      iconWrapperClassName = '',
      iconClassName = '',
      labelClassName = '',
      ariaLabel,
      className = '',
      tabIndex = 0,
      ...rest
    },
    ref,
  ) {
    const IconComponent = appIconMap[icon] || appIconMap['RiFolder'];

    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onActivate();
      }
    };

    const activationProps =
      activation === 'double' ? { onDoubleClick: onActivate } : { onClick: onActivate };

    return (
      <div
        ref={ref}
        {...rest}
        {...activationProps}
        onKeyDown={handleKeyDown}
        tabIndex={tabIndex}
        role="button"
        aria-label={ariaLabel ?? `${name}アプリを起動`}
        className={`group flex flex-col items-center justify-center cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-sand focus-visible:ring-offset-2 focus-visible:ring-offset-transparent rounded-2xl ${containerClassName} ${className}`}
      >
        <div
          className={`rounded-2xl bg-surface shadow-panel flex items-center justify-center transition-all duration-200 ${iconWrapperClassName}`}
        >
          <IconComponent className={`${color} ${iconClassName}`} />
        </div>
        <span className={labelClassName}>
          {name}
        </span>
      </div>
    );
  },
);

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { HelpCircle, Info } from 'lucide-react';

interface CompactTooltipProps {
  content: string | React.ReactNode;
  title?: string;
  icon?: 'info' | 'help' | 'custom';
  customIcon?: React.ReactNode;
  children?: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

export const CompactTooltip: React.FC<CompactTooltipProps> = ({
  content,
  title,
  icon = 'info',
  customIcon,
  children,
  position = 'top',
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<number | null>(null);

  const calculatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const tooltipWidth = Math.min(320, window.innerWidth - 32);
    const padding = 10;

    let top = 0;
    let left = 0;

    if (position === 'bottom') {
      top = rect.bottom + 8;
      left = rect.left + rect.width / 2 - tooltipWidth / 2;
    } else if (position === 'left') {
      top = rect.top + rect.height / 2 - 20;
      left = rect.left - tooltipWidth - 8;
    } else if (position === 'right') {
      top = rect.top + rect.height / 2 - 20;
      left = rect.right + 8;
    } else {
      // 'top' default
      top = rect.top - 8; // we'll use transform translateY(-100%)
      left = rect.left + rect.width / 2 - tooltipWidth / 2;
    }

    // Boundary clamping for horizontal
    if (left < padding) {
      left = padding;
    } else if (left + tooltipWidth > window.innerWidth - padding) {
      left = window.innerWidth - tooltipWidth - padding;
    }

    // Boundary check for vertical
    let transform = position === 'top' ? 'translateY(-100%)' : 'none';
    if (position === 'top' && top < 80) {
      // Not enough space above, flip to bottom
      top = rect.bottom + 8;
      transform = 'none';
    }

    setTooltipStyle({
      position: 'fixed',
      top: `${Math.round(top)}px`,
      left: `${Math.round(left)}px`,
      width: 'max-content',
      maxWidth: `${tooltipWidth}px`,
      transform,
      zIndex: 99999,
    });
  };

  const handleMouseEnter = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    calculatePosition();
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    hideTimeoutRef.current = window.setTimeout(() => {
      setIsVisible(false);
    }, 100);
  };

  useEffect(() => {
    if (isVisible) {
      const handleScrollOrResize = () => {
        calculatePosition();
      };
      window.addEventListener('scroll', handleScrollOrResize, true);
      window.addEventListener('resize', handleScrollOrResize);
      return () => {
        window.removeEventListener('scroll', handleScrollOrResize, true);
        window.removeEventListener('resize', handleScrollOrResize);
      };
    }
  }, [isVisible]);

  const tooltipPortal = isVisible && typeof document !== 'undefined'
    ? createPortal(
        <div
          style={tooltipStyle}
          onMouseEnter={() => {
            if (hideTimeoutRef.current) {
              clearTimeout(hideTimeoutRef.current);
              hideTimeoutRef.current = null;
            }
            setIsVisible(true);
          }}
          onMouseLeave={() => {
            setIsVisible(false);
          }}
          className="bg-slate-900/95 text-white text-[11px] font-medium rounded-xl p-3 shadow-2xl border border-slate-700/80 leading-relaxed backdrop-blur-md pointer-events-auto transition-opacity duration-150 animate-in fade-in zoom-in-95"
        >
          {title && (
            <div className="font-black text-amber-400 text-[10px] uppercase tracking-wider mb-1.5 pb-1 border-b border-slate-800 flex items-center justify-between">
              <span>{title}</span>
            </div>
          )}
          <div className="text-slate-200">{content}</div>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`inline-flex items-center group cursor-help select-none ${className}`}
      >
        {children ? (
          children
        ) : customIcon ? (
          customIcon
        ) : icon === 'help' ? (
          <HelpCircle className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 transition-colors shrink-0" />
        ) : (
          <Info className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 transition-colors shrink-0" />
        )}
      </div>
      {tooltipPortal}
    </>
  );
};

// CSS-based shim replacing framer-motion for Electron builds
// Handles: motion.div/span/button, AnimatePresence with fade/slide animations

import React, { useEffect, useRef, useState, useCallback } from 'react';

interface MotionProps {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  initial?: Record<string, number | string> | false;
  animate?: Record<string, number | string>;
  exit?: Record<string, number | string>;
  transition?: { duration?: number; delay?: number; ease?: unknown };
  variants?: Record<string, Record<string, number | string>>;
  custom?: number;
  key?: string | number;
  onClick?: (e: React.MouseEvent) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  role?: string;
  tabIndex?: number;
  'aria-label'?: string;
  'aria-pressed'?: boolean;
  'aria-expanded'?: boolean;
  id?: string;
  title?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  whileHover?: Record<string, number | string>;
  whileTap?: Record<string, number | string>;
  layout?: boolean;
  layoutId?: string;
}

function buildAnimationStyle(
  initial: Record<string, number | string> | false | undefined,
  animate: Record<string, number | string> | undefined,
  transition: { duration?: number; delay?: number } | undefined,
  isExiting: boolean,
  exit: Record<string, number | string> | undefined,
): React.CSSProperties {
  const duration = transition?.duration ?? 0.3;
  const delay = transition?.delay ?? 0;

  // Map common framer-motion properties to CSS
  const cssAnim: React.CSSProperties = {
    animationDuration: `${duration}s`,
    animationDelay: `${delay}s`,
    animationFillMode: 'both',
  };

  if (isExiting && exit) {
    // Handle exit animation
    if (exit.opacity === 0) cssAnim.animationName = 'fadeOut';
    else if ((exit.y as number) < 0) cssAnim.animationName = 'slideOutUp';
    else if ((exit.x as number) < 0) cssAnim.animationName = 'slideOutLeft';
    else if ((exit.scale as number) === 0) cssAnim.animationName = 'scaleOut';
    else cssAnim.animationName = 'fadeOut';
    return cssAnim;
  }

  // Determine entrance animation
  const hasFade = initial === false ? false : (initial?.opacity === 0 && (animate?.opacity === 1 || animate === undefined));
  const hasSlideUp = initial === false ? false : ((initial?.y as number) > 0);
  const hasSlideDown = initial === false ? false : ((initial?.y as number) < 0);
  const hasSlideLeft = initial === false ? false : ((initial?.x as number) > 0);
  const hasSlideRight = initial === false ? false : ((initial?.x as number) < 0);
  const hasScale = initial === false ? false : ((initial?.scale as number) !== undefined && (initial?.scale as number) < 1);

  if (hasScale) cssAnim.animationName = 'scaleIn';
  else if (hasSlideUp && hasFade) cssAnim.animationName = 'fadeSlideUp';
  else if (hasSlideDown && hasFade) cssAnim.animationName = 'fadeSlideDown';
  else if (hasSlideLeft && hasFade) cssAnim.animationName = 'fadeSlideLeft';
  else if (hasSlideRight && hasFade) cssAnim.animationName = 'fadeSlideRight';
  else if (hasSlideUp) cssAnim.animationName = 'slideUp';
  else if (hasFade) cssAnim.animationName = 'fadeIn';
  else cssAnim.animationName = 'fadeIn';

  return cssAnim;
}

// ---- motion components ----

function createMotionComponent(tag: 'div' | 'span' | 'button') {
  return function MotionComponent(props: MotionProps) {
    const {
      children, className, style, initial, animate, exit, transition,
      variants, custom, onClick, onKeyDown, role, tabIndex,
      'aria-label': ariaLabel, 'aria-pressed': ariaPressed, 'aria-expanded': ariaExpanded,
      id, title, disabled, type, whileHover, whileTap, layout, layoutId,
      ...rest
    } = props;

    const [isExiting, setIsExiting] = useState(false);
    const [shouldRender, setShouldRender] = useState(true);
    const animStyle = buildAnimationStyle(initial, animate, transition, isExiting, exit);

    // Handle variants pattern (simplified)
    let finalInitial = initial;
    let finalAnimate = animate;
    if (variants && custom !== undefined) {
      const dir = custom;
      if (dir < 0) {
        finalInitial = { x: -50, opacity: 0 };
        finalAnimate = { x: 0, opacity: 1 };
      } else if (dir > 0) {
        finalInitial = { x: 50, opacity: 0 };
        finalAnimate = { x: 0, opacity: 1 };
      }
    }
    if (variants) {
      // Apply variants container/item patterns as simple fade+slide
      if (variants.hidden !== undefined || variants.show !== undefined) {
        finalInitial = { opacity: 0, y: 10 };
        finalAnimate = { opacity: 1, y: 0 };
      }
    }

    // Recalculate with variant-resolved values
    const finalStyle = buildAnimationStyle(finalInitial, finalAnimate, transition, isExiting, exit);

    const combinedStyle: React.CSSProperties = {
      ...style,
      ...finalStyle,
    };

    // Hover / tap (translate to CSS classes)
    const hoverClass = whileHover ? 'motion-hover-lift' : '';
    const tapClass = whileTap ? 'motion-active-scale' : '';

    const commonProps = {
      className: `${className || ''} ${hoverClass} ${tapClass}`.trim() || undefined,
      style: combinedStyle,
      onClick,
      onKeyDown,
      role,
      tabIndex,
      'aria-label': ariaLabel,
      'aria-pressed': ariaPressed,
      'aria-expanded': ariaExpanded,
      id,
      title,
      disabled,
      type,
      ...rest,
    };

    if (tag === 'div') return <div {...commonProps}>{children}</div>;
    if (tag === 'span') return <span {...commonProps}>{children}</span>;
    return <button {...commonProps}>{children}</button>;
  };
}

export const motion = {
  div: createMotionComponent('div'),
  span: createMotionComponent('span'),
  button: createMotionComponent('button'),
};

// ---- AnimatePresence ----

interface AnimatePresenceProps {
  children?: React.ReactNode;
  mode?: 'sync' | 'wait' | 'popLayout';
  initial?: boolean;
}

export function AnimatePresence({ children, mode }: AnimatePresenceProps) {
  const [displayed, setDisplayed] = useState<React.ReactNode>(children);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const prevKeyRef = useRef<string | number | null>(null);

  // Extract key from children
  const childKey = React.isValidElement(children) ? children.key : null;
  const displayKey = React.isValidElement(displayed) ? displayed.key : null;

  useEffect(() => {
    if (childKey !== displayKey && children !== undefined) {
      if (mode === 'wait' && displayed !== null) {
        // Wait for exit before showing new
        setIsTransitioning(true);
        const timer = setTimeout(() => {
          setDisplayed(children);
          setIsTransitioning(false);
        }, 300);
        return () => clearTimeout(timer);
      } else {
        setDisplayed(children);
      }
    }
    if (children !== undefined) {
      setDisplayed(children);
    }
  }, [childKey, children, mode, displayKey]);

  if (!displayed) return null;

  return <>{displayed}</>;
}

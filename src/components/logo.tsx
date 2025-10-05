"use client"

export const ImoZenLogo = ({ size = "lg", variant = "gradient", className = "" }: { size?: 'sm' | 'md' | 'lg' | 'xl', variant?: 'default' | 'dark' | 'light' | 'gradient', className?: string }) => {
  const sizes = {
    sm: { height: 32, fontSize: '1.5rem', iconSize: 32 },
    md: { height: 48, fontSize: '2.25rem', iconSize: 48 },
    lg: { height: 64, fontSize: '3rem', iconSize: 64 },
    xl: { height: 80, fontSize: '4rem', iconSize: 80 }
  };

  const currentSize = sizes[size];

  // Using CSS variables for colors to respect the theme
  const colors = {
    default: {
      primary: 'hsl(var(--primary))',
      text: 'hsl(var(--foreground))',
      iconBg: 'hsl(var(--primary))',
      iconFg: 'hsl(var(--primary-foreground))'
    },
    dark: {
      primary: 'hsl(var(--primary))',
      text: 'hsl(var(--foreground))',
      iconBg: 'hsl(var(--primary))',
      iconFg: 'hsl(var(--primary-foreground))'
    },
    light: {
      primary: 'hsl(var(--primary))',
      text: 'hsl(var(--foreground))',
      iconBg: 'hsl(var(--primary))',
      iconFg: 'hsl(var(--primary-foreground))'
    },
    gradient: {
      primary: 'url(#logoGradient)',
      text: 'hsl(var(--foreground))',
      iconBg: 'url(#logoGradient)',
      iconFg: 'hsl(var(--primary-foreground))'
    }
  };

  const currentColors = colors[variant];

  return (
    <div 
      className={`inline-flex items-center gap-2 ${className}`}
      style={{ height: currentSize.height }}
    >
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: 'hsl(var(--primary))' }} />
            <stop offset="100%" style={{ stopColor: 'hsl(var(--accent))' }} />
          </linearGradient>
        </defs>
      </svg>
      <div 
        style={{ 
          fontSize: currentSize.fontSize,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: currentColors.text,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          lineHeight: 1,
          display: 'flex',
          alignItems: 'center'
        }}
      >
        Imo<span style={{ fill: currentColors.primary, color: currentColors.primary }}>Zen</span>
      </div>
    </div>
  );
};

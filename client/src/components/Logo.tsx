import logoImage from '@assets/Updated Final - My College Finace Logo w New Oliver 2 - Thiink Media Graphics (Transparent)_1753980792432.png';

interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 40, className = '' }: LogoProps) {
  return (
    <img 
      src={logoImage} 
      alt="My College Finance - Educate • Motivate • Elevate" 
      width={size} 
      height={size}
      className={`rounded-full ${className}`}
    />
  );
}
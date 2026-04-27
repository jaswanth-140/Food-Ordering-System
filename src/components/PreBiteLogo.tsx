import { forwardRef } from 'react';
import prebiteLogo from '@/assets/prebite-logo.png';

interface PreBiteLogoProps {
  className?: string;
  size?: number;
}

const PreBiteLogo = forwardRef<HTMLImageElement, PreBiteLogoProps>(function PreBiteLogo(
  { className = '', size = 24 },
  ref
) {
  return (
    <img
      ref={ref}
      src={prebiteLogo}
      alt="PreBite"
      width={size}
      height={size}
      className={className}
    />
  );
});

export default PreBiteLogo;

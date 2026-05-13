import { useEffect, useState } from 'react';

type UseDeviceDetectorResult = {
  isMobile: boolean;
};

export function useDeviceDetector(): UseDeviceDetectorResult {
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 768);

  useEffect(() => {
    const onResize = (): void => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return { isMobile };
}


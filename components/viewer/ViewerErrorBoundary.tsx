
import React, { ReactNode } from 'react';

// Neutralized Error Boundary to restore stability
interface Props {
  children: ReactNode;
  onReset?: () => void;
}

export const ViewerErrorBoundary: React.FC<Props> = ({ children }) => {
  return <>{children}</>;
};

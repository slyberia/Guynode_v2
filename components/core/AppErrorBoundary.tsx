
import React, { ReactNode } from 'react';

// Neutralized Error Boundary to restore stability
interface Props {
  children: ReactNode;
}

export const AppErrorBoundary: React.FC<Props> = ({ children }) => {
  return <>{children}</>;
};

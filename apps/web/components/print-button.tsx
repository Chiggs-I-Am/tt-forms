"use client";

import { Button } from "@workspace/ui/components/button";

// Print-to-PDF trigger for the printable view. Hidden on paper itself.
export const PrintButton = () => {
  return (
    <Button
      type="button"
      variant="outline"
      className="no-print"
      onClick={() => window.print()}
    >
      Print
    </Button>
  );
};

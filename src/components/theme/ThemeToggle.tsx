"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Avoid hydration mismatch by only rendering after mount
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="relative">
        <Sun className="h-5 w-5 text-muted-foreground" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="relative"
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {/* Sun icon - visible in dark mode */}
      <Sun
        className={`h-5 w-5 transition-all duration-300 ${
          theme === "dark"
            ? "text-yellow-400 rotate-0 scale-100"
            : "rotate-90 scale-0 absolute"
        }`}
      />
      
      {/* Moon icon - visible in light mode */}
      <Moon
        className={`h-5 w-5 transition-all duration-300 ${
          theme === "light"
            ? "text-slate-700 rotate-0 scale-100"
            : "-rotate-90 scale-0 absolute"
        }`}
      />
      
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

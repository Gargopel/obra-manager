import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const Icon = theme === "dark" ? Sun : Moon;
  const tooltipText = theme === "dark" ? "Modo Claro" : "Modo Escuro";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleTheme}
          className="w-full justify-start"
        >
          <Icon className="h-4 w-4 mr-2" />
          <span className="text-sm font-medium">Alternar Tema</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">{tooltipText}</TooltipContent>
    </Tooltip>
  );
};

export default ThemeToggle;
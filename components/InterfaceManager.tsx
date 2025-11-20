import { AIResponse } from "@/types/interfaces";
import { useCookingState } from "@/state/cookingState";

// Components
import { Timer } from "./interfaces/Timer";
import { InstructionCard } from "./interfaces/InstructionCard";
import { NotificationBadge } from "./interfaces/NotificationBadge";

interface ManagerProps {
  activeInterface: AIResponse | null;
}

export function InterfaceManager({ activeInterface }: ManagerProps) {
  const { activeTimers } = useCookingState();

  return (
    <>
      {activeTimers.map((timer, index) => {
        const stackY = 0.5 - index * 1.2;
        const position: [number, number, number] = [5, stackY, -2];

        return (
          <Timer
            key={timer.id}
            id={timer.id} // do I really need to do this since I already have the key?
            seconds={timer.seconds}
            label={timer.label}
            customPosition={position}
          />
        );
      })}
      {activeInterface && renderActiveInterface(activeInterface)}
    </>
  );
}

/**
 * Helper function to switch between different interface types
 */
function renderActiveInterface(aiState: AIResponse) {
  switch (aiState.type) {
    // --- MAIN CONTENT ---
    case "instruction":
      return (
        <InstructionCard
          text={aiState.data.text || ""}
          stepNumber={aiState.data.stepNumber || 0}
        />
      );

    case "warning":
      return (
        <WarningAlert
          title={activeInterface.data.title}
          text={aiState.data.text || ""}
        />
      );

    // --- NOTIFICATIONS (Badges) ---
    case "success":
      return (
        <NotificationBadge
          label={aiState.data.label || "Success"}
          variant="success"
        />
      );

    case "error":
      return (
        <NotificationBadge
          label={aiState.data.label || "Error"}
          variant="error"
        />
      );

    // Timers are handled separately in the stack above, so we return null here
    case "timer":
      return null;

    default:
      return null;
  }
}

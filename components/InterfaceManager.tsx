import { AIResponse } from "@/types/interfaces";
import { useCookingState } from "@/state/cookingState";

// --- FEATURE COMPONENTS ---
import { Timer } from "@/features/timer/Timer";
import { ShoppingList } from "@/features/shopping_list/shopping_list";
import { NotificationBadge } from "@/features/notifications/NotificationBadge";

interface ManagerProps {
  activeInterface: AIResponse | null;
}

export function InterfaceManager({ activeInterface }: ManagerProps) {
  // Get active timers from the Timer Slice
  const { activeTimers } = useCookingState();

  /**
   * THE FACTORY LOGIC
   * Determines what to render based on the AI response type.
   */
  const renderDynamicInterface = () => {
    if (!activeInterface) return null;

    const { type, data } = activeInterface;

    switch (type) {
      // --- NOTIFICATIONS ---
      case "success":
        return (
          <NotificationBadge
            label={data.label || "Success"}
            variant="success"
          />
        );

      case "error":
        return (
          <NotificationBadge label={data.label || "Error"} variant="error" />
        );

      // --- GENERIC ANSWERS ---
      case "instruction":
        return (
          <NotificationBadge label={data.text || "Info"} variant="neutral" />
        );

      // Timers are handled in the stack below, so we return null here
      case "timer":
        return null;

      case "shopping_list":
        return (
          <ShoppingList
            label={data.label || "Shopping List"}
            customPosition={[5, 0, -2]}
          />);

      default:
        console.warn(`Unknown interface type: ${type}`);
        return null;
    }
  };

  return (
    <>
      {/* 1. SIDE UI: ACTIVE TIMERS STACK */}
      {activeTimers.map((timer, index) => {
        // STACKING LOGIC:
        const stackY = 0.5 - index * 1.2;
        const position: [number, number, number] = [5, stackY, -2];

        return (
          <Timer
            key={timer.id}
            id={timer.id}
            seconds={timer.seconds}
            label={timer.label}
            customPosition={position}
          />
        );
      })}

      {/* 2. CENTER UI: DYNAMIC CONTENT */}
      {renderDynamicInterface()}
    </>
  );
}

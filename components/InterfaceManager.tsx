import { AIResponse } from "@/types/interfaces";
import { useCookingState } from "@/state/cookingState";

// --- FEATURE COMPONENTS ---
import { Timer } from "@/features/cooking/timer/Timer";
import { StepGuide } from "@/features/cooking/steps/StepGuide";
import { ShoppingList } from "@/features/shopping/ShoppingList";
import { NotificationBadge } from "@/components/hud/NotificationBadge";
import { FridgeInventory } from "@/features/fridge/FridgeInventory";
import { SuggestRecipe } from "@/features/cooking/recipes/SuggestRecipe";
import { InfoPanel } from "@/components/InfoPanel";

interface ManagerProps {
  activeInterface: AIResponse | null;
  toastMessage?: string | null;
}

/**
 * InterfaceManager
 * Acts as the "Window Manager" for the AR experience.
 * It handles the layout strategy based on a 3-Layer System:
 */
export function InterfaceManager({
  activeInterface,
  toastMessage,
}: ManagerProps) {
  // Access global cooking state
  const { activeTimers, activeRecipe, currentStepIndex } = useCookingState();

  // LAYER 1: PERSISTENT TIMERS
  // Renders active timers on the right side of the field of view.
  const renderTimers = () => {
    return activeTimers.map((timer, index) => {
      const TIMER_GAP = 1.5;
      const START_Y = 0.5;
      const stackY = START_Y - index * TIMER_GAP;

      const position: [number, number, number] = [5, stackY, -2];

      return (
        <Timer
          key={timer.id}
          id={timer.id}
          seconds={timer.seconds}
          totalSeconds={timer.totalSeconds}
          label={timer.label}
          status={timer.status}
          customPosition={position}
        />
      );
    });
  };

  // LAYER 2: MAIN FOCUS INTERFACE
  // Determines which major component should occupy the center stage.
  const renderMainInterface = () => {
    if (activeInterface) {
      const { type, data } = activeInterface;

      switch (type) {
        case "suggest_recipe":
          return <SuggestRecipe data={data} />;

        case "shopping_list":
          return (
            <ShoppingList
              label={data.label || "Shopping List"}
              customPosition={[0, 0, -1.5]}
            />
          );

        case "fridge_inventory":
          return <FridgeInventory items={data.fridgeItems || []} />;
      }
    }

    if (activeRecipe && activeRecipe.steps && currentStepIndex >= 0) {
      return (
        <StepGuide
          step={activeRecipe.steps[currentStepIndex]}
          stepIndex={currentStepIndex}
          totalSteps={activeRecipe.steps.length}
        />
      );
    }

    return null;
  };

  // LAYER 3: OVERLAYS
  // Renders temporary messages or info panels on top of the scene.
  const renderOverlays = () => {
    return (
      <>
        {/* 1. Chat / Instructions Panel */}
        {activeInterface?.type === "instruction" && (
          <InfoPanel text={activeInterface.data.text || ""} />
        )}

        {/* 2. Success/Error Badges */}
        {(activeInterface?.type === "success" ||
          activeInterface?.type === "error") && (
          <NotificationBadge
            label={activeInterface.data.label || ""}
            variant={activeInterface.type}
          />
        )}

        {/* 3. System Toasts */}
        {toastMessage && (
          <NotificationBadge label={toastMessage} variant="success" />
        )}
      </>
    );
  };

  return (
    <>
      {renderTimers()}
      {renderMainInterface()}
      {renderOverlays()}
    </>
  );
}

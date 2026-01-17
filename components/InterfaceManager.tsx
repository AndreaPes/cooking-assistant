import { AIResponse } from "@/types/interfaces";
import { useCookingState } from "@/state/cookingState";

// Feature Components
import { Timer } from "@/features/cooking/timer/Timer";
import { StepGuide } from "@/features/cooking/steps/StepGuide";
import { ShoppingList } from "@/features/shopping/ShoppingList";
import { NotificationBadge } from "@/components/hud/NotificationBadge";
import { FridgeInventory } from "@/features/fridge/FridgeInventory";
import { SuggestRecipe } from "@/features/cooking/recipes/SuggestRecipe";
import { InfoPanel } from "@/components/InfoPanel";

interface ManagerProps {
  /** The current active interface state determined by the AI intent. */
  activeInterface: AIResponse | null;
  /** Optional temporary toast message to display. */
  toastMessage?: string | null;
}

/**
 * Window Manager for the AR Experience.
 * Orchestrates the rendering of different UI layers based on the current state.
 *
 * Layers:
 * 1. **Persistent**: Timers (always visible on the side).
 * 2. **Main Interface**: The central component (Recipe, Fridge, Shopping List).
 * 3. **Overlays**: Notifications, warnings, and chat bubbles.
 */
export function InterfaceManager({
  activeInterface,
  toastMessage,
}: ManagerProps) {
  const { activeTimers, activeRecipe, currentStepIndex } = useCookingState();

  /**
   * Layer 1: Renders the stack of active timers.
   * Positioned on the right side of the field of view.
   */
  const renderTimers = () => {
    return activeTimers.map((timer, index) => (
      <Timer
        key={timer.id}
        id={timer.id}
        seconds={timer.seconds}
        totalSeconds={timer.totalSeconds}
        label={timer.label}
        status={timer.status}
        stackIndex={index}
      />
    ));
  };

  /**
   * Layer 2: Renders the primary focused interface.
   * Handles switching between Suggestion, Shopping List, Fridge, and Step Guide.
   */
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

    // Default Fallback: If a recipe is active, show the Step Guide
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

  /**
   * Layer 3: Renders temporary overlays and notifications.
   * These elements appear on top of other 3D content.
   */
  const renderOverlays = () => {
    return (
      <>
        {activeInterface?.type === "instruction" && (
          <InfoPanel text={activeInterface.data.text || ""} />
        )}

        {(activeInterface?.type === "success" ||
          activeInterface?.type === "error") && (
          <NotificationBadge
            label={activeInterface.data.label || ""}
            variant={activeInterface.type}
          />
        )}

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

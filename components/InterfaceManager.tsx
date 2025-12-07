import { AIResponse } from "@/types/interfaces";
import { useCookingState } from "@/state/cookingState";

// --- FEATURE COMPONENTS ---
// Assicurati che i percorsi siano corretti in base a dove hai salvato i file
import { Timer } from "@/features/timer/Timer";
import { StepGuide } from "@/features/step-guide/StepGuide";
import { ShoppingList } from "@/features/shopping_list/shopping_list";
import { NotificationBadge } from "@/features/notifications/NotificationBadge";
import { FridgeInventory } from "@/features/fridge-inventory/FridgeInventory";
import { SuggestRecipe } from "@/features/suggest_recipe/SuggestRecipe";

interface ManagerProps {
  activeInterface: AIResponse | null;
  toastMessage?: string | null;
}

export function InterfaceManager({
  activeInterface,
  toastMessage,
}: ManagerProps) {
  // 1. Recuperiamo TUTTO lo stato necessario (Timer + Ricetta Attiva)
  const { activeTimers, activeRecipe, currentStepIndex } = useCookingState();
  console.log("🎨 InterfaceManager Rendered. Step:", currentStepIndex);

  const isMenuOpen =
    activeInterface?.type === "suggest_recipe" ||
    activeInterface?.type === "shopping_list" ||
    activeInterface?.type === "fridge_inventory";

  /**
   * THE FACTORY LOGIC
   * Renderizza le interfacce temporanee/modali basate sulla risposta AI
   */
  const renderDynamicInterface = () => {
    if (!activeInterface) return null;

    const { type, data } = activeInterface;

    switch (type) {
      // --- NOTIFICATIONS & INSTRUCTIONS ---
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
      case "instruction":
        return (
          <NotificationBadge label={data.text || "Info"} variant="neutral" />
        );

      // --- FULL SCREEN MENUS ---
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

      case "timer":
        return null;

      // GENERIC / UNKNOWN
      default:
        return null;
    }
  };

  return (
    <>
      {/* 1. LAYER PERSISTENTE: ACTIVE TIMERS (Sempre visibili a destra) */}
      {activeTimers.map((timer, index) => {
        // STACKING LOGIC:
        // Ho ridotto il gap da 1.2 a 0.45. In AR, 1 unità = 1 metro.
        // 1.2m era troppo dispersivo, 45cm è perfetto per una lista verticale.
        const stackY = 0.5 - index * 0.45;
        const position: [number, number, number] = [1.5, stackY, -2]; // Spostato a X=1.5 (Destra)

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
      })}

      {/* 2. LAYER CONTESTUALE: STEP GUIDE (Visibile solo se cuciniamo e non ci sono menu sopra) */}
      {!isMenuOpen &&
        activeRecipe &&
        activeRecipe.steps &&
        currentStepIndex >= 0 && (
          <StepGuide
            step={activeRecipe.steps[currentStepIndex]}
            stepIndex={currentStepIndex}
            totalSteps={activeRecipe.steps.length}
          />
        )}

      {/* 3. LAYER MODALE: DYNAMIC CONTENT (Sovrascrive il centro se attivo) */}
      {renderDynamicInterface()}

      {/* 4. LAYER OVERLAY: TOAST MESSAGES (Sempre in cima) */}
      {toastMessage && (
        <NotificationBadge label={toastMessage} variant="success" />
      )}
    </>
  );
}

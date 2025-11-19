import { AIResponse } from '@/types/interfaces';
import { Timer } from './interfaces/Timer';
import { InstructionCard} from "@/components/interfaces/InstructionCard";
import {useCookingState} from "@/state/cookingState";

interface ManagerProps {
    activeInterface: AIResponse | null;
}

export function InterfaceManager({ activeInterface }: ManagerProps) {

    const { activeTimers } = useCookingState();

    return (
        <>
            {activeTimers.map((timer, index) => {
                const stackY = 0.5 - (index * 1.2);
                const position: [number, number, number] = [5, stackY, -2];

                return(
                    <Timer key={timer.id}
                           seconds={timer.seconds}
                           label={timer.label}
                           customPosition={position} />
                )
            })}
            {activeInterface && renderActiveInterface(activeInterface)}
        </>
    )
}

function renderActiveInterface(aiState: AIResponse) {
    switch (aiState.type) {
        case 'instruction':
            return <InstructionCard text={aiState.data.text || ""} stepNumber={aiState.data.stepNumber || 0} />;
        case 'success':
            // Re-using instruction card for success message briefly
            return <InstructionCard text={aiState.data.label || "Success"} stepNumber={0} />;
        case 'timer':
            return null; // We handle timers separately now!
        default:
            return null;
    }
}
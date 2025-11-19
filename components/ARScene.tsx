'use client';

import {Canvas} from '@react-three/fiber';
import {createXRStore, XR} from '@react-three/xr';
import {OrbitControls} from '@react-three/drei';
import {useState, useEffect} from 'react';

// Hooks
import {useVoiceInput} from '@/hooks/useVoiceInput';

// Components
import {InterfaceManager} from '@/components/InterfaceManager';

// Global State (Renamed from 'store' to 'state' as requested)
import {useCookingState} from '@/state/cookingState';
import {useAssistantState, AssistantStatus, getStatusColor} from '@/state/assistantState';

// Types
import {AIResponse} from '@/types/interfaces';
import {WebcamFeed} from "@/components/WebcamFeed";

// Initialize XR Store with DOM Overlay enabled so buttons stay visible in AR
const store = createXRStore({domOverlay: true});

export default function ARScene() {
    // --- 1. GLOBAL STATE HOOKS ---
    const {
        activeRecipe, currentStepIndex,
        nextStep, prevStep, addToShoppingList, getCurrentStepData, addTimer, removeTimer, clearAllTimers
    } = useCookingState();

    const {status, setStatus} = useAssistantState();

    // --- 2. LOCAL STATE ---
    const [aiState, setAiState] = useState<AIResponse | null>(null);
    const {isListening, transcript, startListening} = useVoiceInput();

    const [isCameraMode, setIsCameraMode] = useState(false);

    // --- 3. EFFECT: SYNC VOICE STATUS TO ASSISTANT COLOR ---
    useEffect(() => {
        if (isListening) {
            setStatus(AssistantStatus.LISTENING);
        } else if (status === AssistantStatus.LISTENING && !isListening) {
            // If mic stopped, but we haven't processed yet, we are technically idle/waiting
            // But usually we jump straight to processing in the next effect
        }
    }, [isListening, setStatus, status]);

    // --- 4. EFFECT: AUTO-SEND ON SILENCE ---
    useEffect(() => {
        if (!isListening && transcript) {
            console.log("✅ Silence detected. Sending to Brain...");
            processVoice();
        }
    }, [isListening, transcript]);

    // --- 5. EFFECT: RECIPE ENGINE LOOP ---
    // Triggers whenever the step changes (via Next/Back)
    useEffect(() => {
        if (!activeRecipe) return;

        // Scenario A: Overview (Start)
        if (currentStepIndex === -1) {
            setAiState({
                type: 'ingredients',
                data: {items: activeRecipe.ingredients},
                voiceResponse: "Here are your ingredients."
            });
            return;
        }

        // Scenario B: Active Step
        const stepData = getCurrentStepData();
        if (stepData) {
            console.log("🔄 Loading Step:", stepData);

            // Safety Check (Req A6)
            if (stepData.warning) {
                // Show Warning First
                setAiState({
                    type: 'warning',
                    data: {title: "SAFETY ALERT", text: stepData.warning},
                    voiceResponse: "Please be careful."
                });

                // Wait 4 seconds, then show Instruction
                setTimeout(() => {
                    setAiState({
                        type: 'instruction',
                        data: {text: stepData.text, stepNumber: currentStepIndex + 1},
                        voiceResponse: stepData.text
                    });
                }, 4000);
            } else {
                // No warning, show immediately
                setAiState({
                    type: 'instruction',
                    data: {text: stepData.text, stepNumber: currentStepIndex + 1},
                    voiceResponse: stepData.text
                });
            }
        }
    }, [currentStepIndex, activeRecipe, getCurrentStepData]);

    const handleMicClick = () => {
        // 1. Visual Feedback IMMEDIATELY
        setStatus(AssistantStatus.LISTENING);

        // 2. Actually start the hardware
        startListening();
    };

    // --- 6. CORE LOGIC: PROCESS VOICE ---
    const processVoice = async () => {
        if (!transcript) return;

        setStatus(AssistantStatus.PROCESSING); // Turn button Orange
        console.log("🚀 Sending:", transcript);

        try {
            const res = await fetch('/api/assist', {
                method: 'POST',
                body: JSON.stringify({
                    userSpeech: transcript,
                    currentStepIndex,
                    recipeTitle: activeRecipe?.title
                })
            });

            const action = await res.json();
            console.log("🤖 AI Intent:", action);

            handleIntent(action);
            setStatus(AssistantStatus.IDLE); // Turn button White/Green
        } catch (error) {
            console.error("API Error", error);
            setStatus(AssistantStatus.IDLE);
        }
    };

    // --- 7. INTENT ROUTER ---
    const handleIntent = (action: any) => {
        // Navigation
        if (action.intent === 'NAVIGATE') {
            if (action.direction === 'next') nextStep();
            if (action.direction === 'prev') prevStep();
        }
        // Timers
        else if (action.intent === 'TIMER') {
            if (action.action === 'stop') {
                removeTimer(action.label || "");
                setAiState({type: 'success', data: {label: `Stopped ${action.label}`}, voiceResponse: "Stopped."});
                setTimeout(() => setAiState(null), 2000);
            } else if (action.action === 'stop_all') {
                clearAllTimers();
                setAiState({type: 'success', data: {label: "All Timers Stopped"}, voiceResponse: "All stopped."});
                setTimeout(() => setAiState(null), 2000);
            } else {
                addTimer(action.seconds, action.label || "Timer");
            }
        }
        // Shopping
        else if (action.intent === 'SHOPPING') {
            if (action.action === 'add') {
                addToShoppingList(action.item);
                setAiState({type: 'success', data: {label: `Added ${action.item}`}, voiceResponse: "Added to list."});
            }
        }
        // Ingredients
        else if (action.intent === 'SHOW_INGREDIENTS') {
            setAiState({
                type: 'ingredients',
                data: {items: activeRecipe?.ingredients},
                voiceResponse: "Here is the list."
            });
        }
        // Queries
        else if (action.intent === 'QUERY') {
            setAiState({
                type: 'instruction',
                data: {text: action.answer, stepNumber: 0},
                voiceResponse: "Here is the answer."
            });
        }
    };

    return (
        <div className="h-full w-full relative bg-gray-900">

            {isCameraMode && <WebcamFeed/>}

            {/* --- UI OVERLAY (Top Right) --- */}
            <div className="absolute z-10 top-4 right-4 flex flex-col gap-3 items-end">

                {/* Status Text */}
                <div className="text-white/50 text-xs uppercase font-mono tracking-widest">
                    {activeRecipe?.title || "No Recipe Loaded"}
                </div>

                {/* Main Dynamic Button */}
                <button
                    onClick={handleMicClick}
                    style={{backgroundColor: getStatusColor(status)}}
                    className={`px-6 py-3 rounded-full font-bold shadow-2xl transition-all scale-100 active:scale-95
             ${status === AssistantStatus.PROCESSING ? 'animate-pulse' : ''}
             ${status === AssistantStatus.IDLE ? 'text-black' : 'text-white'} 
           `}
                >
                    {status === AssistantStatus.IDLE && "🎤 Speak"}
                    {status === AssistantStatus.LISTENING && "👂 Listening..."}
                    {status === AssistantStatus.PROCESSING && "🧠 Thinking..."}
                </button>

                {/* Camera Toggle Button */}
                <button
                    onClick={() => setIsCameraMode(!isCameraMode)}
                    className={`backdrop-blur px-4 py-2 rounded-lg text-sm font-medium transition-all border
             ${isCameraMode
                        ? 'bg-red-500/80 text-white border-red-400'
                        : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                    }`}
                >
                    {isCameraMode ? "🚫 Stop Camera" : "📷 Start AR Mode"}
                </button>
            </div>

            {/* --- 3D SCENE --- */}
            <Canvas>
                {/* OrbitControls allows mouse movement (Incognito/Testing Mode) */}
                <OrbitControls makeDefault/>

                <XR store={store}>
                    <ambientLight intensity={0.5}/>
                    <pointLight position={[10, 10, 10]}/>

                    {/* The Manager decides which 3D panel to show */}
                    <InterfaceManager activeInterface={aiState}/>
                </XR>
            </Canvas>
        </div>
    );
}
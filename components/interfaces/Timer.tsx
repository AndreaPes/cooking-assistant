import {Html} from '@react-three/drei';
import {useEffect, useState, useRef} from 'react';

interface TimerProps {
    seconds: number;
    label?: string;
    customPosition?: [number, number, number];
}

export function Timer({seconds, label = "Timer", customPosition}: TimerProps) {
    const [timeLeft, setTimeLeft] = useState(seconds);
    const [isFinished, setIsFinished] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const playAlarmSound = () => {
        const alarmSound = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
        alarmSound.loop = true;
        alarmSound.volume = 0.5;
        alarmSound.play().catch(e => console.error("Audio autoplay blocked:", e));
        audioRef.current = alarmSound;
    };

    const stopAlarm = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }
    };

    const formatTime = (s: number) => {
        const minutes = Math.floor(s / 60);
        const secs = s % 60;
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };

    const positionVector = customPosition || [5, 0, -2];

    useEffect(() => {
        console.log("Restarting the Timer:", seconds);
        setTimeLeft(seconds);
        setIsFinished(false);
        setIsVisible(true);
    }, [seconds]);

    // Countdown Logic
    useEffect(() => {
        if (timeLeft > 0) {
            const interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
            return () => clearInterval(interval);
        } else {
            // Time is up!
            if (!isFinished) {
                setIsFinished(true);
                playAlarmSound();
            }
        }
    }, [timeLeft]);

    // "Self-Destruct" Logic
    useEffect(() => {
        if (isFinished) {
            const vanishTimer = setTimeout(() => {
                console.log("⏰ Auto-dismissing alarm...");
                stopAlarm();
                setIsVisible(false);
            }, 30000);

            return () => clearTimeout(vanishTimer);
        }
    }, [isFinished]);

    // Cleanup on unmount (Manual Stop)
    useEffect(() => {
        return () => stopAlarm();
    }, []);

    // 3. NEW: If not visible, render nothing
    if (!isVisible) return null;

    return (
        <group position={positionVector}>
            <Html transform occlude scale={0.4}>
                <div className={`
            w-48 p-4 rounded-2xl flex flex-col items-center select-none border backdrop-blur-md shadow-lg transition-all duration-500
            ${isFinished
                    ? 'bg-red-500/40 border-red-500 shadow-[0_0_50px_rgba(239,68,68,0.6)] animate-pulse'
                    : 'bg-white/10 border-white/20 shadow-sm'
                }
        `}>
          <span
              className={`uppercase tracking-wider text-[10px] font-bold mb-1 ${isFinished ? 'text-white' : 'text-white/60'}`}>
            {isFinished ? "TIME'S UP!" : label}
          </span>

                    <div className="text-4xl font-mono font-medium text-white tracking-tight drop-shadow-sm">
                        {isFinished ? "0:00" : formatTime(timeLeft)}
                    </div>

                    <div className="h-1 w-full bg-black/20 rounded-full mt-3 overflow-hidden">
                        <div
                            className={`h-full transition-all duration-1000 ease-linear ${isFinished ? 'bg-red-500 w-full' : 'bg-white/80'}`}
                            style={{width: isFinished ? '100%' : `${(timeLeft / seconds) * 100}%`}}
                        />
                    </div>
                </div>
            </Html>
        </group>
    );
}
// 1. Extend the global Window interface
interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
}

// 2. Define a basic type for the Recognition Event so we don't use 'any'
interface SpeechRecognitionEvent {
    results: {
        [index: number]: {
            [index: number]: {
                transcript: string;
            };
        };
    }[];
}

// 3. Define the Recognition Error event (optional but good practice)
interface SpeechRecognitionError {
    error: string;
    message: string;
}
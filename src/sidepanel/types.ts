export interface ChatMessage {
    sender: "user" | "ai";
    text: string;
}

export type LoadingPhase = "capturing" | "condensing" | "summarizing" | "chatting" | "saving" | null;

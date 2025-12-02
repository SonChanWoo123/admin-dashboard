export interface DetectionLog {
    id: number;
    created_at: string;
    text_content: string;
    confidence: number;
    threshold_used: number;
    model_version: string | null;
    is_harmful: boolean;
    user_id: string | null;
    metadata: Record<string, any>;
}


export interface UserFeedback {
    id: number;
    created_at: string;
    user_id: string | null;
    category: string;
    content: string;
    contact_email: string | null;
    status: string;
    metadata: Record<string, any>;
}

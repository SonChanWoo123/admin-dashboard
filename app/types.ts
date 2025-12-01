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

export interface AppSetting {
    key: string;
    value: string;
    description: string | null;
    updated_at: string;
}

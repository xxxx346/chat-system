export declare class Message {
    id: number;
    conversation_id: number;
    sender_id: number;
    type: 'text' | 'image' | 'file' | 'voice' | 'system';
    content: string;
    file_url: string;
    file_size: number;
    file_name: string;
    is_recalled: boolean;
    created_at: Date;
}
//# sourceMappingURL=Message.d.ts.map
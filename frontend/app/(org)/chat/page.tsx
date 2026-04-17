import { Metadata } from 'next';
import { ChatLayout } from '@/components/chat/ChatLayout';

export const metadata: Metadata = {
    title: 'Chat | EduVerse',
    description: 'Internal real-time communication platform',
};

export default function ChatPage() {
    return (
        <div className="h-[calc(100vh-4rem)] overflow-hidden">
            <ChatLayout />
        </div>
    );
}

import { Metadata } from 'next';
import { ChatLayout } from '@/components/chat/ChatLayout';

export const metadata: Metadata = {
    title: 'Platform Chat | EduVerse',
    description: 'Internal real-time communication platform for admins',
};

export default function AdminChatPage() {
    return (
        <div className="h-[calc(100vh-4rem)] overflow-hidden">
            <ChatLayout />
        </div>
    );
}

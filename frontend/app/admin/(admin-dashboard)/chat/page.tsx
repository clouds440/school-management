import { Metadata } from 'next';
import { ChatLayout } from '@/components/chat/ChatLayout';

export const metadata: Metadata = {
    title: 'Platform Chat | EduManage',
    description: 'Internal real-time communication platform for admins',
};

export default function AdminChatPage() {
    return (
        <div className="h-[calc(100vh-4rem)] p-4 md:p-6 overflow-hidden">
            <ChatLayout />
        </div>
    );
}

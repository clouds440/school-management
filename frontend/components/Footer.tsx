export default function Footer() {
    return (
        <footer className="relative z-10 text-center py-6 text-gray-300 border-t border-white/20 backdrop-blur-sm bg-white/30 shrink-0 mt-auto">
            <p>© {new Date().getFullYear()} EduManage. All rights reserved.</p>
        </footer>
    );
}

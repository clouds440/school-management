import { HeroButtons } from "./HeroButtons";
import { AlertCircle } from "lucide-react";
import { BackButton } from "./ui/BackButton";

type NotFoundProps = {
    page?: string | null;
    showBackBtn?: boolean;
};

export function NotFound({ page = 'page', showBackBtn = true}: NotFoundProps) {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-linear-to-br from-background via-background/95 to-background/90">
            <div className="max-w-md w-full text-center space-y-8">
                <div className="relative">
                    <div className="flex items-center justify-center">
                        <AlertCircle className="w-16 h-16 md:w-20 md:h-20 text-primary animate-bounce" />
                    </div>
                    <div className="text-[120px] md:text-[150px] font-black tracking-tighter leading-none text-primary/20 select-none">
                        404
                    </div>
                </div>

                <div className="space-y-3">
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">
                        {page} Not Found
                    </h1>
                    <p className="text-muted-foreground text-sm md:text-base">
                        The {page} you're looking for doesn't exist or has been moved.
                    </p>
                </div>

                {showBackBtn ? 
                    <BackButton showHome={false} className="mx-auto"/> : <HeroButtons /> 
                }
                
            </div>
        </div>
    );
}
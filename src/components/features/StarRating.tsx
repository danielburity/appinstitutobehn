import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface StarRatingProps {
    lessonId: string;
}

export function StarRating({ lessonId }: StarRatingProps) {
    const { user } = useAuth();
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user && lessonId) {
            loadRating();
        }
    }, [lessonId, user]);

    async function loadRating() {
        const { data, error } = await supabase
            .from('lesson_ratings')
            .select('rating')
            .eq('user_id', user?.id)
            .eq('lesson_id', lessonId)
            .single();

        if (data) {
            setRating(data.rating);
        } else {
            setRating(0);
        }
    }

    async function handleRate(value: number) {
        if (!user) {
            toast.error('Você precisa estar logado para avaliar.');
            return;
        }

        setLoading(true);
        const { error } = await supabase
            .from('lesson_ratings')
            .upsert({
                user_id: user.id,
                lesson_id: lessonId,
                rating: value,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id,lesson_id'
            });

        setLoading(false);

        if (error) {
            toast.error('Erro ao salvar avaliação.');
        } else {
            setRating(value);
            toast.success('Avaliação salva! Obrigado.');
        }
    }

    return (
        <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground font-medium">Avalie esta aula:</span>
            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        disabled={loading}
                        className={cn(
                            "p-0.5 transition-all hover:scale-110 disabled:opacity-50 disabled:hover:scale-100",
                            (hover || rating) >= star ? "text-yellow-400" : "text-slate-300"
                        )}
                        onMouseEnter={() => setHover(star)}
                        onMouseLeave={() => setHover(0)}
                        onClick={() => handleRate(star)}
                    >
                        <Star
                            className={cn(
                                "w-5 h-5",
                                (hover || rating) >= star ? "fill-current" : "fill-none"
                            )}
                        />
                    </button>
                ))}
            </div>
        </div>
    );
}

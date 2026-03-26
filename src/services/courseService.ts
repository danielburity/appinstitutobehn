import { supabase } from '@/lib/supabase';
import { Course, Module, Lesson } from '@/lib/types';

export const courseService = {
    async getAllPublished() {
        const { data, error } = await supabase
            .from('courses')
            .select('*')
            .eq('published', true)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as Course[];
    },

    async getById(id: string | number) {
        const { data, error } = await supabase
            .from('courses')
            .select('*, modules(*, lessons(*, lesson_attachments(*)))')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    },

    async getProgress(userId: string, lessonIds: string[]) {
        const { data, error } = await supabase
            .from('user_progress')
            .select('lesson_id, completed')
            .eq('user_id', userId)
            .in('lesson_id', lessonIds);

        if (error) throw error;
        return data;
    }
};

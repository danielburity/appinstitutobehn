import { supabase } from '@/lib/supabase';
import { Therapist, AppEvent } from '@/lib/types';

export const contentService = {
    async getTherapists() {
        const { data, error } = await supabase
            .from('therapists')
            .select('*')
            .order('rating', { ascending: false });

        if (error) throw error;
        return data as Therapist[];
    },

    async getEvents() {
        const { data, error } = await supabase
            .from('events')
            .select('*')
            .order('date', { ascending: true });

        if (error) throw error;
        return data as AppEvent[];
    }
};

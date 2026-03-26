import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fsurrpozofalqzfkrpnh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzdXJycG96b2ZhbHF6ZmtycG5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NTE5NDMsImV4cCI6MjA4MDUyNzk0M30.uyW0V8oBLSISWknP_SbzzaNmkAr5WrBsO5Q2OJgY0WU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixVideoUrls() {
    console.log("Fetching lessons to fix URLs...");

    const { data: lessons, error } = await supabase
        .from('lessons')
        .select('id, title, video_url')
        .ilike('video_url', '%vimeo.com/manage/videos/%');

    if (error) {
        console.error("Error fetching lessons:", error);
        return;
    }

    console.log(`Found ${lessons.length} lessons with incorrect Vimeo URLs.`);

    for (const lesson of lessons) {
        let oldUrl = lesson.video_url;
        // Replace prefix
        // Handling case with hash: https://vimeo.com/manage/videos/ID/HASH -> https://player.vimeo.com/video/ID?h=HASH
        let newUrl = oldUrl.replace('https://vimeo.com/manage/videos/', 'https://player.vimeo.com/video/');

        // Check if there's a hash at the end (Vimeo private/unlisted format in manage)
        // Matches ID/HASH
        const parts = newUrl.split('/');
        // After replacement, parts might look like ['https:', '', 'player.vimeo.com', 'video', 'ID', 'HASH']
        if (parts.length > 5) {
            const id = parts[4];
            const hash = parts[5];
            newUrl = `https://player.vimeo.com/video/${id}?h=${hash}`;
        }

        const { error: updateError } = await supabase
            .from('lessons')
            .update({ video_url: newUrl })
            .eq('id', lesson.id);

        if (updateError) {
            console.error(`Error updating lesson ${lesson.title}:`, updateError);
        } else {
            console.log(`Fixed: ${lesson.title} -> ${newUrl}`);
        }
    }

    console.log("All URLs fixed!");
}

fixVideoUrls();

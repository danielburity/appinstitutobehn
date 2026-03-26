import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fsurrpozofalqzfkrpnh.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzdXJycG96b2ZhbHF6ZmtycG5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NTE5NDMsImV4cCI6MjA4MDUyNzk0M30.uyW0V8oBLSISWknP_SbzzaNmkAr5WrBsO5Q2OJgY0WU';
const supabase = createClient(supabaseUrl, supabaseKey);

function generateSlug(text) {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, '-');
}

async function main() {
  console.log("Fetching courses...");
  const { data: courses, error } = await supabase.from('courses').select('id, title, slug');
  
  if (error) {
    console.error("Error fetching courses:", error);
    return;
  }
  
  console.log(`Found ${courses.length} courses.`);
  
  for (const course of courses) {
    if (!course.slug || course.slug.trim() === '') {
      const newSlug = generateSlug(course.title || `curso-${course.id}`);
      console.log(`Updating Course ${course.id}: ${course.title} => slug: ${newSlug}`);
      
      const { error: updateError } = await supabase
        .from('courses')
        .update({ slug: newSlug })
        .eq('id', course.id);
        
      if (updateError) {
        console.error(`Failed to update course ${course.id}:`, updateError);
      } else {
        console.log(`Course ${course.id} updated!`);
      }
    } else {
      console.log(`Course ${course.id} already has slug: ${course.slug}`);
    }
  }
  console.log("Done backfilling slugs!");
}
main();

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Hardcoded credentials for the temporary script
const supabaseUrl = 'https://fsurrpozofalqzfkrpnh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzdXJycG96b2ZhbHF6ZmtycG5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NTE5NDMsImV4cCI6MjA4MDUyNzk0M30.uyW0V8oBLSISWknP_SbzzaNmkAr5WrBsO5Q2OJgY0WU';

const supabase = createClient(supabaseUrl, supabaseKey);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function importFromCsv() {
    const filePath = path.join(process.cwd(), 'Aulas_Curso_Afiliados.csv');
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    // Skip header
    const dataLines = lines.slice(1).filter(line => line.trim() !== '');

    console.log(`Found ${dataLines.length} lessons to import.`);

    const coursesCache = new Map();
    const modulesCache = new Map();

    for (const line of dataLines) {
        const [
            curso_titulo,
            modulo_titulo,
            modulo_ordem,
            aula_titulo,
            aula_video_url,
            aula_descricao,
            aula_duracao,
            aula_ordem
        ] = line.split(';').map(s => s?.trim());

        if (!curso_titulo || !modulo_titulo || !aula_titulo) continue;

        // 1. Get or create Course
        let courseId = coursesCache.get(curso_titulo);
        if (!courseId) {
            const { data: existingCourse } = await supabase
                .from('courses')
                .select('id')
                .eq('title', curso_titulo)
                .single();

            if (existingCourse) {
                courseId = existingCourse.id;
            } else {
                const { data: newCourse, error: cError } = await supabase
                    .from('courses')
                    .insert({
                        title: curso_titulo,
                        description: `Curso importado: ${curso_titulo}`,
                        published: true,
                        image_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop'
                    })
                    .select()
                    .single();

                if (cError) {
                    console.error(`Error creating course ${curso_titulo}:`, cError);
                    continue;
                }
                courseId = newCourse.id;
            }
            coursesCache.set(curso_titulo, courseId);
        }

        // 2. Get or create Module
        const moduleKey = `${courseId}-${modulo_titulo}`;
        let moduleId = modulesCache.get(moduleKey);
        if (!moduleId) {
            const { data: existingModule } = await supabase
                .from('modules')
                .select('id')
                .eq('course_id', courseId)
                .eq('title', modulo_titulo)
                .single();

            if (existingModule) {
                moduleId = existingModule.id;
            } else {
                const { data: newModule, error: mError } = await supabase
                    .from('modules')
                    .insert({
                        course_id: courseId,
                        title: modulo_titulo,
                        order: parseInt(modulo_ordem) || 0
                    })
                    .select()
                    .single();

                if (mError) {
                    console.error(`Error creating module ${modulo_titulo}:`, mError);
                    continue;
                }
                moduleId = newModule.id;
            }
            modulesCache.set(moduleKey, moduleId);
        }

        // 3. Create Lesson
        const { error: lError } = await supabase
            .from('lessons')
            .insert({
                module_id: moduleId,
                title: aula_titulo,
                description: aula_descricao || `Conteúdo da aula ${aula_titulo}`,
                video_url: aula_video_url || null,
                duration: aula_duracao || '00:00',
                order: parseInt(aula_ordem) || 0,
                visible: true
            });


        if (lError) {
            console.error(`Error creating lesson ${aula_titulo}:`, lError);
        } else {
            console.log(`Successfully imported: ${modulo_titulo} -> ${aula_titulo}`);
        }
    }

    console.log('Import finished!');
}

importFromCsv();

import { createClient } from '@supabase/supabase-js';
import * as xlsx from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

// Hardcoded credentials for the temporary script
const supabaseUrl = 'https://fsurrpozofalqzfkrpnh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzdXJycG96b2ZhbHF6ZmtycG5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5NTE5NDMsImV4cCI6MjA4MDUyNzk0M30.uyW0V8oBLSISWknP_SbzzaNmkAr5WrBsO5Q2OJgY0WU';

const supabase = createClient(supabaseUrl, supabaseKey);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function importFromExcel(fileName) {
    const filePath = path.join(process.cwd(), fileName);
    
    console.log(`Reading Excel file: ${filePath}`);
    
    // Read the Excel workbook
    const workbook = xlsx.readFile(filePath);
    const sheetNames = workbook.SheetNames;
    
    console.log(`Found ${sheetNames.length} sheets to process:`, sheetNames.join(', '));
    
    const coursesCache = new Map();
    const modulesCache = new Map();
    
    let totalLessonsImported = 0;

    // Process each sheet individually
    for (const sheetName of sheetNames) {
        console.log(`\n--- Processing sheet: ${sheetName} ---`);
        const sheet = workbook.Sheets[sheetName];
        
        // Convert sheet to JSON array, expecting our standard headers
        // The first row should contain the headers
        const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
        
        if (rows.length <= 1) {
            console.log(`Sheet "${sheetName}" is empty or has only headers. Skipping.`);
            continue;
        }

        // Expected headers: curso_titulo, modulo_titulo, modulo_ordem, aula_titulo, aula_video_url, aula_descricao, aula_duracao, aula_ordem
        // The first row is the header row, we start from index 1 for data
        const dataRows = rows.slice(1);
        
        let sheetLessonsImported = 0;

        for (const row of dataRows) {
            // Unpack based on the expected column order.
            // Adjust if your Excel columns are in a different order, but this matches the CSV.
            const curso_titulo = row[0]?.toString().trim();
            const modulo_titulo = row[1]?.toString().trim();
            const modulo_ordem = row[2]?.toString().trim();
            const aula_titulo = row[3]?.toString().trim();
            const aula_video_url = row[4]?.toString().trim();
            const aula_descricao = row[5]?.toString().trim();
            const aula_duracao = row[6]?.toString().trim();
            const aula_ordem = row[7]?.toString().trim();

            if (!curso_titulo || !modulo_titulo || !aula_titulo) continue; // Skip incomplete rows

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
                sheetLessonsImported++;
                totalLessonsImported++;
            }
        }
        console.log(`Finished processing sheet "${sheetName}". Imported ${sheetLessonsImported} lessons.`);
    }

    console.log(`\nImport finished! Total lessons imported across all sheets: ${totalLessonsImported}`);
}

// Check if a filename is provided as a command line argument
const fileName = process.argv[2];
if (!fileName) {
    console.error('Please provide an Excel file name as an argument. Example: node import_excel_script.js meus_cursos.xlsx');
    process.exit(1);
}

importFromExcel(fileName);

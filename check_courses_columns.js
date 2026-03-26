
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase URL or Key");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
    const { data, error } = await supabase
        .from('courses')
        .select('*')
        .limit(1);

    if (error) {
        console.error("Error fetching courses:", error);
        return;
    }

    if (data && data.length > 0) {
        console.log("Columns in 'courses' table:", Object.keys(data[0]));
    } else {
        console.log("No data in 'courses' table to check columns.");
    }
}

checkColumns();

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
let u, k;
env.split('\n').forEach(l => {
  if (l.includes('URL=')) u = l.split('=')[1].trim().replace(/['"]/g, '');
  if (l.includes('PUBLISHABLE_KEY=')) k = l.split('=')[1].trim().replace(/['"]/g, '');
});

const supabase = createClient(u, k);

async function run() {
  const { data: courses } = await supabase.from('courses').select('id, teacher_id, title').limit(5);
  console.log(courses);
}

run();

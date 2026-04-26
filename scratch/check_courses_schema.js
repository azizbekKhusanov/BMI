import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nyohfhmimjxormhotsop.supabase.co'
const supabaseKey = 'sb_publishable_x1spW2zsHpDTMJ4rzGFoqg_hyqHY7G9'
const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .limit(1)
  
  if (error) {
    console.error('Error:', error)
    return
  }
  
  if (data.length > 0) {
    console.log('Columns in courses:', Object.keys(data[0]))
  } else {
    console.log('No courses found to check columns.')
  }
}

check()

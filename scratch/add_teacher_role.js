import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nyohfhmimjxormhotsop.supabase.co'
const supabaseKey = 'sb_publishable_x1spW2zsHpDTMJ4rzGFoqg_hyqHY7G9'
const supabase = createClient(supabaseUrl, supabaseKey)

async function addRole() {
  const { data, error } = await supabase
    .from('user_roles')
    .insert([
      { user_id: 'e6af8fc9-c818-494a-b699-bc4d490f9990', role: 'teacher' }
    ])
  
  if (error) {
    console.error('Error:', error)
  } else {
    console.log('Teacher role added successfully to Azizbek Xusanov!')
  }
}

addRole()

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nyohfhmimjxormhotsop.supabase.co'
const supabaseKey = 'sb_publishable_x1spW2zsHpDTMJ4rzGFoqg_hyqHY7G9'
const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
  const { data: userRoles, error } = await supabase
    .from('user_roles')
    .select('*')
    .eq('user_id', 'e6af8fc9-c818-494a-b699-bc4d490f9990')
  
  if (error) {
    console.error('Error:', error)
    return
  }
  
  console.log('User roles found for Azizbek Xusanov:', userRoles)
}

check()

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nyohfhmimjxormhotsop.supabase.co'
const supabaseKey = 'sb_publishable_x1spW2zsHpDTMJ4rzGFoqg_hyqHY7G9'
const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, user_id, full_name')
  
  if (error) {
    console.error('Error:', error)
    return
  }
  
  console.log('Profiles found:')
  profiles.forEach(p => {
    console.log(`Name: ${p.full_name}, ProfileID: ${p.id}, UserID: ${p.user_id}`)
  })
}

check()

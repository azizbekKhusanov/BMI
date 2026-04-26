import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nyohfhmimjxormhotsop.supabase.co'
const supabaseKey = 'sb_publishable_x1spW2zsHpDTMJ4rzGFoqg_hyqHY7G9'
const supabase = createClient(supabaseUrl, supabaseKey)

async function update() {
  const { data, error } = await supabase
    .from('profiles')
    .update({ role: 'teacher' })
    .eq('id', '6c6a7faf-a9b3-4f26-b69f-16535e805c1e')
  
  if (error) {
    console.error('Error:', error)
  } else {
    console.log('Role updated successfully for Azizbek Xusanov!')
  }
}

update()

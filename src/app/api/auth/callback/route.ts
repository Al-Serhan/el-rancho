import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.session) {
      const providerToken = data.session.provider_token;
      const userId = data.user.id;
      const guildId = process.env.DISCORD_GUILD_ID;

      if (providerToken && guildId) {
        try {
          // Fetch user's member data for the specific guild
          const response = await fetch(`https://discord.com/api/users/@me/guilds/${guildId}/member`, {
            headers: { Authorization: `Bearer ${providerToken}` }
          });
          
          if (response.ok) {
            const memberData = await response.json();
            // Fetch guild roles to match names
            const rolesResponse = await fetch(`https://discord.com/api/guilds/${guildId}/roles`, {
              headers: { Authorization: `Bearer ${providerToken}` }
            });
            
            let finalRole = 'Farmer';
            if (rolesResponse.ok) {
              const guildRoles = await rolesResponse.json();
              const userRoles = memberData.roles; // Array of role IDs
              
              // Check if any of the user's roles match "Sheriff"
              const hasSheriffRole = guildRoles.some((role: any) => 
                userRoles.includes(role.id) && role.name === 'Sheriff'
              );
              
              if (hasSheriffRole) finalRole = 'Sheriff';
            }

            // Update the profile in the database
            await supabase
              .from('profiles')
              .update({ role: finalRole })
              .eq('id', userId);
          }
        } catch (err) {
          console.error('Discord Role Check Failed:', err);
        }
      }
      
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/?error=auth_failed`)
}

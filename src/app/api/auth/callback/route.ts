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

      if (guildId && process.env.DISCORD_BOT_TOKEN) {
        try {
          const discordUserId = data.user.app_metadata.provider_id || data.user.user_metadata.provider_id;
          
          // Fetch user's member data using BOT TOKEN
          const response = await fetch(`https://discord.com/api/guilds/${guildId}/members/${discordUserId}`, {
            headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` }
          });
          
          if (response.ok) {
            const memberData = await response.json();
            
            // Fetch guild roles using BOT TOKEN
            const rolesResponse = await fetch(`https://discord.com/api/guilds/${guildId}/roles`, {
              headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` }
            });
            
            let finalRole = 'Farmer';
            if (rolesResponse.ok) {
              const guildRoles = await rolesResponse.json();
              const userRoles = memberData.roles;
              
              const hasSheriffRole = guildRoles.some((role: any) => 
                userRoles.includes(role.id) && role.name === 'Sheriff'
              );
              
              if (hasSheriffRole) finalRole = 'Sheriff';
            }

            await supabase
              .from('profiles')
              .update({ role: finalRole })
              .eq('id', userId);
          }
        } catch (err) {
          console.error('Discord Bot Role Check Failed:', err);
        }
      }
      
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/?error=auth_failed`)
}

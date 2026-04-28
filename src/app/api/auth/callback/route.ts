import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && data.session) {
      const userId = data.user.id;
      const guildId = process.env.DISCORD_GUILD_ID;

      if (guildId && process.env.DISCORD_BOT_TOKEN) {
        console.log(`🔍 Checking roles for user ${userId} in guild ${guildId}...`);
        try {
          const discordUserId = data.user.app_metadata.provider_id || data.user.user_metadata.provider_id;
          
          const response = await fetch(`https://discord.com/api/guilds/${guildId}/members/${discordUserId}`, {
            headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` }
          });
          
          if (response.ok) {
            const memberData = await response.json();
            const rolesResponse = await fetch(`https://discord.com/api/guilds/${guildId}/roles`, {
              headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` }
            });
            
            let finalRole = 'Farmer';
            if (rolesResponse.ok) {
              interface DiscordRole {
                id: string;
                name: string;
                position: number;
              }
              const guildRoles: DiscordRole[] = await rolesResponse.json();
              const userRoleIds: string[] = memberData.roles;
              
              // Dynamic Mapping: Filter roles user has, exclude @everyone, sort by hierarchy (position)
              const matchingRoles = guildRoles
                .filter(role => userRoleIds.includes(role.id) && role.name !== '@everyone')
                .sort((a, b) => b.position - a.position);

              if (matchingRoles.length > 0) {
                finalRole = matchingRoles[0].name;
                console.log(`⭐ SUCCESS: Dynamic role assigned: ${finalRole}`);
              } else {
                console.log('🌾 No specific server roles found, defaulting to Farmer.');
              }
            }

            // USE ADMIN CLIENT to bypass RLS and update the profile
            const adminSupabase = createAdminClient();
            const { error: updateError } = await adminSupabase
              .from('profiles')
              .update({ role: finalRole })
              .eq('id', userId);
            
            if (updateError) console.error('❌ Database update failed:', updateError);
          }
        } catch (err) {
          console.error('❌ Discord Role Check Failed:', err);
        }
      }
      
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/?error=auth_failed`)
}

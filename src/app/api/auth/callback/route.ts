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
      const userId = data.user.id;
      const guildId = process.env.DISCORD_GUILD_ID;

      if (guildId && process.env.DISCORD_BOT_TOKEN) {
        console.log(`🔍 Checking roles for user ${userId} in guild ${guildId}...`);
        try {
          const discordUserId = data.user.app_metadata.provider_id || data.user.user_metadata.provider_id;
          console.log(`🆔 Discord User ID detected: ${discordUserId}`);
          
          // Fetch user's member data using BOT TOKEN
          const response = await fetch(`https://discord.com/api/guilds/${guildId}/members/${discordUserId}`, {
            headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` }
          });
          
          if (response.ok) {
            const memberData = await response.json();
            console.log(`📦 Member data fetched successfully. Roles: ${memberData.roles}`);
            
            // Fetch guild roles using BOT TOKEN
            const rolesResponse = await fetch(`https://discord.com/api/guilds/${guildId}/roles`, {
              headers: { Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}` }
            });
            
            let finalRole = 'Farmer';
            if (rolesResponse.ok) {
              interface DiscordRole {
                id: string;
                name: string;
              }
              const guildRoles: DiscordRole[] = await rolesResponse.json();
              const userRoles: string[] = memberData.roles;
              
              const sheriffRole = guildRoles.find((role) => role.name === 'Sheriff');
              console.log(`📜 Sheriff Role ID in Guild: ${sheriffRole?.id || 'NOT FOUND'}`);

              const hasSheriffRole = sheriffRole && userRoles.includes(sheriffRole.id);
              
              if (hasSheriffRole) {
                console.log('⭐ SUCCESS: User has Sheriff role!');
                finalRole = 'Sheriff';
              } else {
                console.log('🌾 User does not have Sheriff role, defaulting to Farmer.');
              }
            } else {
              console.error(`❌ Failed to fetch guild roles: ${rolesResponse.status}`);
            }

            const { error: updateError } = await supabase
              .from('profiles')
              .update({ role: finalRole })
              .eq('id', userId);
            
            if (updateError) console.error('❌ Database update failed:', updateError);
          } else {
            console.error(`❌ Failed to fetch member data: ${response.status} ${response.statusText}`);
            const errorBody = await response.text();
            console.error(`📝 Error body: ${errorBody}`);
          }
        } catch (err) {
          console.error('❌ Discord Bot Role Check Failed:', err);
        }
      } else {
        console.warn('⚠️ Missing DISCORD_GUILD_ID or DISCORD_BOT_TOKEN');
      }
      
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/?error=auth_failed`)
}

const { SlashCommandBuilder } = require('@discordjs/builders');
const fs = require('fs');
const { guildID } = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

module.exports =
{
    data: new SlashCommandBuilder()     //Initialize command and its subcommand(s)
        .setName('vip')
        .setDescription("Manage a user's VIP status.")
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Add a user to the VIP list.')
                .addStringOption(option =>
                    option
                        .setName('username')
                        .setDescription('The VRChat display name of the user to be added.')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('info')
                .setDescription('View info for a VIP user.')),
    async execute(interaction)
    {
        const vips = JSON.parse(fs.readFileSync('./vips.json', 'utf8'));
        const guildMember = interaction.member;
        const user = guildMember.user;
        const homeGuild = interaction.guild; 
        const response = [];

        if (!homeGuild.available) return console.log(`Could not get guild from ID given in config. Stopping command...`);       //Failproof for if guild is suffering from an outage
        else console.log(`Found guild ${homeGuild.name}`);

        if (interaction.options.getSubcommand() === 'info')
        {
            console.log(`Looking for VRChat VIP linked to user ${user.tag}`);
            var foundNum = -1;

            for (var i = 0; i < vips.length; i++)
            {
                if (vips[i].discordID.indexOf(user.id) !== -1) foundNum = i;
            }

            if (foundNum > -1)          //Get VIP info from vips.json
            {
                var foundVRC = vips[foundNum].vrcName;          ///Create info response
                console.log(`VRChat user ${foundVRC} found at position ${foundNum}!`);
                response.push(`VRChat user found!`);
                response.push(`VRChat name: **${foundVRC}**`);
                response.push(`Discord tag: **${user.tag}**`);
                response.push(`\nNeed to change your VRChat name in the bot? Just run the **vip add** command with your new display name and you're set!`);
            }
            else
            {
                console.log(`No VRChat user tied to Discord user ${user.tag}! Reporting...`);
                response.push(`Whoops! No VRChat user linked to your Discord account!`);
            }
        }
        if (interaction.options.getSubcommand() === 'add')
        {
            const entName = interaction.options.getString('username');

            var isElite = guildMember.roles.cache.some(role => role.name === 'Elite');      //Check if guild member has Elite role
            console.log(`User is Elite? ${isElite}`);
            var isVIP = guildMember.roles.cache.some(role => role.name === 'VIP');          //Check if guild member has VIP role
            console.log(`User is VIP? ${isVIP}`);

            if (!isVIP && !isElite)
            {
                console.log(`User ${user.tag} not eligible to link accounts. Reporting...`);
                response.push(`Whoops! You must be at least a VIP user to link your VRChat account!`);      //Disallow forbidden user from getting those sweet sweet benefits
            }
            else
            {
                console.log(`Checking for preexisting entry tied to Discord user ${user.tag}`);

                const obj = JSON.parse(fs.readFileSync('./vips.json', { encoding: 'utf8' } ));          //Write to vips.json
                var foundNum = -1;

                console.log(JSON.stringify(obj, null, 2));

                for (var i = 0; i < obj.vips.length; i++)
                {
                    if (vips[i].discordID.indexOf(user.id) !== -1) foundNum = i;
                }

                if (foundNum > -1)
                {
                    var oldName = obj.vips[foundNum].vrcName;
                    console.log(`VRChat user ${oldName} linked to given Discord account. Updating name...`);
                    obj.vips[foundNum].vrcName = entName;
                    console.log(`VRChat user changed from ${oldName} to ${entName}`);
                    console.log(JSON.stringify(obj, null, 2));
                }
                else
                {
                    console.log(`Adding new VRChat user ${entName} tied to Discord user ${user.tag}`);

                    obj.vips.push({ discordID: user.id, vrcName: entName });
                    console.log(JSON.stringify(obj, null, 2));
                }

                fs.writeFileSync('./vips.json', JSON.stringify(obj, null, 2), 'utf8');          //Write to vips.json
            }

            response.push(`Success!! VRChat user **${entName}** is now linked to your Discord account!`);
        };

        interaction.reply(response.join('\n'), { split: true });
        console.log('Command results posted.');
    },
};
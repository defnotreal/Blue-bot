//Call all our prerequisite bullshit
const { Client, Collection, Intents } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const fs = require('fs');
const { CronJob } = require('cron');
const bot = new Client({
    intents:
    [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MEMBERS
    ]
});
const { guildID, token } = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
const commands = [];
bot.commands = new Collection();

for (const file of commandFiles)
{
    //Add all command files to the bot.commands collection
    const command = require(`./commands/${file}`);
    console.log(`Loaded command: ${file}`);
    commands.push(command.data.toJSON());
    bot.commands.set(command.data.name, command);
}

bot.once('ready', () => {
    console.log(`${bot.commands.size} total commands loaded`);
    console.log(`Signed in as ${bot.user.tag}!`);

    const rest = new REST({ version: '9' }).setToken(token);
    const clientID = bot.user.id;

    //Registers all slash commands
    (async () => {
        try
        {
            await rest.put(Routes.applicationGuildCommands(clientID, guildID), { body: commands });
            bot.guilds.fetch(guildID).then(guild => { console.log(`Successfully registered commands in guild ${guild.name}!`); });
        }
        catch (err) { console.error(err); }
    })();

    //Get list updater up on cron
    const update = new CronJob('0 0 */4 * * *', updateList());
    update.start();
});

bot.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    //Find command, returns if command is invalid
    const command = bot.commands.get(interaction.commandName);
    if (!command) return;

    try
    {
        console.log(`Command ${interaction.commandName} run by ${interaction.user.tag}`);
        await command.execute(interaction); //Runs command through its named JS file
    }
    catch (error)
    {
        console.error(error);
        await interaction.reply({ content: `Whoops! I've run into an error! Let someone in charge know this happened, please!`, ephemeral: true });
    }
});

function updateList()
{
    console.log(`updateList function activated!`);
    bot.guilds.fetch(guildID).then(guild => {   //Load guild beforehand for failproofing
        if (!guild.available) return console.log('Guild could not be found. Skipping list update for now...');
        else
        {
            (async () => {
                var guildMembers = await guild.members.fetch();

                //Parse VIPs and guild members
                var vips = JSON.parse(fs.readFileSync('./vips.json', { encoding: 'utf8' } ));
                var memberList = guildMembers.toJSON();
                var vipList = [];
                var usersRemoved = 0;

                for (var i = 0; i < vips.length; i++) vipList.push(vips[i].discordID); 

                for (var i = 0; i < memberList.length; i++)
                {
                    if (vipList.indexOf(memberList[i].user.id) !== -1)      //Check which guild members are listed in vips.json
                    {
                        console.log(`Found user ${memberList[i].user.tag}`);
                        console.log(`Checking eligibility of user ${memberList[i].user.tag}...`);
                        var isElite = memberList[i].roles.cache.some(role => role.name === 'Elite');        //Check if flagged guild member has Elite role
                        var isVIP = memberList[i].roles.cache.some(role => role.name === 'VIP');            //Check if flagged guild member has VIP role

                        if (!isElite && !isVIP)
                        {
                            console.log(`User ${memberList[i].user.tag} no longer eligible for VIP. Removing from list...`);

                            vips.splice(vipList.indexOf(memberList[i].user.id), 1);     //Cut member from vips.json if they failed both role checks
                            usersRemoved++;                                             //Adds to a number shown at the end of the function

                            fs.writeFileSync('./vips.json', JSON.stringify(vips, null, 2), 'utf8');     //Write to vips.json

                            console.log(`User ${memberList[i].user.tag} successfully removed from VIP list. Continuing...`);
                        }
                        else console.log(`User ${memberList[i].user.tag} meets requirements to keep VIP. Continuing...`);
                    }
                }
                console.log(`${usersRemoved} users removed from list`);
            }
        )();}
    });
}

bot.login(token);
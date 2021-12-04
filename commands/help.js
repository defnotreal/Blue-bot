const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports =
{
    data: new SlashCommandBuilder()     //Initialize command and its subcommand(s)
        .setName('help')
        .setDescription('Get information on the bot and its commands.')
        .addStringOption(option => 
            option
                .setName('command')
                .setDescription(`View info about a specific command.`)),
    async execute(interaction)
    {
        const response = [];
        const { commands } = interaction.client; 

        if (!interaction.options.getString('command'))
        {
            console.log('Help command run without argument');
            response.push(`Greetings! My name is Blue-bot! Below are ${commands.size} commands you can use:`);
            response.push(commands.map(command => command.data.toJSON().name).join(' | '));
            response.push('Blue-bot created by defnotreal_ and bluekunVRC.');
        }
        else
        {
            var input = interaction.options.getString('command');
            console.log(`Help command run with argument '${input}'`)
            var command = commands.get(input);
            if (!command) response.push(`Whoops! Couldn't find command '${input}'!`);
            else
            {
                response.push(`Name: **${command.data.toJSON().name}**`);
                response.push(`Description: **${command.data.toJSON().description}**`);
            }

            const subcommands = command.data.toJSON().options;

            if (subcommands.length)
            {
                response.push(`\nThis command has ${subcommands.length} subcommands:`);
                for (var i = 0; i < subcommands.length; i++)
                {
                    response.push(`**${subcommands[i].name}** - ${subcommands[i].description}`);
                }
            };
        }

        console.log(`Parsing finished. Result: \n\x1b[32m${response.join(`\n`)}\x1b[0m`);
        interaction.reply(response.join(`\n`), { split: true });
    }
}
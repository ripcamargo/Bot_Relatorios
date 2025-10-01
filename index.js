// leitor de qr code
const qrcode = require('qrcode-terminal');
const { Client } = require('whatsapp-web.js'); 

const client = new Client({
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});


// serviço de leitura do qr code
client.on('qr', qr => {
    qrcode.generate(qr, {small: true});
});

// apos isso ele diz que foi tudo certo
client.on('ready', () => {
    console.log('Tudo certo! WhatsApp conectado.');
});

// inicializa
client.initialize();

const delay = ms => new Promise(res => setTimeout(res, ms)); // delay entre ações

// Função para enviar opções finais em qualquer fluxo
async function sendEndOptions(client, msg) {
    await client.sendMessage(
        msg.from,
        'O que você deseja fazer agora?\n\n0 - 🔙 Voltar ao menu principal\n9 - ❌ Encerrar atendimento'
    );
}

// Estado para acompanhar se cliente precisa mandar dados após escolher opção 5
let aguardandoInfo = {};

// Fluxo principal
client.on('message', async msg => {

    // ⏰ BLOCO DE HORÁRIO + DIA DA SEMANA
    const agora = new Date();
    const hora = agora.getHours();
    const dia = agora.getDay();

    const dentroDoHorario = hora >= 6 && hora < 19;
    const diaUtil = dia >= 1 && dia <= 5; // de segunda (1) a sexta (5)

    if (!dentroDoHorario || !diaUtil) {
        await client.sendMessage(
            msg.from,
            '⏰ Olá! Nosso atendimento funciona de *segunda a sexta, das 08h às 17h*. ' +
            'Por favor, retorne dentro do nosso período de atendimento para darmos continuidade. 😉'
        );
        return; // impede que caia no restante do fluxo
    }
    

    // MENU PRINCIPAL
    if (msg.body.match(/(menu|Menu|dia|tarde|noite|oi|Oi|Olá|olá|ola|Ola)/i) && msg.from.endsWith('@c.us')) {

        const chat = await msg.getChat();

        await delay(3000);
        await chat.sendStateTyping();
        await delay(3000);

        const contact = await msg.getContact();
        const name = contact.pushname;

        await client.sendMessage(msg.from,
            'Olá ' + name.split(" ")[0] + '! 👋\n\n' +
            'Sou o assistente virtual da equipe de Relatórios CEM. Como posso ajudar você hoje?\n\n' +
            'Digite o número de uma das opções abaixo:\n\n' +
            '1 - 🔎 Consultar status de pedido em andamento\n' +
            '2 - ✏️ Solicitar um novo relatório ou ajuste\n' +
            '3 - 🚨 Auxílio urgente em relatórios do CEM\n' +
            '4 - 💭 Dúvidas sobre novas personalizações\n' +
            '5 - 💬 Falar com um atendente'
        );
    }

    // OPÇÃO 1 - Consultar status
    if (msg.body === '1' && msg.from.endsWith('@c.us')) {
        const chat = await msg.getChat();

        await delay(3000);
        await chat.sendStateTyping();
        await delay(3000);
        await client.sendMessage(msg.from, 
            'Para consultar o andamento do seu pedido você precisará do *número do ticket*. 🔢\n\n' +
            'Esse número é enviado automaticamente para o seu e-mail assim que você solicita a personalização.'
        );

        await delay(3000);
        await chat.sendStateTyping();
        await delay(3000);
        await client.sendMessage(msg.from, 
            'Com esse número em mãos, você pode acompanhar o status do seu pedido neste link:\n👉 http://consulta-tickets-cem.vercel.app'
        );

        await delay(9000);
        await sendEndOptions(client, msg);
    }

    // OPÇÃO 2 - Novo pedido
    if (msg.body === '2' && msg.from.endsWith('@c.us')) {
        const chat = await msg.getChat();

        await delay(3000);
        await chat.sendStateTyping();
        await delay(3000);
        await client.sendMessage(msg.from, 
            'Todos os novos pedidos passam por uma análise de complexidade e prazo antes de entrarem na fila de execução. 📝'
        );

        await delay(3000);
        await chat.sendStateTyping();
        await delay(3000);
        await client.sendMessage(msg.from, 
            '📧 Para solicitar *qualquer tipo de ajuste ou pedir um novo relatório*, envie todas as informações necessárias para o e-mail:\nrelatorios@alumisoft.com.br'
        );

        await delay(3000);
        await chat.sendStateTyping();
        await delay(3000);
        await client.sendMessage(msg.from, 
            'Você pode incluir anexos como imagens, arquivos de texto e qualquer detalhe que ajude a esclarecer seu pedido. \n\n' +
            'Ao enviar, você receberá um número de ticket junto com a previsão de entrega. ✔️\n\n' +
            'Ficamos no aguardo do seu contato!'
        );

        await delay(9000);
        await sendEndOptions(client, msg);
    }

    // OPÇÃO 3 - Urgência
    if (msg.body === '3' && msg.from.endsWith('@c.us')) {
        const chat = await msg.getChat();

        await delay(3000);
        await chat.sendStateTyping();
        await delay(3000);
        await client.sendMessage(msg.from, 
            '🚨 Para casos urgentes relacionados ao CEM ou relatórios, entre em contato direto pelo telefone:\n📞 (15) 98176-0877\n\n' +
            '⏰ Atendimento imediato de segunda a sexta, das 08h às 17h.'
        );
        
        await delay(9000); 
        await sendEndOptions(client, msg);
    }

    // OPÇÃO 4 - Dúvidas sobre personalizações
    if (msg.body === '4' && msg.from.endsWith('@c.us')) {
        const chat = await msg.getChat();

        await delay(3000);
        await chat.sendStateTyping();
        await delay(3000);
        await client.sendMessage(msg.from, 
            'Se você tem dúvida sobre a viabilidade da sua personalização, envie sua solicitação para:\n📧 relatorios@alumisoft.com.br'
        );

        await delay(3000);
        await chat.sendStateTyping();
        await delay(3000);
        await client.sendMessage(msg.from, 
            'Alguns ajustes muito específicos podem ter limitações técnicas, mas nesses casos podemos encaminhar sua sugestão como melhoria para o desenvolvedor. 🔧\n\n' +
            'De qualquer forma, aguardamos seu contato por e-mail para avaliar sua ideia!'
        );

        await delay(9000);
        await sendEndOptions(client, msg);
    }

    // OPÇÃO 5 - Falar com atendente
    if (msg.body === '5' && msg.from.endsWith('@c.us')) {
        const chat = await msg.getChat();

        await delay(3000);
        await chat.sendStateTyping();
        await delay(3000);
        await client.sendMessage(msg.from, 
            'Para agilizar o atendimento, por favor nos envie as seguintes informações:\n\n' +
            '- Seu nome\n- Empresa\n- Cidade\n- E-mail de contato\n- Descreva sua dúvida ou necessidade'
        );

        await delay(3000);
        await chat.sendStateTyping();
        await delay(3000);
        await client.sendMessage(msg.from, 
            '⚠️ Importante: diferente do suporte técnico, o atendimento da equipe de relatórios não é em tempo real. ⏳\n\n' +
            'As solicitações são avaliadas em horários específicos ao longo do dia durante a semana. Por isso, a resposta pode não ser imediata.'
        );

        // Marca esse cliente como aguardando os dados
        aguardandoInfo[msg.from] = true;
    }

    // Resposta depois que cliente envia as infos (opção 5)
    if (aguardandoInfo[msg.from] && msg.body !== '5') {
        const chat = await msg.getChat();

        await delay(3000);
        await chat.sendStateTyping();
        await delay(3000);
        await client.sendMessage(msg.from, 
            '✅ Recebemos suas informações! Nossa equipe analisará sua solicitação e retornará assim que possível.\n\nObrigado pela compreensão e confiança! 🙏'
        );


        delete aguardandoInfo[msg.from]; // reseta estado
    }

    // VOLTAR AO MENU PRINCIPAL
    if (msg.body === '0' && msg.from.endsWith('@c.us')) {
        const contact = await msg.getContact();
        const name = contact.pushname;
        await client.sendMessage(msg.from,
            '🔙 Voltando ao menu principal...\n\n' +
            'Olá ' + name.split(" ")[0] + '! 👋 Como posso ajudar você hoje?\n\n' +
            'Digite o número de uma das opções abaixo:\n\n' +
            '1 - 🔎 Consultar status de pedido em andamento\n' +
            '2 - ✏️ Solicitar um novo relatório ou ajuste\n' +
            '3 - 🚨 Auxílio urgente em relatórios do CEM\n' +
            '4 - 💭 Dúvidas sobre novas personalizações\n' +
            '5 - 💬 Falar com um atendente'
        );
    }

    // ENCERRAR ATENDIMENTO
    if (msg.body === '9' && msg.from.endsWith('@c.us')) {
        await client.sendMessage(
            msg.from,
            '✅ Atendimento encerrado.\n\nObrigado por entrar em contato com a equipe de Relatórios CEM! Até breve 👋'
        );
    }

});

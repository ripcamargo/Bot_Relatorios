// Dependências necessárias
const qrcode = require('qrcode');
const fs = require('fs');
const { Client, LocalAuth } = require('whatsapp-web.js');
const http = require('http');

// Variável para armazenar o QR Code
let qrCodeData = null;
let isReady = false;

// Servidor HTTP para exibir o QR Code
const server = http.createServer((req, res) => {
    if (req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        
        if (isReady) {
            res.end(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Bot WhatsApp - Status</title>
                    <meta charset="utf-8">
                    <style>
                        body { 
                            font-family: Arial, sans-serif; 
                            text-align: center; 
                            padding: 50px;
                            background: #0a0e27;
                            color: #fff;
                        }
                        .success {
                            font-size: 24px;
                            color: #25D366;
                        }
                    </style>
                </head>
                <body>
                    <h1>✅ Bot Conectado!</h1>
                    <p class="success">O bot está online e funcionando corretamente.</p>
                    <p>Você pode fechar esta página.</p>
                </body>
                </html>
            `);
        } else if (qrCodeData) {
            res.end(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Bot WhatsApp - QR Code</title>
                    <meta charset="utf-8">
                    <meta http-equiv="refresh" content="10">
                    <style>
                        body { 
                            font-family: Arial, sans-serif; 
                            text-align: center; 
                            padding: 50px;
                            background: #0a0e27;
                            color: #fff;
                        }
                        img { 
                            border: 10px solid #25D366; 
                            border-radius: 15px;
                            margin: 20px auto;
                            background: white;
                            padding: 20px;
                        }
                        .instructions {
                            max-width: 500px;
                            margin: 20px auto;
                            text-align: left;
                            background: #1a1f3a;
                            padding: 20px;
                            border-radius: 10px;
                        }
                        .warning {
                            color: #ff9800;
                            font-size: 14px;
                            margin-top: 20px;
                        }
                    </style>
                </head>
                <body>
                    <h1>📱 Escaneie o QR Code</h1>
                    <p>Abra o WhatsApp no seu celular e escaneie o código abaixo:</p>
                    <img src="${qrCodeData}" alt="QR Code" />
                    <div class="instructions">
                        <h3>📋 Instruções:</h3>
                        <ol>
                            <li>Abra o WhatsApp no seu celular</li>
                            <li>Toque em <strong>Mais opções (⋮)</strong> ou <strong>Configurações</strong></li>
                            <li>Toque em <strong>Aparelhos conectados</strong></li>
                            <li>Toque em <strong>Conectar um aparelho</strong></li>
                            <li>Aponte seu celular para esta tela para escanear o código</li>
                        </ol>
                    </div>
                    <p class="warning">⚠️ Esta página atualiza automaticamente a cada 10 segundos</p>
                </body>
                </html>
            `);
        } else {
            res.end(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Bot WhatsApp - Carregando</title>
                    <meta charset="utf-8">
                    <meta http-equiv="refresh" content="3">
                    <style>
                        body { 
                            font-family: Arial, sans-serif; 
                            text-align: center; 
                            padding: 50px;
                            background: #0a0e27;
                            color: #fff;
                        }
                        .loader {
                            border: 8px solid #1a1f3a;
                            border-top: 8px solid #25D366;
                            border-radius: 50%;
                            width: 60px;
                            height: 60px;
                            animation: spin 1s linear infinite;
                            margin: 20px auto;
                        }
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    </style>
                </head>
                <body>
                    <h1>⏳ Iniciando Bot...</h1>
                    <div class="loader"></div>
                    <p>Aguarde enquanto geramos o QR Code...</p>
                </body>
                </html>
            `);
        }
    } else if (req.url === '/health') {
        // Endpoint para Railway verificar se o serviço está rodando
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            status: 'ok', 
            connected: isReady,
            hasQrCode: !!qrCodeData 
        }));
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

// Porta do servidor (Railway usa a variável PORT)
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🌐 Servidor rodando na porta ${PORT}`);
    console.log(`📱 Acesse http://localhost:${PORT} para ver o QR Code`);
});

// Cliente WhatsApp com autenticação persistida
const client = new Client({
    authStrategy: new LocalAuth({ 
        clientId: "bot-cem",
        dataPath: "./wwebjs_auth"
    }),
    puppeteer: {
        headless: true,
        // REMOVA O executablePath
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ]
    }
});


// Gerar QR Code quando necessário
client.on('qr', async (qr) => {
    console.log('📱 QR Code recebido! Gerando imagem...');
    try {
        // Gera o QR Code como Data URL
        qrCodeData = await qrcode.toDataURL(qr);
        console.log(`✅ QR Code disponível em: http://localhost:${PORT}`);
        console.log('⚠️  No Railway, use a URL pública do seu serviço!');
    } catch (err) {
        console.error('❌ Erro ao gerar QR Code:', err);
    }
});

// Quando autenticado
client.on('authenticated', () => {
    console.log('✅ Autenticado com sucesso!');
    qrCodeData = null; // Limpa o QR Code
});

// Quando pronto
client.on('ready', () => {
    isReady = true;
    qrCodeData = null;
    console.log('🤖 Bot pronto e conectado ao WhatsApp!');
});

// Quando desconectado
client.on('disconnected', (reason) => {
    console.log('⚠️  Bot desconectado:', reason);
    isReady = false;
});

// Inicializa o cliente
client.initialize();

// ======== Seu código de mensagens ========
const delay = ms => new Promise(res => setTimeout(res, ms));

async function sendEndOptions(client, msg) {
    await client.sendMessage(
        msg.from,
        'O que deseja fazer agora?\n0 - 🔙 Voltar ao menu\n9 - ❌ Encerrar atendimento'
    );
}

let aguardandoInfo = {};

// Fluxo principal
client.on('message', async msg => {

    // ⏰ BLOCO DE HORÁRIO + DIA DA SEMANA
    const agora = new Date();
    const hora = agora.getHours();
    const dia = agora.getDay();

    const dentroDoHorario = hora >= 6 && hora < 19;
    const diaUtil = dia >= 1 && dia <= 5;

    if (!dentroDoHorario || !diaUtil) {
        await client.sendMessage(
            msg.from,
            '⏰ Olá! Nosso atendimento funciona de *segunda a sexta, das 08h às 17h*. ' +
            'Por favor, retorne dentro do nosso período de atendimento para darmos continuidade. 😉'
        );
        return;
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
            'Todos os novos pedidos passam por uma análise de complexidade e prazo antes de entrarem na fila de execução. 🔒'
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

        delete aguardandoInfo[msg.from];
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
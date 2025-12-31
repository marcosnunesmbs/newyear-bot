require('dotenv').config();
const axios = require('axios');
const cron = require('node-cron');
const fs = require('fs').promises;
const path = require('path');

const API_URL = process.env.WAHA_URL_API + '/api/sendText';
const API_KEY = process.env.WAHA_API_KEY;
const SESSION = process.env.SESSION;
const DATA_NATAL = process.env.DATA_NATAL;
const DATA_ANO_NOVO = process.env.DATA_ANO_NOVO;
const CRON_TIME = process.env.CRON_TIME || '*/5 * * * *';

let EXECUTION = false;

// Cria arquivo de log com timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').split('Z')[0];
const LOG_FILE = path.join(__dirname, `logs_${timestamp}.txt`);

// Função para logar no console e no arquivo
async function log(message) {
    console.log(message);
    const logMessage = `[${new Date().toISOString()}] ${message}\n`;
    await fs.appendFile(LOG_FILE, logMessage).catch(err => {
        console.error('Erro ao escrever no arquivo de log:', err);
    });
}

const NATAL_LOCK = path.join(__dirname, 'natal_finished.lock');
const ANO_NOVO_LOCK = path.join(__dirname, 'ano_novo_finished.lock');

async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

async function sendMessage(userId, text) {
    const data = {
        session: SESSION,
        chatId: `${userId}@c.us`,
        text: text
    };

    const config = {
        headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': API_KEY
        }
    };

    try {
        await axios.post(API_URL, data, config);
        await log(`✅ Sucesso: ${userId}`);
        return true;
    } catch (error) {
        await log(`❌ Erro no envio para ${userId}. Tentando correção de dígito...`);

        let userIdCorrigido;
        
        // Fallback: ajusta o 9º dígito (5ª posição) conforme o tamanho
        if (userId.length === 13) {
            // Remove o 5º dígito (de 13 para 12 dígitos)
            userIdCorrigido = userId.slice(0, 4) + userId.slice(5);
        } else if (userId.length === 12) {
            // Adiciona 9 na 5ª posição (de 12 para 13 dígitos)
            userIdCorrigido = userId.slice(0, 4) + '9' + userId.slice(4);
        } else {
            // Tamanho inesperado, não tenta correção
            await log(`❌ Tamanho de número inesperado (${userId.length} dígitos): ${userId}`);
            return false;
        }

        const dataCorrigido = {
            session: SESSION,
            chatId: `${userIdCorrigido}@c.us`,
            text: text
        };

        try {
            await axios.post(API_URL, dataCorrigido, config);
            await log(`✅ Sucesso com correção: ${userIdCorrigido}`);
            return true;
        } catch (errorCorrecao) {
            await log(`❌ Falha mesmo com correção para ${userId}`);
            return false;
        }
    }
}

async function processContacts(messageFile, lockFile) {
    await log(`\n📨 Iniciando envio de mensagens: ${messageFile}`);

    // Lê a mensagem template
    const messageTemplate = await fs.readFile(messageFile, 'utf-8');

    // Lê os contatos
    const contactsData = await fs.readFile('contatos.txt', 'utf-8');
    const contacts = contactsData.trim().split('\n')
        .filter(line => line.trim())
        .map(line => {
            const [nome, userId] = line.split(',');
            return { nome: nome.trim(), userId: userId.trim() };
        });

    await log(`📋 Total de contatos: ${contacts.length}`);

    // Envia para cada contato
    for (const contact of contacts) {
        const personalizedMessage = messageTemplate.replace(/\$nome\$/g, contact.nome);
        await log(`\n📤 Enviando para ${contact.nome} (${contact.userId})...`);
        await sendMessage(contact.userId, personalizedMessage);

        // Aguarda 10 segundos entre envios para não sobrecarregar a API
        await log('⏳ Aguardando 10 segundos antes do próximo envio...');
        await new Promise(resolve => setTimeout(resolve, 10000));

    }

    // Cria arquivo lock
    await fs.writeFile(lockFile, new Date().toISOString());
    await log(`\n✅ Processo finalizado! Lock criado: ${lockFile}`);
}

async function checkAndSend() {
    const natalLockExists = await fileExists(NATAL_LOCK);
    const anoNovoLockExists = await fileExists(ANO_NOVO_LOCK);

    // Se ambos os locks existem, encerra o processo
    if (natalLockExists && anoNovoLockExists) {
        await log('🎉 Todos os envios foram concluídos. Encerrando...');
        process.exit(0);
    }

    // Obtém data/hora atual em GMT-3
    const agora = new Date();
    const agoraGMT3 = new Date(agora.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
    agoraGMT3.setHours(agoraGMT3.getHours() - 3);
    console.log(`Data/Hora Atual (GMT-3): ${agoraGMT3.toISOString()}`);
    
    // Converte datas do .env para objetos Date
    const [dataNatal, horaNatal] = DATA_NATAL.split(' ');
    const [anoN, mesN, diaN] = dataNatal.split('-');
    const [horaN, minN] = horaNatal.split(':');
    const dataHoraNatal = new Date(anoN, mesN - 1, diaN, horaN - 3, minN);
    console.log(`Data/Hora Natal (GMT-3): ${dataHoraNatal.toISOString()}`);
    
    const [dataAnoNovo, horaAnoNovo] = DATA_ANO_NOVO.split(' ');
    const [anoA, mesA, diaA] = dataAnoNovo.split('-');
    const [horaA, minA] = horaAnoNovo.split(':');
    const dataHoraAnoNovo = new Date(anoA, mesA - 1, diaA, horaA - 3, minA);
    console.log(`Data/Hora Ano Novo (GMT-3): ${dataHoraAnoNovo.toISOString()}`);

    // Verifica se é hora de enviar mensagem de Natal e ainda não foi processado
    if (agoraGMT3 >= dataHoraNatal && !natalLockExists) {
        EXECUTION = true;
        await processContacts('msg_natal.txt', NATAL_LOCK);
        EXECUTION = false;
    }

    // Verifica se é hora de enviar mensagem de Ano Novo e ainda não foi processado
    if (agoraGMT3 >= dataHoraAnoNovo && !anoNovoLockExists) {
        EXECUTION = true;
        await processContacts('msg_ano_novo.txt', ANO_NOVO_LOCK);
        EXECUTION = false;
    }
}

// Função principal assíncrona
(async () => {
    await log('🎄 Bot de Mensagens de Fim de Ano iniciado!');
    await log(`📅 Data Natal: ${DATA_NATAL}`);
    await log(`📅 Data Ano Novo: ${DATA_ANO_NOVO}`);
    await log(`📄 Arquivo de log: ${LOG_FILE}`);
    await log(`⏰ Intervalo de verificação: ${CRON_TIME}\n`);

    // Executa imediatamente ao iniciar
    await checkAndSend();

    // Agenda para rodar conforme CRON_TIME
    cron.schedule(CRON_TIME, async () => {
        if (EXECUTION === false) {
            const now = new Date().toLocaleString('pt-BR');
            await log(`⏰ Verificação: ${now}`);
            await checkAndSend();
        }
    });
})();

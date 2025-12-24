# 🎄 Holiday Message Bot (Natal & Ano Novo)

    Este bot automatiza o envio de mensagens personalizadas para contatos via API, utilizando Node.js. Ele verifica as datas programadas e gerencia o envio para evitar duplicidade através de arquivos de trava (lock files).

# 🛠️ Tecnologias e Dependências

    Linguagem: Node.js

    Bibliotecas Recomendadas: axios (requisições HTTP), node-cron (agendamento), dotenv (variáveis de ambiente), fs/promises (manipulação de arquivos).

# 📂 Estrutura de Arquivos

    main.js: Ponto de entrada da aplicação e lógica principal.

    .env: Configurações sensíveis (URLs, chaves de API, datas).

    contatos.txt: Base de dados dos contatos (CSV format: nome,userId).

    msg_natal.txt: Modelo da mensagem de Natal.

    msg_ano_novo.txt: Modelo da mensagem de Ano Novo.

    *.lock: Arquivos gerados automaticamente para indicar conclusão do ciclo.

    logs_*.txt: Arquivos de log gerados automaticamente com timestamp do início da execução (formato: logs_YYYY-MM-DD_HH-MM-SS.txt). Contém todos os logs de execução com timestamp de cada operação.

# ⚙️ Configuração (.env)

Certifique-se de configurar as seguintes variáveis:

```Snippet de código

API_URL=http://localhost:3000/api/sendText
API_KEY=yoursecretkey
SESSION=default
DATA_NATAL=2025-12-25
DATA_ANO_NOVO=2026-01-01
```

# 🚀 Fluxo de Execução

1.  Verificação de Agendamento
    O script deve rodar um CronJob a cada 5 minutos que realiza as seguintes validações:

    Verifica se os arquivos natal_finished.lock e ano_novo_finished.lock já existem. Se ambos existirem, o processo faz um log de encerramento e finaliza a execução (process.exit()).

    Compara a data atual com DATA_NATAL e DATA_ANO_NOVO.

2.  Processamento de Contatos
    Ao atingir a data (e caso o .lock correspondente não exista):

    Lê o arquivo de mensagem equivalente.

    Lê a lista de contatos.txt.

    Para cada linha, extrai nome e userId.

    Substitui a variável $nome$ no texto pelo nome real do contato.

3.  Lógica de Envio e Tratamento de Erro
    O envio é feito via POST para a API. Caso ocorra um erro no envio:

    Fallback do 9º Dígito: O bot tentará uma segunda vez removendo o quinto dígito do userId (ex: de 5561986515221 para 556186515221).

    Logs: Cada etapa deve ser registrada no console (Início do envio, Sucesso, Erro e Tentativa de correção).

    Imporante, sempre que enviar uma mensagem, dê um timeout de 20 segundo antes da próxima excução.

4.  Finalização (Sistema de Lock)
    Após percorrer toda a lista de contatos com sucesso:

    Natal: Cria o arquivo natal_finished.lock.

    Ano Novo: Cria o arquivo ano_novo_finished.lock.

5.  Sistema de Logs
    Todos os logs da aplicação devem ser salvos em arquivo além de exibidos no console:

        Nome do arquivo: logs_[timestamp].txt (ex: logs_2025-12-24_15-30-45.txt)

        O timestamp é gerado no início da execução do script

        Cada linha do log contém o timestamp da operação: [YYYY-MM-DDTHH:mm:ss.sssZ] mensagem

        Timeout de 20 segundos entre cada envio de mensagem para evitar sobrecarga da API

    Fulano,5511999999999
    Sicrano,5511888888888

````

msg_natal.txt

```Plaintext

Olá $nome$, feliz Natal! Que seu dia seja repleto de alegria.
````

# 🛠️ Exemplo de Implementação da Requisição (Axios)

```JavaScript

const axios = require('axios');

async function sendMessage(userId, text) {
    const data = {
        session: process.env.SESSION,
        chatId: `${userId}@c.us`,
        text: text
    };

    const config = {
        headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': process.env.API_KEY
        }
    };

    try {
        await axios.post(process.env.API_URL, data, config);
        console.log(`✅ Sucesso: ${userId}`);
    } catch (error) {
        console.error(`❌ Erro no envio para ${userId}. Tentando correção de dígito...`);
        // Lógica de tentativa com remoção do dígito 9 aqui...
    }
}
```

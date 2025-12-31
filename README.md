# 🎄 Holiday Message Bot (Natal & Ano Novo)

Bot automatizado para envio de mensagens personalizadas de Natal e Ano Novo via WhatsApp utilizando a API WAHA.

## 📋 Pré-requisitos

### WAHA (WhatsApp HTTP API)
Este bot requer uma instância ativa do **WAHA** (WhatsApp HTTP API) para funcionar.

**O que é WAHA?**
WAHA é uma API HTTP que permite controlar o WhatsApp através de requisições HTTP. É necessário ter uma instância WAHA rodando antes de usar este bot.

**Como obter WAHA:**
- 🌐 Site oficial: [https://waha.devlike.pro](https://waha.devlike.pro)
- 📦 GitHub: [https://github.com/devlikeapro/waha](https://github.com/devlikeapro/waha)
- 🐳 Docker Hub: `devlikeapro/waha`

**Instalação rápida com Docker:**
```bash
docker run -it -p 3000:3000/tcp --name waha devlikeapro/waha
```

### Node.js
- Node.js versão 14 ou superior
- npm ou yarn

## 🚀 Instalação

1. Clone o repositório ou baixe os arquivos:
```bash
git clone <seu-repositorio>
cd endyear-bot
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

4. Edite o arquivo `.env` com suas configurações:
```env
WAHA_URL_API=https://sua-instancia-waha.com
WAHA_API_KEY=sua_chave_api
DATA_NATAL=2025-12-25 18:00
DATA_ANO_NOVO=2026-01-01 00:00
SESSION=default
CRON_TIME=*/5 * * * *
```

5. Configure seus contatos:
```bash
cp contatos.txt.example contatos.txt
```

Edite `contatos.txt` com seus contatos no formato:
```
Nome,5511999999999
```

6. Personalize as mensagens nos arquivos:
- `msg_natal.txt` - Mensagem de Natal
- `msg_ano_novo.txt` - Mensagem de Ano Novo

Use `$nome$` como variável para personalizar com o nome do contato.

## ▶️ Execução

Para iniciar o bot:
```bash
npm start
```

O bot ficará rodando em segundo plano e verificará automaticamente as datas programadas conforme o intervalo configurado em `CRON_TIME`.

### Configuração do Intervalo (CRON_TIME)

A variável `CRON_TIME` define a frequência de verificação usando formato cron:
- `*/5 * * * *` - A cada 5 minutos (padrão)
- `*/1 * * * *` - A cada 1 minuto
- `*/10 * * * *` - A cada 10 minutos
- `0 * * * *` - A cada hora

**Formato:** `minuto hora dia mês dia-da-semana`

## 🔧 Funcionalidades

- ✅ Envio automatizado de mensagens em datas específicas
- ✅ Personalização de mensagens com nome do destinatário
- ✅ Sistema de retry com correção automática do 9º dígito
- ✅ Controle de envios duplicados através de arquivos `.lock`
- ✅ Logs detalhados salvos em arquivo com timestamp
- ✅ Timeout de 20 segundos entre envios para não sobrecarregar a API
- ✅ Agendamento automático via CronJob

## 📂 Estrutura de Arquivos

```
endyear-bot/
├── main.js                    # Aplicação principal
├── package.json               # Dependências do projeto
├── .env                       # Configurações (não versionado)
├── .env.example              # Exemplo de configurações
├── contatos.txt              # Lista de contatos (não versionado)
├── contatos.txt.example      # Exemplo de contatos
├── msg_natal.txt             # Mensagem de Natal
├── msg_ano_novo.txt          # Mensagem de Ano Novo
├── manifest.md               # Especificações do projeto
├── natal_finished.lock       # Lock de envio do Natal (auto-gerado)
├── ano_novo_finished.lock    # Lock de envio do Ano Novo (auto-gerado)
└── logs_*.txt                # Arquivos de log (auto-gerados)
```

## 📝 Formato dos Dados

### contatos.txt
```
Fulano,5511999999999
Sicrano,5511888888888
Beltrano,5521987654321
```

### msg_natal.txt
```
Olá $nome$, feliz Natal! 🎄
Que seu dia seja repleto de alegria e paz.
```

### msg_ano_novo.txt
```
Oiii, $nome$. Feliz Ano Novo! 🥳🍾
Que 2026 seja incrível para você!
```

## 🔐 Segurança

- Nunca compartilhe seu arquivo `.env`
- Mantenha sua `WAHA_API_KEY` em segredo
- Não versione arquivos com dados sensíveis (`.env`, `contatos.txt`, `*.lock`, `logs_*.txt`)

## 🛠️ Tecnologias Utilizadas

- **Node.js** - Runtime JavaScript
- **axios** - Cliente HTTP para requisições
- **node-cron** - Agendamento de tarefas
- **dotenv** - Gerenciamento de variáveis de ambiente

## 📊 Sistema de Logs

Todos os logs são salvos em arquivos com formato:
```
logs_2025-12-24_15-30-45.txt
```

Cada linha do log contém:
```
[2025-12-24T15:30:45.123Z] Mensagem do log
```

## ❓ Solução de Problemas

### Erro de conexão com WAHA
- Verifique se sua instância WAHA está rodando
- Confirme se a URL e API Key estão corretas no `.env`

### Mensagens não estão sendo enviadas
- Verifique os logs em `logs_*.txt`
- Confirme se as datas no `.env` estão corretas
- Verifique se os arquivos `.lock` não foram criados ainda

### Remover arquivos lock para reenviar
```bash
rm *.lock
```

## 📄 Licença

Este projeto é de código aberto e está disponível para uso pessoal.

## 🤝 Contribuições

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou pull requests.

---

Desenvolvido com ❤️ para automatizar mensagens de fim de ano

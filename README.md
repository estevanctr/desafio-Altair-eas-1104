# Desafio JusCash

Monorepo contendo a API ([api/](api/)) e o front-end web ([web/](web/)).

Ambos os projetos podem acessados pela internet através do dos links:

### Website:

- https://desafio-altair-eas-1104-1.onrender.com

### API:

- https://desafio-altair-eas-1104.onrender.com/docs

### Observação:

Como ambos os serviços foram submetidos na camada gratuita do Render ambos ficam em estado de standby após um tempo sem uso. Para garantir um tempo de resposta bom do sistema online abra ambos os links acima (web e api) e caso a tela de inicialização do Render apareça aguarde o carregamento das aplicações. Devido a esta mesma questão do plano gratuito a CRON Job que carrega os dados da api externa pode não funcionar no horario agendado pela api estar em StandBy, para validar a CRON Job em tempo real acesse a observação 3 abaixo para testar localmente de forma facilitada.

Apesar deste README principal estar escrito em PT-BR para fins de apresentação inicial, os demais
READMEs internos estão escritos em inglês, para fins de manter a padronização e consistência do projeto, bem como também otimizar a leitura de contexto por ferramentas da IA.

Este projeto foi desenvolvido com uso continuo de ferramentas de IA, principalmente Claude Code e
Groq (usado como motor de resumo de IA para os processos judiciais). Dentro de ambos os projetos
há skills do Claude que foram usadas como base para o desenvolvimento guiado por IA, a api principalmente
possui aruqivos .md dentro de cada um dos módulos de forma a facilitar futuras alterações e melhorias.

### Observação 2:

Este projeto possui um cron que executa periodicamente 1:00 o processo de atualização de comunicações puxando dados da api externa de processos
repassada neste desafio. Como o numero de comunicações diarias, inclusive por tribunal, é gigantesca, para fins de obter um cenário mais reduzido para o desafio a atualização (bem como filtros do sistema) estão
considerando apenas três orgões diferentes de diferentes tribunais:

{
siglaTribunal: 'TRT10',
orgaoId: 46612,
label: '18ª Vara do Trabalho de Brasília - DF',
},
{
siglaTribunal: 'TJTO',
orgaoId: 95263,
label: 'Central de Expedição de Precatório e RPVs',
},
{
siglaTribunal: 'TJRS',
orgaoId: 38458,
label: '1ª Vara Judicial da Comarca de São Lourenço do Sul',
},

A decisão foi tomada também levando em conta as limitações do ambiente
gratuito que foi usado para deploy e que possui recursos computacionais
limitados.

### Observação 3:

Caso queira simular a CRON sem precisar esperar o horário de 1:00 ajuste o arquivo api/src/modules/update-processes-scheduler/jobs/update-processes.job.ts, linha 23. Altere o valor do time para "_/30 _ \* \* \* \*" e no arquivo api/src/modules/update-processes-scheduler/use-cases/update-processes-usecase.ts e altere a linha 19 para uma data passada qualquer, por exemplo "2025-04-13". Isso fara com que o job rode a cada
30 segundos. Faça esse ajuste no codigo antes de levantar os containers.

## Pré-requisitos

- Docker e Docker Compose
- Api key da groq

## Configuração

Copie o arquivo de exemplo de variáveis de ambiente e ajuste os valores conforme necessário:

```bash
cp .env.example .env
```

Por conveniência, o arquivo `.env` ja veio com diversas chaves já definidas, porém por motivos de segurança a minha chave da api da
groq (serviço que proviciona o modelo de IA para resumos) não foi
comportilhada. Porém uma chave de api pode ser obtida após cadastro [aqui](https://groq.com/). Ao obter chave baste copiar e colar no arquivo `.env` no campo correspondente.

## Executando os projetos

A partir da raiz do repositório, execute:

```bash
docker compose up --build
```

Isso inicia três serviços: `postgres`, `api` e `web`. As portas expostas são definidas no `.env`.

## Executando as migrations e seeds da API

Com os containers em execução, primeiro aplique as migrations do banco de dados e depois execute os seeds dentro do container da API:

```bash
docker compose exec api npx prisma migrate deploy
docker compose exec api npx prisma db seed
```

## Arquitetura

Para mais detalhes sobre a arquitetura de cada projeto, veja os READMEs individuais:

- [api/README.md](api/README.md)
- [web/README.md](web/README.md)

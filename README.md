# Desafio JusCash

Monorepo contendo a API ([api/](api/)) e o front-end web ([web/](web/)).

Ambos os projetos podem acessados pela internet através do dos links:

### Website:

- https://desafio-altair-eas-1104-1.onrender.com

### API:

- https://desafio-altair-eas-1104.onrender.com/docs

### Observação:

Como ambos os serviços foram submetidos na camada gratuita do Render, pode ser que num primeiro momento a utilização do site (login, cadastro, etc.) se apresente lenta por alguns segundos, o que vai ocorrer pelo fato de a api ficar em standby em periodos de inatividade. Após 50 segundos de inicialização os servicos responderão normalmente.

Apesar deste README principal estar escrito em PT-BR para fins de apresentação inicial, os demais
READMEs internos estão escritos em inglês, para fins de manter a padronização e consistência do projeto, bem como também otimizar a leitura de contexto por ferramentas da IA.

Este projeto foi desenvolvido com uso continuo de ferramentas de IA, principalmente Claude Code e
Groq (usado como motor de resumo de IA para os processos judiciais). Dentro de ambos os projetos
há skills do Claude que foram usadas como base para o desenvolvimento guiado por IA, a api principalmente
possui aruqivos .md dentro de cada um dos módulos de forma a facilitar futuras alterações e melhorias.

## Pré-requisitos

- Docker e Docker Compose

## Configuração

Copie o arquivo de exemplo de variáveis de ambiente e ajuste os valores conforme necessário:

```bash
cp .env.example .env
```

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

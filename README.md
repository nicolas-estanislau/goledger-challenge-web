# GoLedger ScreenVault

Interface web em Next.js para gerenciar `tvShows`, `seasons`, `episodes` e `watchlist` usando a API blockchain do desafio GoLedger.

## O que foi implementado

- Dashboard com busca global e métricas do catálogo
- CRUD de TV Shows, Seasons, Episodes e Watchlists
- Proxy server-side no Next.js para manter o Basic Auth fora do client
- UI responsiva com visual editorial/cinematográfico

## Tecnologias

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4

## Configuração

1. Instale as dependências:

```bash
npm install
```

2. Crie `.env` a partir do exemplo:

```bash
cp .env.example .env
```

3. Preencha as credenciais do desafio:

```env
GOLEDGER_API_BASE_URL=http://ec2-50-19-36-138.compute-1.amazonaws.com
GOLEDGER_API_USERNAME=seu_usuario
GOLEDGER_API_PASSWORD=sua_senha
```

## Executar localmente

```bash
npm run dev
```

Abra `http://localhost:3000`.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Observações

- Todas as chamadas autenticadas passam pelas rotas server-side em `app/api`.
- Campos de chave primária blockchain ficam bloqueados no modo de edição para evitar quebrar a identidade do asset e suas referências.

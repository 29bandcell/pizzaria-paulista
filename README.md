# Paulista Pizzaria - Sistema de Pedidos

## Links locais

- Link publico: `publico.html`
- Balcao e mesas: `atendimento.html`
- Area da empresa: `empresa.html`
- Link proprietario: `proprietario.html`

Senha do proprietario: `Paulista@2026`

## Horario do link publico

- Terca e quinta: 15:00 as 21:50
- Sexta, sabado e domingo: 15:00 as 22:50

Fora desses horarios, o link publico mostra uma tarja vermelha e nao finaliza pedidos online.

## Teste por navegador

Com o servidor local ligado, abra:

- `http://127.0.0.1:8765/publico.html`
- `http://127.0.0.1:8765/atendimento.html`
- `http://127.0.0.1:8765/empresa.html`
- `http://127.0.0.1:8765/proprietario.html`

## Publicacao

Esta versao esta preparada para Netlify + Supabase.

## Supabase

1. Crie um projeto no Supabase.
2. Abra o SQL Editor.
3. Rode o arquivo `supabase-schema.sql`.
4. Copie a `Project URL` e a chave `anon public`.

Este projeto usa tabelas isoladas:

- `paulista_products`
- `paulista_orders`

Nao use as tabelas genericas `products` e `orders`, pois elas podem pertencer a outros projetos no mesmo Supabase.

## Netlify

No Netlify, configure as variaveis de ambiente:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

Depois publique esta pasta `paulista-pedidos`.

O app busca essas variaveis por `/api/config`, conecta no Supabase e passa a salvar cardapio e pedidos no banco. Se estiver rodando localmente sem Supabase, ele continua funcionando com `localStorage`.

Observacao: as politicas do SQL estao abertas para permitir pedidos pelo link publico e gerenciamento sem login real. Para uma versao mais segura, o ideal e colocar login na area da empresa/proprietario e restringir edicao de cardapio/caixa.

# Buscador de Imovel BH

Aplicacao web estatica para apoiar a busca de apartamentos para venda ou aluguel em Belo Horizonte, priorizando imoveis em ate 3,5 km da Av. Brasil, 1666 (CMU).

## O que faz

- Coleta conservadora de anuncios publicos, respeitando `robots.txt`.
- Normalizacao de aluguel, condominio, IPTU, seguro, valor de venda, area, vagas, bairro, distancia e link.
- Ranking por custo-beneficio: raio, duas vagas, novo/reformado, preco, distancia e completude.
- Filtros por operacao, vagas, raio, reforma, busca livre e bairros preferidos.
- Simulador educativo SAC/Price com entrada, FGTS, prazo, juros, renda, seguros e taxa administrativa.
- Publicacao via GitHub Pages.

## Limites importantes

O scraper nao faz login, nao resolve CAPTCHA, nao mascara bloqueios e nao contorna restricoes. Portais podem mudar HTML, bloquear busca automatizada ou esconder telefone/ID do anuncio. Quando contato ou numero nao aparecem no HTML publico, o app mostra `Contato no link` ou `ID nao visivel`.

O simulador e educativo e nao substitui proposta oficial de banco. Taxas, seguros, avaliacao do imovel, CET, renda aprovada e regras de FGTS dependem da instituicao financeira.

## Comandos

```bash
npm install
npm run dev
npm run scrape:dry
npm run scrape
npm run lint
npm run typecheck
npm test
npm run build
npx playwright test
```

## Dados

O app carrega `public/data/listings.json`. O formato principal e:

- `generatedAt`: data da coleta.
- `center`: endereco e coordenada central.
- `reports`: resultado por portal e URL.
- `listings`: anuncios normalizados.

Cada anuncio inclui `source`, `sourceListingId`, `url`, `transaction`, `neighborhood`, `distanceKm`, `parkingSpaces`, `costs`, `images`, `warnings` e demais campos do modelo `Listing`.

## Adicionar ou ajustar portais

1. Edite `scripts/scraper/sourceConfig.ts`.
2. Inclua URLs de busca publicas e permitidas.
3. Rode `npm run scrape:dry`.
4. Rode `npm run scrape -- --max-listings 5`.
5. Valide `public/data/listings.json` e a tela local.

## Publicacao

O workflow `.github/workflows/scrape-and-deploy.yml` executa manualmente ou diariamente:

1. instala dependencias;
2. instala Chromium do Playwright;
3. roda `npm run scrape`;
4. roda testes e build;
5. publica o site no GitHub Pages.

URL planejada: `https://israelflemos.github.io/Buscador-de-Imovel/`.

## Privacidade

O simulador nao salva renda, entrada, FGTS ou preferencias. Tudo fica em estado de tela e desaparece ao recarregar. Nao ha backend nem banco de dados no MVP.

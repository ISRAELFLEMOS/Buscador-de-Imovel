# Buscador de Imovel BH

Aplicacao web estatica para apoiar o teste inicial de busca de apartamentos para aluguel em Belo Horizonte, priorizando imoveis em ate 3,5 km da Av. Brasil, 1666 e com teto padrao de R$ 4.500 mensais.

## O que faz

- Coleta conservadora de anuncios publicos, respeitando `robots.txt`.
- Normalizacao de aluguel, condominio, IPTU, seguro, taxas, area, vagas, bairro, distancia e link.
- Custo mensal total usa o valor `total` informado pelo portal quando existir; quando nao existir, soma aluguel, condominio, IPTU, seguro e outros custos visiveis como estimativa.
- Para QuintoAndar, o scraper tenta abrir a pagina publica do anuncio permitido por `robots.txt` para enriquecer a composicao do custo mensal com condominio, IPTU, seguro incendio e taxa de servico.
- Ranking por custo-beneficio: bairros preferidos, aluguel mais baixo, raio, duas vagas, novo/reformado, distancia e completude.
- Filtros por aluguel maximo, vagas, raio, reforma, busca livre e bairros preferidos.
- Preferencias da Layza: Santa Teresa e Santa Efigenia como prioridade maxima; Savassi, Anchieta, Funcionarios e Sao Pedro como preferidos.
- Modo de venda e simulador educativo SAC/Price mantidos como apoio para uma etapa futura, sem ser o foco inicial.
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

Em `costs`, `monthlyTotalConfidence` indica a origem do total mensal: `confirmed` quando o portal exibiu o total, `estimated` quando o app somou os custos visiveis e `missing` quando faltaram dados.

## Adicionar ou ajustar portais

1. Edite `scripts/scraper/sourceConfig.ts` para fontes e `src/domain/config.ts` para bairros preferidos.
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

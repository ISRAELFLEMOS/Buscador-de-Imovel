# Buscador de Imovel BH

Aplicacao web estatica para apoiar o teste inicial de busca de apartamentos em Belo Horizonte, com foco padrao em aluguel, opcao de compra, raio de ate 3,9 km da Av. Brasil, 1666 e teto padrao de R$ 4.500 mensais para aluguel.

## O que faz

- Coleta conservadora de anuncios publicos, respeitando `robots.txt`.
- Zap Imoveis entrou como fonte preferida da Layza, com URLs de aluguel e venda por bairros; quando o portal bloquear alguma URL ou o `robots.txt`, o app registra no relatorio e nao tenta contornar.
- Normalizacao de aluguel, condominio, IPTU, seguro, taxas, area, vagas, bairro, distancia, imagens e link.
- Custo mensal total usa o valor `total` informado pelo portal quando existir; quando nao existir, soma aluguel, condominio, IPTU, seguro e outros custos visiveis como estimativa.
- Para QuintoAndar e Zap Imoveis, o scraper tenta abrir a pagina publica do anuncio permitido por `robots.txt` para enriquecer a composicao do custo mensal com condominio, IPTU, seguro incendio e taxa de servico.
- A interface mostra ate 3 miniaturas extras quando o portal expoe mais imagens publicamente.
- Ranking por custo-beneficio: bairros preferidos, aluguel mais baixo, raio, duas vagas, novo/reformado, distancia e completude.
- Filtros avancados por operacao, fonte, aluguel maximo, compra maxima, quartos, area, vagas, raio, reforma, total confirmado, busca livre e bairros preferidos.
- Ordenacao por melhor encaixe, menor preco, menor distancia, maior area e coleta mais recente.
- Interface em painel profissional, com metricas, filtros rapidos, relatorio de fontes recolhido e cards mais completos.
- Preferencias da Layza: Santa Teresa e Santa Efigenia como prioridade maxima; Floresta, Sagrada Familia, Savassi, Anchieta, Funcionarios e Sao Pedro como preferidos.
- Bairros na lista `SAFETY_ATTENTION_NEIGHBORHOODS` aparecem com alerta vermelho `Atencao seguranca`; a lista e editavel e deve ser revisada com dados oficiais antes de decisao final.
- Modo de venda voltou ao filtro `Operacao`, mantendo aluguel como visualizacao inicial.
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

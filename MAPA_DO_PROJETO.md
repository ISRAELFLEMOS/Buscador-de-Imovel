# Mapa do Projeto - Buscador de Imovel BH

Atualizado em: 2026-06-15

## Resumo executivo

- Pasta: `99_OUTROS/BUSCADOR_DE_IMOVEL`
- Tipo: app web estatico com scraper e simulador financeiro.
- Objetivo: buscar e priorizar apartamentos para venda ou aluguel em Belo Horizonte, ate 3,5 km da Av. Brasil, 1666.
- Publicacao planejada: GitHub Pages em `https://israelflemos.github.io/Buscador-de-Imovel/`.
- Controle Git: repositorio proprio dentro desta pasta.

## Fluxo operacional

1. `npm run scrape:dry` verifica `robots.txt` e URLs configuradas.
2. `npm run scrape` coleta paginas permitidas, sem login, CAPTCHA ou bypass.
3. O scraper gera `public/data/listings.json`.
4. O app Vite/React carrega o JSON e apresenta filtros, ranking, mapa radial e simulador.
5. GitHub Actions executa coleta diaria e publica via Pages.

## Estrutura

| Caminho | Funcao |
|---|---|
| `src/domain` | Tipos, ranking, filtros, geolocalizacao, custos e financiamento. |
| `src/components` | UI de lista, mapa e simulador. |
| `scripts/scraper` | Configuracao de portais, robots, parser e runner Playwright. |
| `public/data/listings.json` | Base publicada para a interface. |
| `tests` | Testes unitarios e E2E. |
| `.github/workflows` | Coleta e deploy para GitHub Pages. |
| `docs/email_layza.md` | Rascunho para envio do link a Layza apos confirmar destinatario. |

## Cuidados

- Nao salvar dados pessoais do simulador.
- Nao armazenar credenciais.
- Nao burlar bloqueios de portais.
- Tratar contato e numero do anuncio como campos opcionais quando nao forem publicamente visiveis.

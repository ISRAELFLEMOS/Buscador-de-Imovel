# Mapa do Projeto - Buscador de Imovel BH

Atualizado em: 2026-06-17

## Resumo executivo

- Pasta: `99_OUTROS/BUSCADOR_DE_IMOVEL`
- Tipo: app web estatico com scraper, ranking de aluguel, opcao de compra e simulador financeiro auxiliar.
- Objetivo: buscar e priorizar apartamentos em Belo Horizonte, com foco padrao em aluguel ate R$ 4.500 mensais, opcao de compra, raio de ate 3,9 km da Av. Brasil, 1666 e preferencia por Santa Teresa, Santa Efigenia, Floresta, Sagrada Familia, Savassi, Anchieta, Funcionarios e Sao Pedro.
- Publicacao: GitHub Pages em `https://israelflemos.github.io/Buscador-de-Imovel/`.
- Controle Git: repositorio proprio dentro desta pasta.

## Fluxo operacional

1. `npm run scrape:dry` verifica `robots.txt` e URLs configuradas.
2. `npm run scrape` coleta paginas permitidas, sem login, CAPTCHA ou bypass.
3. O scraper gera `public/data/listings.json`.
4. O app Vite/React carrega o JSON e apresenta filtros, ranking por bairro/aluguel, modo compra, mapa radial e simulador recolhido para etapa futura.
5. Para aluguel, o custo total exibido pelo portal tem prioridade; na ausencia dele, o app usa soma estimada de aluguel, condominio, IPTU, seguro e outros custos visiveis.
6. Para QuintoAndar e Zap Imoveis, quando permitido, o scraper abre o detalhe publico do anuncio para preencher condominio, IPTU, seguro incendio e taxa de servico.
7. Quando o portal expoe mais imagens publicas, o app mostra miniaturas extras no card.
8. Bairros na lista `SAFETY_ATTENTION_NEIGHBORHOODS` recebem alerta visual vermelho para validacao de seguranca.
9. Zap Imoveis fica configurado como fonte preferida; bloqueios de `robots.txt` ou rede sao registrados no relatorio sem tentativa de contorno.
10. GitHub Actions executa coleta diaria e publica via Pages.

## Estrutura

| Caminho | Funcao |
|---|---|
| `src/domain` | Tipos, ranking, filtros, geolocalizacao, custos de aluguel e financiamento auxiliar. |
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

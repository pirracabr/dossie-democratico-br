# ESPECIFICAÇÃO VISUAL: FANZINE PUNK & BRUTALISMO POLÍTICO

## 1. Princípios de Direção de Arte
- **Metáfora Central:** Panfleto mimeografado / fanzine fotocopiado com colagens, recortes e fita adesiva.
- **Leis de Estilo Anti-Template:**
  - `border-radius: 0px` (cantos estritamente vivos e retos; zero curvas suaves).
  - Sombras duras de alto contraste sem desfoque (ex: `box-shadow: 5px 5px 0px #000` ou `#ef4444`).
  - Linhas pretas grossas (bordas sólidas de 2px a 3px).
  - Elementos levemente inclinados via CSS (`transform: rotate(-1.5deg)` ou `rotate(1deg)`) simulando colagem desalinhada.
  - Títulos sempre em caixa alta (uppercase) com kerning fechado.

## 2. Tipografia
- **Títulos e Chamadas de Guerra:** 'Anton', 'Rubik Glitch' ou 'Bebas Neue' (Google Fonts). Impacto seco, sem serifa, verticalizada.
- **Códigos, Metadados e Datas:** 'Space Mono' ou 'Courier Prime'. Estética de máquina de escrever desgastada ou manifesto datilografado.
- **Corpo do Texto:** 'Inter' ou 'Public Sans' (peso 500 a 700), priorizando legibilidade nítida mesmo com fundos contrastantes.

## 3. Paleta Cromática de Alto Contraste (Cores Cruas)
- `--punk-black`: #0a0a0a (preto carvão de toner)
- `--punk-paper`: #f4f0ea (branco papel jornal / xerox desgastado)
- `--punk-blood`: #dc2626 (vermelho tinta de carimbo / serigrafia de protesto)
- `--punk-yellow`: #facc15 (amarelo marca-texto de fita isolante)
- `--punk-border`: #000000 (linhas pretas duras de corte)

## 4. Componentes Típicos de Fanzine
- **Fita Adesiva / Durex:** Um pseudo-elemento `::before` no topo de cards simulando uma fita adesiva fosca (`rgba(255,255,255,0.4)` ou amarela) segurando o papel.
- **Tarja de Censura / Destaque Invertido:** Textos críticos com fundo preto e letras brancas (`background: #000; color: #fff; padding: 2px 6px; display: inline-block;`).
- **Carimbos de Protesto:** Selos com borda tracejada ou dupla (`border: 3px dashed var(--punk-blood)`) em ângulo inclinado.
- **Tratamento de Imagens:** Fotos em alto contraste PB com efeito granulado/reticulado (estilo xerox / meio-tom).

## Diretriz Técnica
O Agente de UI deve priorizar a geração e inserção de SVGs inline para ícones, carimbos e marcadores visuais, evitando depender de bibliotecas externas pesadas (como FontAwesome). Fotos em formato raster (JPG/PNG) devem receber obrigatoriamente tratamento CSS com filtro de alto contraste e escala de cinza (filter: grayscale(100%) contrast(150%)) para simular impressão de fotocopiadora/fanzine.

# Especificação Formal: Regras de Negócio e Contratos de Fact-Checking

## 1. Visão Geral e Princípios (Spec-Driven Development)
Este documento estabelece as regras determinísticas, contratos formais de dados, critérios de aceitação e códigos de saída para a esteira automatizada de verificação de fatos e validação de fontes em sites estáticos JAMstack (`public/index.html`).

O validador segue o paradigma **Spec-Driven Development (SDD)**: qualquer comportamento do agente de verificação deve ser uma consequência estrita das especificações definidas nesta pasta `specs/`.

---

## 2. Seleção e Extração de Conteúdo do DOM

### 2.1 Elementos Sujeitos à Validação
O validador inspeciona o arquivo HTML apontado por `TARGET_HTML` (padrão: `public/index.html`).
Qualquer elemento que atenda a pelo menos um dos seletores abaixo é classificado como uma **Unidade Factual sob Checagem (Claim Card)**:
1. `.warn-card` (Cartões de advertência ou alertas críticos)
2. `.fact-card` (Cartões explicitamente designados como alegações factuais)
3. `.card[data-claim]` (Cartões genéricos anotados com atributo de alegação)
4. `.job-item[data-claim]` (Itens de histórico ou experiência contendo alegações verificáveis)

### 2.2 Requisitos Estruturais do Card
Cada elemento identificado deve conter obrigatoriamente:
- **Identificador Único (`id` ou `data-id`):** String alfanumérica única no documento. Se ausente, o validador gera um hash determinístico do conteúdo textual.
- **Texto da Alegação (`claim_text`):** O texto extraído do corpo do card (seletor `.claim-text`, `.description`, `p`, ou o texto direto do container, excluindo links de fonte).
- **Fontes Externas (`source_urls`):** Ao menos uma tag `<a>` com atributo `href` apontando para protocolo `http://` ou `https://` dentro do card (ou especificada via atributo `data-source-url`).

---

## 3. Regras Determinísticas de Negócio

### Regra R1: Obrigatoriedade de Fontes Externas Ativas
- **Condição:** Toda alegação factual DEVE possuir pelo menos 1 URL de fonte externa válida.
- **Critério de Falha:** Se um card não possuir links externos, ou se todos os links fornecidos falharem na resolução de rede (status HTTP >= 400 ou erro de conexão), a verificação FALHA imediatamente para aquele card.
- **Tratamento de Bots (HTTP 403/401 Cloudflare/Akamai):** Quando uma URL de domínio de alta reputação retornar 403/429 devido a proteções anti-bot, o validador registrará aviso de limitação de rede e executará verificação via cabeçalhos/DNS antes de desqualificar, evitando falso-positivos em fontes conhecidas.

### Regra R2: Segurança de Rede e Blindagem SSRF
- **Condição:** Toda URL informada no documento é submetida a um filtro rígido antes de qualquer requisição HTTP.
- **Critério de Falha:** URLs apontando para endereços de loopback, redes locais, metadata de nuvem (`169.254.169.254`), esquemas como `file://`, `ftp://`, `gopher://` ou portas não-web (diferentes de 80 e 443) provocam ABORTO imediato da esteira com erro crítico de segurança.

### Regra R3: Sustentação Semântica por IA (Semantic Entailment)
- **Condição:** O conteúdo da página externa raspada é submetido à análise de LLM junto com a alegação do card.
- **Decisão do LLM:** A resposta estruturada deve retornar booleano `verified` e score de `confidence` (0.00 a 1.00).
- **Critério de Aprovação:**
  - `verified == true`
  - `confidence >= 0.70`
- **Critério de Reprovação:**
  - Se a fonte contradizer explicitamente a alegação: `verified == false`.
  - Se a fonte não contiver informações suficientes para corroborar a alegação: `verified == false`.
  - Se `confidence < 0.70`: Considerado não verificado (inconclusivo).

### Regra R4: Decisão da Esteira de CI/CD (Merge Gate)
- O Pull Request só pode receber aprovação (`PASS` - exit code 0) se:
  1. 100% dos cards elegíveis foram processados sem erro estrutural.
  2. 0 links foram classificados como definitivamente quebrados (`broken_links.length === 0`).
  3. Todas as alegações obtiveram `verified: true` com confiança mínima de 0.70.
- Havendo qualquer reprovação, a esteira encerra com exit code 1 e publica a justificativa detalhada no Step Summary do GitHub Actions.

---

## 4. Tabela de Códigos de Saída (Exit Codes)

| Código | Nome | Descrição |
|---|---|---|
| **0** | `SUCCESS` | Todas as alegações e fontes foram verificadas e aprovadas com sucesso. |
| **1** | `VERIFICATION_FAILED` | Uma ou mais alegações foram refutadas, inconclusivas ou possuem links quebrados. |
| **2** | `SCHEMA_ERROR` | Estrutura inválida no HTML (card sem claim, ID duplicado ou ausência de campos). |
| **3** | `SECURITY_VIOLATION` | Tentativa de SSRF, payload malicioso detectado em URL ou violação de política. |
| **4** | `CONFIGURATION_ERROR` | Arquivo HTML alvo não encontrado, specs ausentes ou variável de ambiente crítica faltante. |

---

## 5. Formato de Logs e Relatório Final
Ao final da execução, o script deve emitir no `stdout` um sumário legível e, opcionalmente, salvar um artefato JSON em `dist/verification-report.json` conforme o schema `specs/agent-output-schema.json`.

# 14 Sinais de Alerta do Fascismo | Dossiê Cívico & Pipeline de Validação Factual

> **Alerta cívico sério exige prova séria e apuração documental rigorosa.**

Este projeto combina um **portal estático de conscientização cívica e democrática** com um **pipeline agêntico automatizado de fact-checking e segurança da informação (Spec-Driven)** em GitHub Actions.

---

## 🎯 1. Objetivo Cívico, de Alerta e Informativo

A democracia não se desfaz de uma só vez; ela se desgasta por meio da normalização gradual do autoritarismo, da violação de garantias individuais, do ataque a instituições e da disseminação de desinformação.

Em 2003, o pesquisador **Laurence W. Britt** publicou o clássico estudo que identificou **14 sinais comuns aos regimes autoritários e totalitários da história** (Itália, Alemanha, Espanha franquista, Indonésia e outros). 

Este repositório tem como missão principal:
- **Alerta Democrático:** Servir como instrumento cívico de reflexão, vigilância e defesa do Estado Democrático de Direito no Brasil.
- **Transparência e Rigor Epistêmico:** Não se trata de ataques partidários desprovidos de lastro, mas de documentar ocorrências contemporâneas comprovadas por **fontes primárias, decisões judiciais, dados estatísticos oficiais e jornalismo investigativo profissional**.
- **Cultura de Verificação Autônoma:** Disponibilizar links diretos e referências para que qualquer cidadão possa ler a matéria original, o inquérito ou o acórdão, formulando suas próprias conclusões com base em evidências verificáveis.
- **Ressalvas Jurídicas e Presunção de Inocência:** Diferenciar rigorosamente inquéritos preliminares, denúncias ministeriais e processos em andamento de decisões penais condenatórias transitadas em julgado, assegurando a presunção de inocência e o direito de resposta das defesas citadas.

---

## 🏛️ 2. Arquitetura Multi-Agente (Spec-Driven Development)

Para garantir integridade editorial e segurança técnica contra inserções arbitrárias, o pipeline segue estritamente o paradigma **Spec-Driven**: nenhuma afirmação entra em produção sem conformidade com a especificação e validação semântica.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ARQUITETURA MULTI-AGENTE                        │
└────────────────────────────────────────────────────────────────────────┘
          │
          ├── [1] AGENTE DE ESPECIFICAÇÃO (Spec Engineer)
          │       Define contratos JSON, regras determinísticas e seletores do DOM.
          │       Arquivos: specs/rules.md, specs/content-schema.json
          │
          ├── [2] AGENTE DE SEGURANÇA & COMPLIANCE (SecOps / AppSec)
          │       Audita SSRF, Indirect Prompt Injection, limites DoS e Least Privilege.
          │       Arquivo: specs/security-guidelines.md
          │
          ├── [3] AGENTE DE IA & PARSER (Core Developer)
          │       Extração multi-parágrafo do DOM, fetch seguro e checagem semântica.
          │       Módulos: scripts/lib/*, scripts/verify-content.mjs
          │
          └── [4] AGENTE DE CI/CD & AUTOMAÇÃO (DevOps / QA)
                  Orquestração do GitHub Actions, step summaries e mocks offline.
                  Arquivos: .github/workflows/verify-sources.yml, scripts/test-validator.mjs
```

1. **Agente 1: Especificação (Spec Engineer):** Governança por schemas rígidos (`content-schema.json`, `agent-output-schema.json`).
2. **Agente 2: Segurança & SecOps (AppSec):** Blindagem contra SSRF, validação de endereços IP privados, neutralização de injeção indireta em fontes e aplicação de menor privilégio.
3. **Agente 3: Engenharia de IA & Parser (Core Developer):** Parser baseado em Cheerio com concatenação de alegações, crawler seguro e heurística de decisão semântica.
4. **Agente 4: CI/CD & Automação (DevOps/QA):** Pipeline GitHub Actions com relatórios em markdown e suíte de 20 testes unitários determinísticos.

---

## 🧱 3. Estrutura do Site (`public/index.html`)

O site estático foi projetado em **duas camadas integradas** para proporcionar leitura fluida e acessibilidade aos dados comprobatórios:

```
┌──────────────────────────────────────────────────────────────────┐
│  CAMADA 1: VITRINE DOS 14 SINAIS EM DESTAQUE (#sinais-alerta)    │
│  - 14 cards rápidos com gravidade, resumo cívico e botão âncora  │
│  - Aponta via href="#dossie-alerta-XX" para a evidência abaixo   │
└─────────────────────────────────┬────────────────────────────────┘
                                  │ (Salto com âncora suave)
                                  ▼
┌──────────────────────────────────────────────────────────────────┐
│  CAMADA 2: DOSSIÊ E APURAÇÃO FACTUAL (#dossie-evidencias)        │
│  - 14 evidence-cards auditados pelo pipeline agêntico            │
│  - Cada alegação dividida por reportagem/estudo com ressalva     │
│  - Caixa de fontes externas e link de retorno ao sinal no topo   │
└──────────────────────────────────────────────────────────────────┘
```

### 3.1 Anatomia Canônica de um Cartão de Evidência (`evidence-card`)

Para que um cartão seja aprovado pelo validador e mantenha conformidade jurídica, ele deve seguir a estrutura canônica baseada no **Dossiê #02**:

```html
<!-- Exemplo Canônico de Evidência Auditável -->
<article class="evidence-card card warn-card" data-claim="true" id="dossie-alerta-02">
  <!-- 1. Cabeçalho com identificador e título -->
  <div class="evidence-header">
    <span class="evidence-badge">Dossiê #02</span>
    <h3>Desdém pelos Direitos Humanos</h3>
  </div>

  <!-- 2. Parágrafos de alegações factuais (cada fato atribuído à sua fonte) -->
  <p class="claim-text">
    Reportagem do UOL publicada em setembro de 2022 identificou que Flávio Bolsonaro e Carlos Bolsonaro
    solicitaram homenagens a pelo menos 16 policiais denunciados pelo Ministério Público do Rio de Janeiro por
    suposta participação em organizações criminosas. A apuração cruzou os nomes dos homenageados com informações
    dos tribunais. As denúncias e os processos citados devem ser distinguidos de condenações judiciais.
  </p>
  <p class="claim-text">
    Reportagem do Congresso em Foco publicada em novembro de 2017 relembra postagem de Carlos Bolsonaro nas
    redes sociais com a frase: "Direitos humanos: esterco da vagabundagem".
  </p>
  <p class="claim-text">
    A VEJA traz reportagem onde consta depoimento publicado em novembro de 2017, Jair Bolsonaro manifestou seu
    apoio a violência policial e armamento da população civil.
  </p>

  <!-- 3. Caixa de fontes com links externos seguros -->
  <div class="sources-box">
    <strong>Fontes e Documentos Comprobatórios:</strong>
    <div class="sources-list-links">
      <a class="source-link-item source-link" href="https://www.ohchr.org/en/what-are-human-rights"
        target="_blank" rel="noopener noreferrer">
        🔗 ONU / Alto Comissariado de Direitos Humanos | Princípios e garantias fundamentais
      </a>
      <a class="source-link-item source-link"
        href="https://noticias.uol.com.br/colunas/juliana-dal-piva/2022/09/23/cla-bolsonaro-condecorou-16-pms-denunciados-em-organizacoes-criminosas.htm"
        target="_blank" rel="noopener noreferrer">
        🔗 UOL Notícias | Discursos contra direitos humanos e homenagem a torturador
      </a>
      <a class="source-link-item source-link"
        href="https://www.congressoemfoco.com.br/noticia/29040/direitos-humanos-e-%e2%80%9cesterco-da-vagabundagem%e2%80%9d-diz-bolsonaro"
        target="_blank" rel="noopener noreferrer">
        🔗 Congresso em Foco | “Direitos humanos: esterco da vagabundagem”
      </a>
      <a class="source-link-item source-link"
        href="https://veja.abril.com.br/politica/bolsonaro-policial-que-nao-mata-nao-e-policial/"
        target="_blank" rel="noopener noreferrer">
        🔗 VEJA | “Policial que não mata não é policial”
      </a>
    </div>
  </div>

  <!-- 4. Navegação reversa para o sinal resumido no topo -->
  <div class="card-footer-nav">
    <a class="back-to-alert" href="#alerta-02">&uarr; Voltar ao Sinal #02 em Destaque</a>
  </div>
</article>
```

### 3.2 Regras Estruturais Obrigatórias (`specs/content-schema.json`)
1. **Identificador Único (`id`):** Obrigatório no formato `^[a-zA-Z0-9_-]+$` (ex: `dossie-alerta-01` a `dossie-alerta-14`).
2. **Alegações Múltiplas (`claim_text`):** Cada parágrafo `.claim-text` deve conter no mínimo 10 caracteres legíveis. O parser concatena todos os parágrafos para auditoria completa.
3. **Atribuição no Texto:** É mandatório citar formalmente o órgão, veículo de imprensa ou documento no início de cada alegação (*"Reportagem da Folha...", "Inquérito da PF apurado pelo G1...", "Estudo publicado na revista SciELO..."*).
4. **Salvaguarda de Presunção de Inocência:** Todo fato referente a inquérito policial ou denúncia deve conter menção explícita de distinção frente a sentenças condenatórias transitadas em julgado e citar a posição das defesas.
5. **Fontes Externas Válidas:** Pelo menos uma URL pública e ativa com protocolo `http://` ou `https://` dentro da tag `a.source-link`.

---

## 🔍 4. Como Funcionam as Verificações da Esteira

O validador automatizado ([scripts/verify-content.mjs](scripts/verify-content.mjs)) executa 5 etapas em sequência para autorizar ou barrar o merge:

```
[HTML] ──▶ (1) DOM Parser ──▶ (2) Anti-SSRF DNS ──▶ (3) Fetch Seguro ──▶ (4) Auditoria IA ──▶ (5) Exit Code
```

### Etapa 1: Extração e Validação Estrutural do DOM
- O módulo [scripts/lib/dom-parser.mjs](scripts/lib/dom-parser.mjs) carrega o arquivo alvo (`public/index.html`) via Cheerio.
- Localiza todos os cartões que satisfazem `.warn-card`, `.fact-card`, `.card[data-claim]` ou `.job-item[data-claim]`.
- Concatena todos os elementos `<p class="claim-text">` do cartão e coleta as URLs declaradas em `<a class="source-link">`.
- Se houver IDs duplicados, cartões sem texto de alegação ou cartões sem fontes, o processo aborta com **Exit Code 2 (SCHEMA_ERROR)**.

### Etapa 2: Segurança de Rede e Blindagem Anti-SSRF
- O módulo [scripts/lib/ssrf-filter.mjs](scripts/lib/ssrf-filter.mjs) inspeciona cada URL antes de qualquer conexão:
  - **Esquemas permitidos:** Apenas `http:` e `https:`. Protocolos como `file:`, `ftp:`, `gopher:` e `data:` são rejeitados de imediato.
  - **Portas permitidas:** Apenas as portas padrão `80` e `443`.
  - **Resolução DNS Ativa:** O endereço IP de destino é resolvido antes do fetch. Caso resolva para qualquer faixa de rede privada (RFC 1918), loopback (`127.0.0.1`), endereços locais ou **metadados de nuvem (`169.254.169.254`)**, a requisição é cancelada e dispara **Exit Code 3 (SECURITY_VIOLATION)**.
  - **Inspeção Hop-a-Hop:** Redirecionamentos HTTP passam pela mesma filtragem antes de cada salto.

### Etapa 3: Raspagem Resiliente e Limpeza de Conteúdo
- O módulo [scripts/lib/network-fetcher.mjs](scripts/lib/network-fetcher.mjs) efetua o download do conteúdo:
  - Timeout de 6 segundos via `AbortController` e limite de 2MB por requisição.
  - Remoção estrita de scripts, estilos, iframes, menus, cabeçalhos de navegação e barras laterais.
  - **Tratamento Anti-Bot WAF:** Portais jornalísticos com proteção WAF (ex: Cloudflare 403) são validados via integridade de DNS para evitar falsos-positivos de indisponibilidade.

### Etapa 4: Auditoria Semântica com IA / Heurística
- O módulo [scripts/lib/llm-checker.mjs](scripts/lib/llm-checker.mjs) cruza o texto da alegação com o texto extraído da fonte:
  - **Blindagem contra Prompt Injection:** O conteúdo raspado é isolado dentro de tags XML inertes (`<untrusted_scraped_source>`) e o prompt do sistema instrui a IA a desconsiderar instruções embutidas no texto externo.
  - **Regra Estrita de Refutação:** A IA só classifica um fato como refutado caso a reportagem afirme expressamente que a informação é mentira, falsa ou boato.
  - **Regra de Cobertura Parcial:** Se a fonte cobrir o núcleo factual sem contradições, o cartão é aprovado com nota explicativa de cobertura parcial.

### Etapa 5: Veredito e Códigos de Saída (Exit Codes)
| Código | Nome | Significado | Ação no CI/CD |
|---|---|---|---|
| **0** | `SUCCESS` | Todas as alegações foram confirmadas e não há links quebrados | **Merge Autorizado** ✅ |
| **1** | `VERIFICATION_FAILED` | Uma ou mais alegações refutadas, inconclusivas ou com link quebrado | **Merge Bloqueado** ❌ |
| **2** | `SCHEMA_ERROR` | Estrutura inválida no HTML (card sem claim, ID duplicado ou sem fonte) | **Merge Bloqueado** ❌ |
| **3** | `SECURITY_VIOLATION` | Tentativa de SSRF, acesso a IP privado ou esquema perigoso | **Merge Bloqueado** 🚨 |
| **4** | `CONFIGURATION_ERROR` | Arquivo `public/index.html` ou especificações não encontrados | **Falha no Job** 💥 |

---

## 🤝 5. Guia de Contribuição (Contributing Guidelines)

Contribuições são fundamentais para manter este dossiê atualizado com novas decisões judiciais, dados consolidados e matérias de apuração.

### 5.1 Critérios Editoriais e Jurídicos Obrigatórios
Para que uma contribuição seja aceita, as fontes e os textos devem respeitar os seguintes parâmetros:
1. **Fontes de Alta Credibilidade:**
   - Veículos com redação jornalística profissional e conselho editorial conhecido.
   - Órgãos e bases públicas oficiais: Diário Oficial da União, Supremo Tribunal Federal (STF), Tribunal Superior Eleitoral (TSE), relatórios da Polícia Federal e comissões parlamentares de inquérito (CPI).
   - Periódicos e plataformas científicas com revisão por pares (ex: SciELO, repositórios universitários federais).
   - **Não são aceitos:** Postagens soltas em redes sociais, prints sem verificação, blogs anônimos ou canais de desinformação.
2. **Imparcialidade e Presunção de Inocência:**
   - Descreva os fatos com precisão e sobriedade, evitando adjetivos injuriosos ou acusações genéricas.
   - Se o fato decorrer de inquérito ou denúncia do Ministério Público, explicite que se trata de investigação em curso e mencione o posicionamento da defesa do citado.
3. **Conformidade com o DOM:**
   - Mantenha a estrutura HTML estrita descrita na Seção 3.1.
   - Utilize a classe `source-link` e atributos de acessibilidade nos links externos (`target="_blank"` e `rel="noopener noreferrer"`).

### 5.2 Passo a Passo para Contribuir via Pull Request
1. Faça um Fork do repositório e clone em sua máquina:
   ```bash
   git clone https://github.com/<seu-usuario>/cv.git
   cd cv
   npm install
   ```
2. Crie uma branch específica para sua contribuição:
   ```bash
   git checkout -b feature/atualizar-dossie-xx
   ```
3. Edite o arquivo [public/index.html](public/index.html) inserindo ou atualizando a evidência factual e a respectiva fonte.
4. Execute os testes locais determinísticos e o validador:
   ```bash
   # Rodar suíte de testes unitários (20 testes)
   npm test

   # Rodar o validador de conteúdo em modo mock
   # Linux / macOS:
   MOCK_LLM=true npm run verify
   # Windows (PowerShell):
   $env:MOCK_LLM="true"; npm run verify
   ```
5. Certifique-se de que a esteira retorne **Exit Code 0 (STATUS FINAL: MERGE AUTORIZADO)**.
6. Faça commit com mensagem clara (ex: `feat: atualizar desfecho processual no dossie-alerta-07`) e abra o Pull Request no GitHub.

---

## 🛠️ 6. Como Rodar e Testar Localmente

### Pré-requisitos
- **Node.js**: v20.x ou v22.x LTS
- **npm**: v10.x ou superior

### Comandos Rápidos
```bash
# 1. Instalar dependências
npm install

# 2. Executar a suíte de 20 testes unitários, segurança (SSRF) e DOM
npm test

# 3. Executar o validador do index.html (Modo Mock Offline - Sem Custo de API)
# PowerShell (Windows):
$env:MOCK_LLM="true"; npm run verify
# Bash (Linux/macOS):
MOCK_LLM=true npm run verify

# 4. Executar com provedor de IA real (OpenAI / Gemini / OpenRouter)
export LLM_API_KEY="sua-chave-aqui"
export LLM_MODEL="gpt-4o-mini"
npm run verify
```

---

## 📁 7. Estrutura do Repositório

```
cv/
├── .github/
│   └── workflows/
│       └── verify-sources.yml      # Pipeline CI/CD em GitHub Actions
├── dist/
│   └── verification-report.json    # Relatório detalhado gerado pela validação
├── public/
│   ├── index.html                  # Aplicação principal (14 sinais + dossiê)
│   └── assets/                     # Folhas de estilo, ícones e fontes
├── scripts/
│   ├── lib/
│   │   ├── dom-parser.mjs          # Parser Cheerio com extração multi-parágrafo
│   │   ├── llm-checker.mjs         # Avaliador semântico e blindagem de prompt
│   │   ├── network-fetcher.mjs     # Crawler HTTP resiliente com bypass WAF
│   │   └── ssrf-filter.mjs         # Filtro anti-SSRF com resolução DNS
│   ├── verify-content.mjs          # CLI executável de validação de PR
│   └── test-validator.mjs          # Suíte de testes (20 testes unitários)
├── specs/
│   ├── rules.md                    # Especificação do pipeline em linguagem natural
│   ├── content-schema.json         # Contrato JSON do DOM do index.html
│   ├── agent-output-schema.json    # Contrato JSON da resposta do LLM
│   └── security-guidelines.md      # Matriz de segurança e defesas de rede
├── package.json                    # Dependências e scripts npm
└── README.md                       # Este documento
```

---

## ⚖️ Licença e Uso Cívico

Este projeto é disponibilizado sob a licença [MIT](https://opensource.org/licenses/MIT). O conteúdo é de interesse público e voltado à educação cívica, pesquisa e vigilância democrática.

#!/usr/bin/env node

/**
 * Script Principal: Validador Agêntico de Conteúdo e Fact-Checking (Spec-Driven)
 * Executado localmente ou dentro de GitHub Actions em Pull Requests.
 */

import fs from 'node:fs';
import path from 'node:path';
import { extractClaimCards, loadContentSchema } from './lib/dom-parser.mjs';
import { safeFetchSource } from './lib/network-fetcher.mjs';
import { evaluateClaimWithSources } from './lib/llm-checker.mjs';

// Exit codes formais conforme specs/rules.md
const EXIT_CODES = {
  SUCCESS: 0,
  VERIFICATION_FAILED: 1,
  SCHEMA_ERROR: 2,
  SECURITY_VIOLATION: 3,
  CONFIGURATION_ERROR: 4
};

const HTML_PATH = process.env.TARGET_HTML || 'public/index.html';
const OUTPUT_REPORT_PATH = process.env.REPORT_OUTPUT || 'dist/verification-report.json';
const SCHEMA_FILE = 'specs/content-schema.json';

async function main() {
  console.log('='.repeat(70));
  console.log('🔍 PIPELINE AGÊNTICO DE FACT-CHECKING E VALIDAÇÃO DE FONTES');
  console.log(`📄 Alvo: ${HTML_PATH}`);
  console.log(`⚙️ Modo: ${process.env.MOCK_LLM === 'true' ? 'MOCK / OFFLINE' : 'PRODUÇÃO / LIVE'}`);
  console.log('='.repeat(70));

  // 1. Verificação de existência do arquivo alvo
  if (!fs.existsSync(HTML_PATH)) {
    console.error(`❌ [ERRO DE CONFIGURAÇÃO] Arquivo alvo "${HTML_PATH}" não foi encontrado.`);
    process.exit(EXIT_CODES.CONFIGURATION_ERROR);
  }

  // 2. Leitura de especificações
  let contentSchema;
  try {
    contentSchema = loadContentSchema(SCHEMA_FILE);
  } catch (err) {
    console.error(`❌ [ERRO DE CONFIGURAÇÃO] Falha ao carregar spec "${SCHEMA_FILE}": ${err.message}`);
    process.exit(EXIT_CODES.CONFIGURATION_ERROR);
  }

  const htmlContent = fs.readFileSync(HTML_PATH, 'utf8');

  // 3. Extração e validação estrutural do DOM
  console.log('\n[Etapa 1/4] Extraindo cartões factuais do DOM...');
  const { cards, errors: extractionErrors } = extractClaimCards(htmlContent, { schema: contentSchema });

  if (extractionErrors.length > 0) {
    console.error('❌ [ERRO DE SCHEMA NO DOM] Violações estruturais detectadas:');
    for (const err of extractionErrors) {
      console.error(`   - ${err}`);
    }
    process.exit(EXIT_CODES.SCHEMA_ERROR);
  }

  if (cards.length === 0) {
    console.warn('⚠️ [AVISO] Nenhum cartão factual sob checagem encontrado no HTML. Nada a verificar.');
    process.exit(EXIT_CODES.SUCCESS);
  }

  console.log(`✅ ${cards.length} cartão(ões) identificado(s) com sucesso.`);

  // 4. Verificação de rede e segurança para cada fonte
  console.log('\n[Etapa 2/4] Validando links e efetuando fetch seguro...');
  const brokenLinks = new Set();
  let securityViolationDetected = false;
  let securityViolationDetails = '';

  const evaluatedClaims = [];

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    console.log(`\n📌 [Card ${i + 1}/${cards.length}] ID: "${card.id}" | Título: "${card.title}"`);
    console.log(`   Afirmação: "${card.claim_text.substring(0, 100)}..."`);

    const sourcesData = [];

    for (const sourceUrl of card.source_urls) {
      process.stdout.write(`   -> Checando fonte: ${sourceUrl}... `);
      const fetchResult = await safeFetchSource(sourceUrl);

      if (fetchResult.error && fetchResult.error.startsWith('SSRF')) {
        console.log(`🚨 BLOQUEADO!`);
        securityViolationDetected = true;
        securityViolationDetails = `Violação SSRF no card "${card.id}": ${fetchResult.error}`;
        brokenLinks.add(sourceUrl);
      } else if (!fetchResult.accessible && !fetchResult.isBotBlocked) {
        console.log(`❌ FALHOU (${fetchResult.error})`);
        brokenLinks.add(sourceUrl);
      } else {
        console.log(`✅ OK (HTTP ${fetchResult.status}${fetchResult.isBotBlocked ? ' - WAF ativo' : ''})`);
      }

      sourcesData.push({
        url: sourceUrl,
        status: fetchResult.status,
        accessible: fetchResult.accessible,
        isBotBlocked: fetchResult.isBotBlocked || false,
        content: fetchResult.content,
        details: fetchResult.error || 'Acessado com sucesso'
      });
    }

    if (securityViolationDetected) {
      break;
    }

    // 5. Avaliação Semântica por IA (Semantic Entailment)
    console.log('   -> Executando análise semântica com IA...');
    const evaluation = await evaluateClaimWithSources(card.claim_text, sourcesData);

    const isCardVerified = evaluation.verified && evaluation.confidence >= 0.70;
    console.log(`   Resultado: ${isCardVerified ? '🟢 APROVADO' : '🔴 REPROVADO'} (Confiança: ${(evaluation.confidence * 100).toFixed(0)}%)`);
    console.log(`   Justificativa: ${evaluation.justification}`);

    evaluatedClaims.push({
      card_id: card.id,
      title: card.title,
      claim_text: card.claim_text,
      verified: isCardVerified,
      confidence: evaluation.confidence,
      justification: evaluation.justification,
      sources_checked: sourcesData.map(s => ({
        url: s.url,
        status: s.status,
        accessible: s.accessible,
        details: s.details
      }))
    });
  }

  // Tratar violação de segurança crítica
  if (securityViolationDetected) {
    console.error(`\n🚨 [ALERTA DE SEGURANÇA] ${securityViolationDetails}`);
    process.exit(EXIT_CODES.SECURITY_VIOLATION);
  }

  // 6. Consolidação e Cálculo Final
  console.log('\n[Etapa 3/4] Consolidando relatório de conformidade...');
  const passedCards = evaluatedClaims.filter(c => c.verified).length;
  const failedCards = evaluatedClaims.filter(c => !c.verified).length;
  const allVerified = failedCards === 0 && brokenLinks.size === 0;

  const totalConfidence = evaluatedClaims.reduce((acc, c) => acc + c.confidence, 0);
  const avgConfidence = evaluatedClaims.length > 0 ? Number((totalConfidence / evaluatedClaims.length).toFixed(2)) : 1.0;

  let justification = '';
  if (allVerified) {
    justification = `Todas as ${evaluatedClaims.length} alegações factuais foram validadas com sucesso pelas fontes externas com índice médio de confiança de ${(avgConfidence * 100).toFixed(0)}%. Zero links quebrados identificados.`;
  } else {
    justification = `Falha na verificação: ${failedCards} de ${evaluatedClaims.length} cartões foram reprovados ou contêm links quebrados (${brokenLinks.size} URL(s) inacessível(is)).`;
  }

  const finalReport = {
    verified: allVerified,
    confidence: avgConfidence,
    justification,
    broken_links: Array.from(brokenLinks),
    total_cards_inspected: cards.length,
    passed_cards: passedCards,
    failed_cards: failedCards,
    claims_evaluated: evaluatedClaims,
    timestamp: new Date().toISOString()
  };

  // 7. Gravação de artefatos de saída
  console.log('\n[Etapa 4/4] Gerando sumário e artefatos...');
  const outputDir = path.dirname(OUTPUT_REPORT_PATH);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  fs.writeFileSync(OUTPUT_REPORT_PATH, JSON.stringify(finalReport, null, 2), 'utf8');
  console.log(`📄 Relatório JSON salvo em: ${OUTPUT_REPORT_PATH}`);

  // Se estiver no ambiente do GitHub Actions, publica no $GITHUB_STEP_SUMMARY
  if (process.env.GITHUB_STEP_SUMMARY) {
    const summaryMd = generateGitHubStepSummary(finalReport);
    try {
      fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summaryMd, 'utf8');
      console.log('📌 GitHub Step Summary atualizado.');
    } catch (e) {
      console.warn(`[WARN] Não foi possível escrever no GITHUB_STEP_SUMMARY: ${e.message}`);
    }
  }

  console.log('='.repeat(70));
  console.log(`STATUS FINAL: ${allVerified ? '✅ MERGE AUTORIZADO (PASS)' : '❌ MERGE BLOQUEADO (FAIL)'}`);
  console.log(`Justificativa: ${justification}`);
  console.log('='.repeat(70));

  if (!allVerified) {
    process.exit(EXIT_CODES.VERIFICATION_FAILED);
  }

  process.exit(EXIT_CODES.SUCCESS);
}

/**
 * Gera texto Markdown formatado para o Step Summary do GitHub Actions.
 * @param {object} report
 * @returns {string}
 */
function generateGitHubStepSummary(report) {
  let md = `## 🛡️ Relatório do Agente de Fact-Checking e Validação\n\n`;
  md += `**Status:** ${report.verified ? '🟢 **APROVADO**' : '🔴 **REPROVADO**'}  \n`;
  md += `**Índice de Confiança Médio:** ${(report.confidence * 100).toFixed(0)}%  \n`;
  md += `**Cartões Auditados:** ${report.total_cards_inspected} (Aprovados: ${report.passed_cards} | Reprovados: ${report.failed_cards})  \n`;
  md += `**Links Quebrados:** ${report.broken_links.length}  \n\n`;
  md += `> ${report.justification}\n\n`;

  md += `### 📋 Detalhamento das Alegações\n\n`;
  md += `| ID | Título | Status | Confiança | Fontes | Justificativa |\n`;
  md += `|---|---|---|---|---|---|\n`;

  for (const claim of report.claims_evaluated) {
    const statusIcon = claim.verified ? '✅ Aprovado' : '❌ Reprovado';
    const sourcesSummary = claim.sources_checked
      .map(s => `[${s.status || 'ERR'}](${s.url})`)
      .join('<br>');

    md += `| \`${claim.card_id}\` | ${claim.title} | ${statusIcon} | ${(claim.confidence * 100).toFixed(0)}% | ${sourcesSummary} | ${claim.justification.replace(/\|/g, '\\|')} |\n`;
  }

  if (report.broken_links.length > 0) {
    md += `\n### ⚠️ URLs Inacessíveis ou Bloqueadas\n\n`;
    for (const url of report.broken_links) {
      md += `- \`${url}\`\n`;
    }
  }

  md += `\n---\n*Gerado automaticamente pelo Agente de Fact-Checking em ${report.timestamp}*\n`;
  return md;
}

// Execução do CLI
main().catch(err => {
  console.error('💥 Erro fatal não tratado:', err);
  process.exit(EXIT_CODES.CONFIGURATION_ERROR);
});

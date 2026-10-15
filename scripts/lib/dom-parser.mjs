import * as cheerio from 'cheerio';
import crypto from 'node:crypto';
import fs from 'node:fs';

/**
 * Carrega a especificação de conteúdo do arquivo JSON.
 * @param {string} specPath
 * @returns {object}
 */
export function loadContentSchema(specPath = 'specs/content-schema.json') {
  const content = fs.readFileSync(specPath, 'utf8');
  return JSON.parse(content);
}

/**
 * Gera um ID determinístico baseado no texto da alegação caso o elemento não tenha id.
 * @param {string} text
 * @returns {string}
 */
function generateDeterministicId(text) {
  return 'claim-' + crypto.createHash('sha256').update(text).digest('hex').substring(0, 10);
}

/**
 * Faz a extração e validação dos cartões factuais a partir do HTML estático.
 * @param {string} htmlContent
 * @param {object} [options]
 * @param {object} [options.schema]
 * @returns {{ cards: Array<object>, errors: Array<string> }}
 */
export function extractClaimCards(htmlContent, options = {}) {
  const schema = options.schema || loadContentSchema();
  const targetSelectors = schema.target_selectors || [
    '.warn-card',
    '.fact-card',
    '.card[data-claim]',
    '.job-item[data-claim]'
  ];

  const fieldSelectors = schema.field_selectors || {
    claim_text: ['.claim-text', '.card-text', '.description', 'p', '.fact-content'],
    sources: ['a.source-link', 'a[href^="http"]', '[data-source-url]'],
    title: ['.card-title', '.warn-title', 'h2', 'h3', 'h4', 'strong']
  };

  const $ = cheerio.load(htmlContent);
  const cards = [];
  const errors = [];
  const seenIds = new Set();

  const combinedSelector = targetSelectors.join(', ');
  $(combinedSelector).each((_, element) => {
    const $el = $(element);
    const matchedSelector = targetSelectors.find(s => $el.is(s)) || targetSelectors[0];

      // 1. Identificador
      let id = $el.attr('id') || $el.attr('data-id');

      // 2. Título (opcional)
      let title = '';
      for (const tSel of fieldSelectors.title) {
        const found = $el.find(tSel).first().text().trim();
        if (found) {
          title = found;
          break;
        }
      }

      // 3. URLs de Fontes
      const sourceUrls = new Set();

      // Atributo no próprio card
      const dataAttrSource = $el.attr('data-source-url');
      if (dataAttrSource) {
        sourceUrls.add(dataAttrSource.trim());
      }

      // Tags internas
      for (const sSel of fieldSelectors.sources) {
        $el.find(sSel).each((_, linkEl) => {
          const href = $(linkEl).attr('href') || $(linkEl).attr('data-source-url');
          if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
            sourceUrls.add(href.trim());
          }
        });
      }

      // 4. Texto da Alegação
      let claimText = '';
      for (const cSel of fieldSelectors.claim_text) {
        const matches = $el.find(cSel);
        if (matches.length > 0) {
          const parts = [];
          matches.each((_, matchEl) => {
            const clone = $(matchEl).clone();
            clone.find('a').remove();
            const text = clone.text().replace(/\s+/g, ' ').trim();
            if (text && text.length >= 10) {
              parts.push(text);
            }
          });
          if (parts.length > 0) {
            claimText = parts.join(' ');
            break;
          }
        }
      }

      // Se nenhum sub-elemento pontual bateu, pega o texto do container inteiro (exceto links e título)
      if (!claimText) {
        const clone = $el.clone();
        clone.find('a').remove();
        if (title) {
          // Remove o título para isolar a claim
          clone.find('h3, h4, .card-title, strong').first().remove();
        }
        claimText = clone.text().replace(/\s+/g, ' ').trim();
      }

      // Fallback de ID
      if (!id) {
        id = generateDeterministicId(claimText || matchedSelector);
      }

      // Checagem de duplicação de ID
      if (seenIds.has(id)) {
        errors.push(`ID duplicado detectado no documento: "${id}"`);
      } else {
        seenIds.add(id);
      }

      // Validação de regras do card
      if (!claimText || claimText.length < 10) {
        errors.push(`Card "${id}" (${matchedSelector}) não contém texto de alegação factual suficiente (mínimo de 10 caracteres).`);
      }

      const sourcesList = Array.from(sourceUrls);
      if (sourcesList.length === 0) {
        errors.push(`Card "${id}" (${matchedSelector}) não possui nenhuma fonte externa válida vinculada.`);
      }

      cards.push({
        id,
        title: title || 'Sem título',
        matched_selector: matchedSelector,
        claim_text: claimText,
        source_urls: sourcesList
      });
  });

  return { cards, errors };
}

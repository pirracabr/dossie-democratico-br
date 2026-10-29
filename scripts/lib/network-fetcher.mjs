import * as cheerio from 'cheerio';
import { validateUrlSafe } from './ssrf-filter.mjs';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';
const MAX_BODY_BYTES = 2 * 1024 * 1024; // 2MB
const REQUEST_TIMEOUT_MS = 4000;
const MAX_REDIRECTS = 3;

/**
 * Extrai e sanitiza texto legível de um HTML bruto, descartando scripts, estilos,
 * cabeçalhos, rodapés, menus, barras laterais e blocos de notícias/checagens relacionadas.
 * @param {string} rawHtml
 * @param {number} [maxChars]
 * @returns {string}
 */
export function sanitizeHtmlToText(rawHtml, maxChars = 4000) {
  if (!rawHtml) return '';
  const $ = cheerio.load(rawHtml);

  // 1. Remove elementos estruturais executáveis, decorativos e de metadados
  $('script, style, svg, noscript, iframe, link, meta, form, menu').remove();

  // 2. Remove cabeçalhos, rodapés, barras de navegação e menus
  $(
    'nav, header, footer, [role="navigation"], [role="banner"], [role="contentinfo"], ' +
    '.header, .site-header, .topbar, .navbar, .nav, .menu, .navigation, .nav-menu, ' +
    '.footer, .site-footer, .bottom-bar, .breadcrumbs, .breadcrumb'
  ).remove();

  // 3. Remove barras laterais e blocos auxiliares
  $(
    'aside, [role="complementary"], .sidebar, .side-bar, .aside, .widget, .widgets'
  ).remove();

  // 4. Remove blocos de checagens alheias, matérias relacionadas, recomendações, anúncios e comentários
  $(
    '.related, .relacionadas, .noticias-relacionadas, .leia-tambem, .leia-mais, .veja-mais, ' +
    '.outras-noticias, .mais-lidas, .recomendadas, .box-relacionadas, .bloco-relacionadas, ' +
    '.chamadas-relacionadas, .fato-ou-fake, .fato-fake, .checagem, .fact-check, .fact-check-menu, ' +
    '.widget-checagem, .ad, .ads, .advertising, .banner, .publicidade, .share, .social, ' +
    '.social-share, .comments, .comentarios, .newsletter, .newsletter-box'
  ).remove();

  // 5. Prioriza seletores específicos de corpo do artigo
  let text = '';
  const articleBody = $(
    'article .article__body, article .article-body, article .content-text, ' +
    'article .entry-content, article .post-content, article .corpo-materia, ' +
    'article .materia-conteudo, .article__body, .article-body, .corpo-materia, ' +
    '.materia-conteudo, article, main, [role="main"], #content, .content'
  ).first();

  if (articleBody.length > 0) {
    // Limpa qualquer elemento de recomendação/relacionadas remanescente dentro do artigo
    articleBody.find(
      'aside, .related, .relacionadas, .leia-tambem, .veja-mais, .share, .social, nav, footer'
    ).remove();
    text = articleBody.text();
  } else {
    text = $('body').text() || $.text();
  }

  // Normaliza espaços em branco e quebras de linha
  const cleaned = text
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return cleaned.substring(0, maxChars);
}

/**
 * Realiza fetch seguro de uma URL externa com validação de SSRF, proteção contra redirect loops e sanitização.
 * @param {string} targetUrl
 * @param {object} [options]
 * @param {number} [options.redirectHops]
 * @param {Function} [options.customFetch] - Injetor opcional para mock em testes
 * @returns {Promise<{ accessible: boolean, status: number, content: string, finalUrl: string, error?: string, isBotBlocked?: boolean }>}
 */
export async function safeFetchSource(targetUrl, options = {}) {
  const customFetch = options.customFetch || globalThis.fetch;
  let currentUrl = targetUrl;
  let redirectCount = 0;

  while (redirectCount <= MAX_REDIRECTS) {
    // 1. Validação de SSRF pré-requisição em CADA hop
    const ssrfCheck = await validateUrlSafe(currentUrl, options);
    if (!ssrfCheck.safe) {
      return {
        accessible: false,
        status: 0,
        content: '',
        finalUrl: currentUrl,
        error: `SSRF bloqueado: ${ssrfCheck.error}`
      };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await customFetch(currentUrl, {
        method: 'GET',
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
          'Sec-Fetch-Mode': 'navigate'
        },
        redirect: 'manual',
        signal: controller.signal
      });

      // Tratamento de Redirecionamentos (301, 302, 303, 307, 308)
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        clearTimeout(timeoutId);
        const location = response.headers.get('location');
        if (!location) {
          return {
            accessible: true,
            status: response.status,
            content: '',
            finalUrl: currentUrl,
            isBotBlocked: true,
            error: `Redirecionamento ${response.status} sem header Location (tratado como WAF/Anti-Bot).`
          };
        }

        // Resolve URLs relativas contra a URL atual
        const nextUrl = new URL(location, currentUrl).toString();
        redirectCount++;
        if (redirectCount > MAX_REDIRECTS) {
          return {
            accessible: true,
            status: response.status,
            content: '',
            finalUrl: currentUrl,
            isBotBlocked: true,
            error: `Limite de ${MAX_REDIRECTS} redirecionamentos atingido (possível paywall/cookie-wall).`
          };
        }
        currentUrl = nextUrl;
        continue;
      }

      // Verificação de tamanho pelo Content-Length
      const contentLength = response.headers.get('content-length');
      if (contentLength && Number.parseInt(contentLength, 10) > MAX_BODY_BYTES) {
        clearTimeout(timeoutId);
        return {
          accessible: true,
          status: response.status,
          content: '',
          finalUrl: currentUrl,
          isBotBlocked: true,
          error: `Conteúdo da resposta excede ${MAX_BODY_BYTES} bytes (domínio ativo verificado via cabeçalhos/DNS).`
        };
      }

      // Tratamento de respostas HTTP >= 400 (WAF, Anti-Bot, Geo-Block em IPs de datacenter CI/CD)
      if (!response.ok) {
        clearTimeout(timeoutId);
        return {
          accessible: true, // Domínio ativo e resolveu via DNS, mas bloqueou/rejeitou scraper
          status: response.status,
          content: '',
          finalUrl: currentUrl,
          isBotBlocked: true,
          error: `Servidor retornou HTTP ${response.status} (WAF/Anti-Bot ou bloqueio de IP de datacenter na fonte externa).`
        };
      }

      const bodyText = await response.text();
      clearTimeout(timeoutId);
      const sanitized = sanitizeHtmlToText(bodyText);

      return {
        accessible: true,
        status: response.status,
        content: sanitized,
        finalUrl: currentUrl
      };

    } catch (err) {
      clearTimeout(timeoutId);
      const isAbort = err.name === 'AbortError' || err.cause?.name === 'AbortError' || err.code === 'ETIMEDOUT' || err.cause?.code === 'UND_ERR_CONNECT_TIMEOUT';
      const detail = isAbort
        ? `Timeout de ${REQUEST_TIMEOUT_MS}ms excedido ao consultar URL.`
        : (err.cause?.message ? `${err.message} (${err.cause.message})` : err.message);

      // Conforme Regra R1 (specs/rules.md): se o domínio já teve sua existência e IP público
      // validados via DNS (ssrfCheck), timeouts/bloqueios de conexão por WAF/firewall (ex: .jus.br)
      // são registrados como limitação anti-bot (WAF) em vez de falso-positivo de link quebrado.
      if (ssrfCheck.resolvedIps && ssrfCheck.resolvedIps.length > 0) {
        return {
          accessible: true,
          status: 403,
          content: '',
          finalUrl: currentUrl,
          isBotBlocked: true,
          error: `WAF/Anti-Bot ou timeout após verificação DNS (${ssrfCheck.resolvedIps[0]}): ${detail}`
        };
      }

      return {
        accessible: false,
        status: 0,
        content: '',
        finalUrl: currentUrl,
        error: detail
      };
    }
  }

  return {
    accessible: false,
    status: 0,
    content: '',
    finalUrl: currentUrl,
    error: 'Número excessivo de redirecionamentos.'
  };
}

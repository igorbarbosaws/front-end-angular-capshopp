/**
 * Ilustrações planas usadas quando o produto não tem imagem (ou a URL falha).
 * Em produção, o ideal é o back-end sempre devolver imagemUrl.
 */

type Tipo = 'phone' | 'laptop' | 'headset' | 'keyboard' | 'generic';

const FUNDO = '#F6F7F9';
const AZUL = '#0070AD';
const ESCURO = '#1F2933';

function uri(interno: string): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">` +
    `<rect width="400" height="300" fill="${FUNDO}"/>${interno}</svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg).replace(/'/g, '%27');
}

const sombra = (cx: number, cy: number, rx: number) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="9" fill="${ESCURO}" opacity=".08"/>`;

function desenho(tipo: Tipo): string {
  switch (tipo) {
    case 'phone':
      return uri(
        sombra(200, 268, 70) +
          `<rect x="148" y="28" width="104" height="240" rx="20" fill="${ESCURO}"/>` +
          `<rect x="156" y="40" width="88" height="216" rx="12" fill="${AZUL}"/>` +
          `<circle cx="200" cy="50" r="4" fill="${ESCURO}"/>` +
          `<rect x="170" y="86" width="60" height="8" rx="4" fill="#fff" opacity=".85"/>` +
          `<rect x="170" y="104" width="40" height="6" rx="3" fill="#fff" opacity=".55"/>` +
          `<rect x="170" y="190" width="60" height="40" rx="8" fill="#fff" opacity=".2"/>`,
      );
    case 'laptop':
      return uri(
        sombra(200, 248, 150) +
          `<rect x="88" y="52" width="224" height="150" rx="10" fill="${ESCURO}"/>` +
          `<rect x="97" y="61" width="206" height="132" rx="5" fill="${AZUL}"/>` +
          `<rect x="112" y="80" width="92" height="9" rx="4" fill="#fff" opacity=".85"/>` +
          `<rect x="112" y="98" width="60" height="7" rx="3" fill="#fff" opacity=".5"/>` +
          `<rect x="214" y="120" width="72" height="56" rx="6" fill="#fff" opacity=".2"/>` +
          `<path d="M52 206h296l-18 30H70z" fill="#C5CCD4"/>` +
          `<rect x="170" y="212" width="60" height="6" rx="3" fill="#9AA5AF"/>`,
      );
    case 'headset':
      return uri(
        sombra(200, 262, 90) +
          `<path d="M112 168C112 62 288 62 288 168" fill="none" stroke="${ESCURO}" stroke-width="16" stroke-linecap="round"/>` +
          `<rect x="88" y="150" width="42" height="84" rx="16" fill="${AZUL}"/>` +
          `<rect x="270" y="150" width="42" height="84" rx="16" fill="${AZUL}"/>` +
          `<rect x="96" y="164" width="12" height="56" rx="6" fill="#fff" opacity=".35"/>` +
          `<rect x="292" y="164" width="12" height="56" rx="6" fill="#fff" opacity=".35"/>` +
          `<path d="M100 232C100 262 150 262 168 256" fill="none" stroke="${ESCURO}" stroke-width="6" stroke-linecap="round"/>` +
          `<circle cx="172" cy="256" r="8" fill="${ESCURO}"/>`,
      );
    case 'keyboard': {
      let teclas = '';
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 12; c++) {
          const x = 64 + c * 23.4;
          teclas +=
            `<rect x="${x}" y="${112 + r * 24}" width="19" height="19" rx="4" fill="#fff" opacity=".92"/>` +
            `<rect x="${x}" y="${128 + r * 24}" width="19" height="3" rx="1.5" fill="${AZUL}"/>`;
        }
      }
      return uri(
        sombra(200, 236, 160) + `<rect x="46" y="96" width="308" height="120" rx="12" fill="${ESCURO}"/>` + teclas,
      );
    }
    default:
      return uri(
        `<rect x="110" y="70" width="180" height="150" rx="16" fill="#fff"/>` +
          `<rect x="128" y="92" width="144" height="70" rx="8" fill="${AZUL}"/>` +
          `<rect x="128" y="176" width="90" height="10" rx="5" fill="#C5CCD4"/>` +
          `<rect x="128" y="194" width="60" height="8" rx="4" fill="#DDE2E7"/>`,
      );
  }
}

const cache = new Map<Tipo, string>();

/** Escolhe a ilustração pelo nome do produto; produtos novos recebem a genérica. */
export function arteProduto(nome: string): string {
  const n = nome.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const tipo: Tipo = /smartphone|celular|iphone|telefone/.test(n)
    ? 'phone'
    : /notebook|laptop/.test(n)
      ? 'laptop'
      : /headset|fone/.test(n)
        ? 'headset'
        : /teclado/.test(n)
          ? 'keyboard'
          : 'generic';
  if (!cache.has(tipo)) cache.set(tipo, desenho(tipo));
  return cache.get(tipo)!;
}

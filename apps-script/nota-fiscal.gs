/**
 * Cabana AURA · recebe a "confirmação de reserva" da cartilha e grava na
 * aba "Nota fiscal" da planilha "Cabana AURA · Hóspedes para nota fiscal".
 *
 * Uma linha por pessoa (responsável + demais hóspedes), todas com o mesmo
 * código de confirmação. Se o hóspede usar "editar e reenviar", as linhas
 * daquele código são substituídas, sem duplicar.
 *
 * Instalação: veja apps-script/LEIA-ME.md
 */

const ABA = 'Nota fiscal';
// E-mail do contador para receber um aviso a cada confirmação. Vazio = sem aviso.
const EMAIL_CONTADOR = '';
const MAX_HOSPEDES = 9;

const CABECALHO = [
  'Recebido em', 'Confirmação', 'Papel', 'Nome completo', 'Tipo de documento',
  'Documento', 'E-mail', 'Celular', 'Total de hóspedes', 'Idioma',
  'Status da nota (contador)', 'Observações'
];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const d = JSON.parse(e.postData.contents);
    if (!d || !d.consent || !texto_(d.name) || !texto_(d.doc)) return resposta_({ ok: false, erro: 'dados incompletos' });

    const id = texto_(d.id).replace(/[^A-Z0-9]/gi, '').slice(0, 12) || Utilities.getUuid().slice(0, 8).toUpperCase();
    const hospedes = Array.isArray(d.guests) ? d.guests.slice(0, MAX_HOSPEDES - 1) : [];
    const tipo = d.docType === 'passport' ? 'Passaporte' : 'CPF';
    const total = 1 + hospedes.length;
    const agora = new Date();
    const idioma = d.lang === 'en' ? 'EN' : 'PT';

    const linhas = [[agora, id, 'Responsável (tomador)', d.name, tipo, d.doc, d.email, d.phone, total, idioma, '', '']]
      .concat(hospedes.map((g, i) => [agora, id, 'Hóspede ' + (i + 2), g && g.name, tipo, g && g.doc, '', '', total, idioma, '', '']))
      .map(l => l.map(seguro_));

    const sh = aba_();
    removerConfirmacao_(sh, id);
    sh.getRange(sh.getLastRow() + 1, 1, linhas.length, CABECALHO.length).setValues(linhas);

    if (EMAIL_CONTADOR) avisarContador_(id, linhas);
    return resposta_({ ok: true, id: id });
  } catch (err) {
    return resposta_({ ok: false, erro: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return resposta_({ ok: true, servico: 'Cabana AURA · nota fiscal' });
}

/** Rode uma vez pelo editor para autorizar e preparar a aba. */
function configurar() {
  aba_();
}

function aba_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(ABA);
  if (!sh) {
    const primeira = ss.getSheets()[0];
    sh = primeira.getLastRow() <= 1 ? primeira.setName(ABA) : ss.insertSheet(ABA);
  }
  if (sh.getRange(1, 1).getValue() !== CABECALHO[0]) {
    sh.getRange(1, 1, 1, CABECALHO.length).setValues([CABECALHO]);
  }
  sh.getRange(1, 1, 1, CABECALHO.length).setFontWeight('bold').setBackground('#96AF95').setFontColor('#FFFFFF');
  sh.setFrozenRows(1);
  // Texto puro: CPF, celular e passaporte não viram número nem perdem zeros.
  sh.getRange('B:L').setNumberFormat('@');
  sh.getRange('A:A').setNumberFormat('dd/MM/yyyy HH:mm');
  return sh;
}

function removerConfirmacao_(sh, id) {
  const n = sh.getLastRow() - 1;
  if (n < 1) return;
  const ids = sh.getRange(2, 2, n, 1).getValues();
  for (let i = ids.length - 1; i >= 0; i--) {
    if (String(ids[i][0]) === id) sh.deleteRow(i + 2);
  }
}

function avisarContador_(id, linhas) {
  const fmt = v => v instanceof Date ? Utilities.formatDate(v, 'America/Sao_Paulo', 'dd/MM/yyyy HH:mm') : String(v).replace(/^'/, '');
  const th = CABECALHO.slice(0, 9).map(c => '<th style="text-align:left;padding:6px 10px;background:#96AF95;color:#fff">' + c + '</th>').join('');
  const trs = linhas.map(l => '<tr>' + l.slice(0, 9).map(v => '<td style="padding:6px 10px;border-bottom:1px solid #eee">' + fmt(v) + '</td>').join('') + '</tr>').join('');
  MailApp.sendEmail({
    to: EMAIL_CONTADOR,
    subject: 'Cabana AURA · nova confirmação de reserva ' + id + ' · ' + fmt(linhas[0][3]),
    htmlBody: '<p>Nova confirmação de reserva para emissão de nota fiscal.</p><table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:13px"><tr>' + th + '</tr>' + trs +
      '</table><p><a href="' + SpreadsheetApp.getActiveSpreadsheet().getUrl() + '">Abrir a planilha</a></p>'
  });
}

function texto_(v) {
  return v == null ? '' : String(v).trim().slice(0, 200);
}

// Evita que um valor começando com = + - @ vire fórmula na planilha.
function seguro_(v) {
  if (v instanceof Date || typeof v === 'number') return v;
  const s = texto_(v);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function resposta_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

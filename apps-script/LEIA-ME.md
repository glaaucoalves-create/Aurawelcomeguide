# Planilha de nota fiscal · Cabana AURA

A tela "confirmar reserva" da cartilha envia os dados dos hóspedes para a aba
**Nota fiscal** da planilha
[Cabana AURA · Hóspedes para nota fiscal](https://docs.google.com/spreadsheets/d/1O-nM7kM59mh3Y9Bg2J1idbAdNMSP5lvTnmOyA_pb-24/edit).
Cada envio vira uma linha por pessoa (responsável + demais hóspedes) com o
mesmo código de confirmação. Um reenvio com o mesmo código substitui as linhas
anteriores.

## Instalação (uma vez, uns 5 minutos)

1. Abra a planilha e vá em **Extensões → Apps Script**.
2. Apague o conteúdo de `Código.gs` e cole o conteúdo de `nota-fiscal.gs`.
3. Se quiser que o contador receba um e-mail a cada confirmação, preencha
   `EMAIL_CONTADOR` no topo do arquivo.
4. Salve. No seletor de funções, escolha **configurar** e clique em **Executar**.
   Autorize o acesso quando o Google pedir (planilha e envio de e-mail).
5. Clique em **Implantar → Nova implantação**, tipo **App da Web**:
   - Executar como: **Eu**
   - Quem pode acessar: **Qualquer pessoa**
6. Copie a URL que termina em `/exec` e coloque em `NF_SHEET_URL` na cartilha
   (ou mande para o Claude colocar).

Ao alterar o script depois, use **Implantar → Gerenciar implantações → editar →
Nova versão** para manter a mesma URL.

## Para o contador

- Compartilhe a planilha com o contador (Compartilhar → e-mail dele, como
  Leitor ou Editor).
- A coluna **Status da nota (contador)** e **Observações** ficam livres para ele
  marcar o que já foi emitido.

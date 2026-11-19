# VIVA — atualização do Financeiro do Escritório

Esta atualização acrescenta a primeira versão funcional do módulo **Financeiro do escritório**.

## Funcionalidades
- Cadastro manual de receitas e despesas profissionais.
- Descrição, valor, data, categoria e cliente opcional.
- Situação recebido/pago ou pendente.
- Resumo mensal de receitas recebidas, despesas pagas, resultado e total pendente.
- Filtro por mês e situação; exclusão de lançamentos.
- Armazenamento separado das finanças pessoais, usando a chave local `viva_office_finance_v1`.

## Como atualizar
Substitua no repositório GitHub os arquivos `app.js`, `styles.css` e `README.md` pelos deste pacote e confirme o commit. O `index.html` não precisa ser alterado.

## Limitações importantes
É um protótipo front-end. Os dados ficam apenas no armazenamento local do navegador e aparelho; não há login, banco de dados, sincronização ou backup em nuvem. Use somente dados fictícios. O cadastro integrado de clientes, cobranças e relatórios completos ainda não está implementado.

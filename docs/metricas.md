# Plano de métricas

Métricas acionáveis do Banco de Resíduos. Quase todas saem direto do **painel administrativo** do MVP (`/admin`) ou da landing page; a coluna "Valor atual" deve ser preenchida com o número real no dia da medição, nunca estimado.

| # | Métrica | Por que importa | Como mede | Meta (até o Demo Day) | Valor atual |
| --- | --- | --- | --- | --- | --- |
| 1 | **Anúncios ativos** | Sem oferta de resíduo não há marketplace | Painel admin → anúncios com status ATIVO | 20 anúncios reais de produtores/agroindústrias do Vale | — |
| 2 | **Taxa de conversão negociação → transação** | Mostra se as partes chegam a acordo dentro da plataforma | Transações criadas ÷ negociações abertas no período | ≥ 30% | — |
| 3 | **Volume negociado (R$) e comissão gerada** | Valida o modelo de receita de 5% | Painel admin → soma de `valorTotal` e `comissao` das transações PAGA/CONCLUIDA | Primeira comissão registrada em teste com usuário real | — |
| 4 | **Toneladas de resíduo reaproveitadas** | Impacto ambiental, argumento central do pitch | Soma da quantidade das transações CONCLUIDA (kg) | 1 t | — |
| 5 | **Leads da landing page** | Demanda antes de abrir a plataforma | Formulário da landing → planilha de leads; visitas pelo contador da página | 50 visitas e 15 leads | — |

## Como a equipe usa essas métricas

- Medir toda semana e registrar a data ao lado do valor.
- Se a métrica 1 estiver baixa, o problema é aquisição de vendedores (visitas a agroindústrias e cooperativas).
- Se a métrica 2 estiver baixa com a 1 alta, o problema é preço ou confiança: rever com os testes de usabilidade.

## Histórico de medições

| Data | Anúncios ativos | Conversão | Volume (R$) | Comissão (R$) | kg reaproveitados | Visitas | Leads |
| --- | --- | --- | --- | --- | --- | --- | --- |
| | | | | | | | |

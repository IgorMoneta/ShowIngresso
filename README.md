# Bilheteria concorrente

Projeto final de Paradigmas de Linguagens de Programação. Enunciado completo no Blackboard.

Os cinco arquivos de implementação em `src/` estão preenchidos. `tipos.ts` e `servidor.ts` vieram prontos e foram preservados. O papel de cada arquivo está no enunciado:

| Arquivo | Passo do enunciado |
| :--- | :--- |
| `src/tipos.ts` (pronto) | 1: os tipos |
| `src/regras.ts` | 2: meia-entrada |
| `src/preco.ts` | 3: preço (funcional) |
| `src/dominio.ts` | 4: evento e erros (orientado a objetos) |
| `src/bilheteria.ts` | 5: a venda, onde a concorrência aparece |
| `src/servidor.ts` (pronto) e `src/main.ts` | 6: ligar o servidor |

Não alterem `src/pagamento.ts`, `src/servidor.ts`, `src/bench.ts` nem `testes/`: a correção usa os originais.

Para começar, sigam o `GUIA.md`. Depois dele, os comandos são:

```bash
npm install
npm test          # correção automática: mostra os pontos
npm start         # serviço em http://localhost:3000
npm run bench     # com o serviço no ar: 200 pedidos simultâneos no evento 1, dois por poltrona
```

Exemplo de pedido:

```bash
curl -X POST localhost:3000/reservas -H 'Content-Type: application/json' \
  -d '{"eventoId":1,"ingressos":[{"nome":"Ana","idade":20,"estudante":true,"pcd":false,"poltrona":7}]}'
```

---

## Preencham (avaliado no vídeo)

**Link do vídeo:** PENDENTE — inserir o link público do vídeo do grupo antes da entrega.

> Implementação local verificada com `npm test`, `npm run typecheck`, `npm start` e `npm run bench`. Este clone ainda aponta para o repositório modelo: configure o repositório público do grupo antes de enviar. O grupo precisa gravar o vídeo, preencher os nomes/RGMs e fazer commits com as próprias contas.

### Integrantes

| Nome | Usuário do GitHub | Parte principal |
| :--- | :--- | :--- |
| PENDENTE — preencher com os integrantes reais | PENDENTE | PENDENTE |

### Decisões

1. **Concorrência.** `bilheteria.reservar()` chama `evento.reservar(poltronas)` de forma síncrona **antes** do `await` do pagamento. Um pedido concorrente para a mesma poltrona recebe `PoltronaOcupadaErro` (409) antes de qualquer cobrança. Se o `await` viesse antes de marcar, dois pedidos poderiam cobrar pela mesma poltrona.
2. **OO.** `Evento` guarda as poltronas vendidas no campo privado `#vendidas`; seu getter `disponivel` e `info()` mostram apenas o necessário. `reservar()` valida a lista inteira antes de marcar qualquer poltrona: um pedido inválido não vende só parte dos ingressos. A hierarquia `ErroDeNegocio` associa cada falha ao status HTTP adequado (400, 404, 409 ou 502), usado pelo `servidor.ts`.
3. **Funcional.** `valorDoIngresso` e `aplicarTaxa` são fábricas de funções; `montarIngressos` usa `map` e a regra recebida como argumento, e `calcularTotal` usa `reduce`. Não alteram as entradas nem dependem de estado global; podem ser testadas diretamente com pessoas e valores, sem servidor nem pagamento.
4. **Se fosse em outro paradigma.** O preço poderia ser calculado em uma classe com método `calcularTotal`, armazenando a taxa como estado. Aqui as funções puras são mais simples de combinar e testar; a classe seria útil se houvesse várias políticas de preço com ciclo de vida e estado próprio.
5. **Concorrente × paralelo.** Enquanto o pagamento aguarda I/O, o event loop atende outros pedidos: há concorrência sem executar as linhas JavaScript simultaneamente. Em vários processos/núcleos, cada processo teria sua própria lista de poltronas; seria necessário coordenar a reserva em um banco transacional ou lock compartilhado para evitar venda duplicada. O protótipo em memória não oferece essa garantia distribuída.

**Limite do protótipo:** `Promise.race` impõe prazo de espera, mas não cancela a operadora falsa. Uma cobrança que termine *depois* do timeout poderia ser aprovada após a liberação da poltrona. Em produção, seriam necessários cancelamento/estorno e conciliação idempotente com a operadora; o projeto implementa o contrato e os testes fornecidos, não uma integração financeira real.

### Resultados do bench

| Cenário | Pedidos | Tempo (ms) | Vendidos | Poltrona ocupada | Falha de pagamento |
| :--- | ---: | ---: | ---: | ---: | ---: |
| Padrão (`main.ts`), uma execução local | 200 | 170 | 87 | 100 | 13 |

O bench ocupa as poltronas do evento 1: para rodar de novo, parem o `npm start` (Ctrl+C) e subam outra vez. Os resultados variam porque a operadora simulada falha aleatoriamente.

O que os números mostram: os 100 pedidos concorrentes que disputaram poltronas já reservadas receberam 409 **antes de pagar**. Dos outros 100, 13 pagamentos falharam e liberaram as poltronas; 87 vendas foram confirmadas. A execução levou 170 ms, em vez de esperar sequencialmente 200 pagamentos de 80 ms.

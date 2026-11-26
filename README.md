# Bilheteria concorrente

Projeto final da disciplina de Paradigmas de Linguagens de Programação.

O sistema simula a venda de ingressos com vários pedidos concorrentes, incluindo disputas pela mesma poltrona e pagamentos que podem demorar ou falhar.

Vídeo da apresentação: [INSERIR LINK DO VÍDEO]

## Integrantes e contribuições

- Igor Nunes Moneta
  - RGM: 33065268
  - Responsável por `src/main.ts` e pela documentação no `README.md`.

- Pedro Henrique Alves Vieira do Nascimento
  - RGM: 32593511
  - Responsável por `src/preco.ts`, com o cálculo dos ingressos e da taxa de serviço.

- Josenilton Cirne Ramalho Neto
  - RGM: 32591888
  - Responsável por `src/regras.ts`, com a regra de meia-entrada.

- Pedro Alexandre Soares Vieira
  - RGM: 33090921
  - Responsável por `src/dominio.ts`, com os eventos, o controle das poltronas e os erros de negócio.

- Hiago Kalil Silva do Nascimento
  - RGM: 29104441
  - Responsável por `src/bilheteria.ts`, com o fluxo de reserva, pagamento e tratamento de falhas.

## Objetivo

Aplicar três paradigmas de programação em um mesmo problema:

- Orientação a objetos: proteger o estado dos eventos e controlar as poltronas.
- Programação funcional: calcular preços, meia-entrada e taxa de serviço.
- Concorrência: atender outros pedidos enquanto um pagamento está pendente.

A principal decisão do fluxo é marcar as poltronas antes de aguardar o pagamento. Assim, outro pedido que dispute o mesmo lugar é recusado antes de iniciar uma cobrança.

## Organização do projeto

### Arquivos implementados pelo grupo

- `src/regras.ts`: verifica o direito à meia-entrada.
- `src/preco.ts`: monta os ingressos e calcula os preços.
- `src/dominio.ts`: implementa os eventos e os erros de negócio.
- `src/bilheteria.ts`: coordena a reserva e o pagamento.
- `src/main.ts`: configura os eventos, a operadora simulada e o servidor.

### Arquivos fornecidos pelo professor

- `src/tipos.ts`: interfaces e tipos utilizados no projeto.
- `src/servidor.ts`: rotas HTTP e tratamento dos erros.
- `src/pagamento.ts`: operadora de pagamento simulada.
- `src/bench.ts`: benchmark de pedidos concorrentes.
- `testes/`: testes de correção.

Os arquivos fornecidos devem ser preservados conforme o enunciado.

## Como executar

Na pasta do projeto, instale as dependências:

```bash
npm install
```

Execute os testes:

```bash
npm test
```

Confira os tipos:

```bash
npm run typecheck
```

Inicie o servidor:

```bash
npm start
```

O serviço fica disponível em:

```text
http://localhost:3000
```

Mantenha esse terminal aberto e use outro terminal para fazer as consultas ou executar o benchmark.

## Exemplos de uso

Os comandos abaixo estão no formato bash/Git Bash.

### Listar eventos

```bash
curl -i http://localhost:3000/eventos
```

### Solicitar uma reserva

```bash
curl -i -X POST http://localhost:3000/reservas \
  -H 'Content-Type: application/json' \
  -d '{"eventoId":1,"ingressos":[{"nome":"Ana","idade":20,"estudante":true,"pcd":false,"poltrona":7}]}'
```

Se o pagamento for aprovado, a resposta utiliza o status `201` e contém o comprovante.

Como a operadora é simulada e pode falhar, uma tentativa de compra também pode retornar um erro de pagamento.

### Status utilizados

- `201`: venda confirmada.
- `400`: dados inválidos.
- `404`: evento não encontrado.
- `409`: poltrona ocupada.
- `502`: falha ou limite de espera do pagamento.

## Decisões técnicas

### 1. Como tratamos a concorrência

O método `Bilheteria.reservar()` chama `evento.reservar(poltronas)` antes do (1/3)
[25/11/2026 22:36] Athenas_BOT: `await` do pagamento.

A marcação acontece de forma síncrona. Enquanto o primeiro pedido aguarda a operadora, outro pedido pode ser atendido, mas já encontra aquelas poltronas ocupadas.

Se o pagamento falhar ou ultrapassar o limite de espera, as poltronas são liberadas.

Marcar os lugares somente depois do pagamento permitiria que pedidos concorrentes iniciassem cobranças disputando a mesma poltrona. Um deles poderia ser recusado depois de já ter sido cobrado.

### 2. Por que usamos orientação a objetos

A classe `Evento` reúne os dados do evento e as operações que podem alterar suas poltronas.

A lista `#vendidas` é privada. O código externo deve usar os métodos da classe, sem alterar diretamente essa lista.

O getter `disponivel` calcula quantas poltronas estão livres.

O método `reservar()` verifica todas as poltronas antes de marcar qualquer uma. Se houver uma poltrona inválida, repetida ou ocupada, nenhuma poltrona daquele pedido é marcada.

A hierarquia `ErroDeNegocio` associa cada erro ao status HTTP adequado, permitindo que o servidor responda de acordo com o problema.

### 3. Por que usamos programação funcional

O cálculo de preços usa funções que não alteram os dados recebidos e não dependem de estado global.

- `valorDoIngresso(precoBase)` devolve uma função que calcula meia ou inteira.
- `aplicarTaxa(percentual)` devolve uma função que aplica a taxa.
- `montarIngressos()` usa `map` para transformar pessoas em ingressos.
- `calcularTotal()` usa `reduce` para somar os valores e aplica a taxa de serviço de 10%.

A regra de meia-entrada é recebida como argumento por `montarIngressos()`, permitindo trocar essa regra sem modificar a transformação da lista.

Na aplicação, a função `direitoAMeia()` considera estudante, pessoa com deficiência ou pessoa com 60 anos ou mais.

O valor da meia e o resultado da aplicação da taxa são arredondados para duas casas decimais.

Essa separação permite testar os cálculos sem iniciar servidor ou pagamento.

### 4. Como seria em outro paradigma

O preço poderia ser calculado por uma classe que armazenasse a taxa e tivesse um método de cálculo.

Neste projeto, funções sem estado são suficientes e facilitam a composição e os testes. Uma classe poderia ser útil caso as políticas de preço precisassem manter estado próprio ao longo do tempo.

### 5. Concorrência não é o mesmo que paralelismo

Enquanto um pedido aguarda o pagamento, o event loop pode atender outros pedidos. Isso permite sobrepor as esperas sem executar as linhas JavaScript simultaneamente em vários núcleos.

O controle de poltronas deste protótipo funciona em um único processo, com estado em memória.

Se houvesse vários processos ou servidores, seria necessário coordenar as reservas por um mecanismo compartilhado, como um banco de dados com operações transacionais.

## Tempo limite e limitações

A função `comTempoLimite()` usa `Promise.race` para limitar a espera pelo pagamento.

Se o tempo acabar, o pedido recebe um erro e suas poltronas são liberadas.

Entretanto, `Promise.race` não cancela a operação de pagamento que continua pendente. Uma cobrança poderia terminar depois da liberação da poltrona.

Por isso, uma integração de produção precisaria tratar cancelamento, estorno e conciliação idempotente com a operadora.

O projeto é um protótipo acadêmico com pagamento simulado, não uma integração financeira real.

## Benchmark

Com uma instância nova do servidor em execução, use outro terminal:

```bash
npm run bench
```

O benchmark padrão envia 200 pedidos, com dois pedidos disputando cada poltrona do evento 1.

### Execução local registrada

- Pedidos enviados: 200.
- Tempo total: 170 ms.
- Vendas confirmadas — `201`: 87.
- Poltrona ocupada — `409`: 100.
- Falhas de pagamento — `502`: 13.

### Interpretação

Nesta execução, 100 pedidos encontraram poltronas já marcadas e foram recusados antes de iniciar o pagamento.

Dos pedidos que chegaram à etapa de pagamento, 87 tiveram a venda confirmada e 13 falharam, liberando suas poltronas.
 (2/3)
[25/11/2026 22:36] Athenas_BOT: O resultado representa uma execução local. Os números podem variar porque a operadora simulada falha aleatoriamente e o tempo depende do ambiente.

O benchmark demonstra o comportamento deste protótipo, mas não comprova capacidade de produção ou segurança entre múltiplos servidores.

### Como repetir

Pare o servidor com `Ctrl+C` e inicie novamente:

```bash
npm start
```

Depois, em outro terminal:

```bash
npm run bench
```

O reinício é necessário porque as poltronas permanecem ocupadas na memória enquanto o processo está ativo.

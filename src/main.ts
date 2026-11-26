import { Evento } from "./dominio.ts";
import { criarPagamentoFalso } from "./pagamento.ts";
import { criarBilheteria } from "./bilheteria.ts";
import { criarServidor } from "./servidor.ts";

const bilheteria = criarBilheteria({
  eventos: [
    new Evento(1, "Show principal", 100, 100),
    new Evento(2, "Show acústico", 80, 60),
    new Evento(3, "Show ao ar livre", 120, 200),
  ],
  pagar: criarPagamentoFalso({ latenciaMs: 80, taxaDeFalha: 0.1 }),
  limitePagamentoMs: 500,
});

criarServidor(bilheteria).listen(3000, () => {
  console.log("Bilheteria em http://localhost:3000");
});

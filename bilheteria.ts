import type { Comprovante, ConfigBilheteria, Pedido } from "./tipos.ts";
import type { Pagamento } from "./pagamento.ts";
import { DadosInvalidosErro, NaoEncontradoErro, PagamentoErro, Evento } from "./dominio.ts";
import { direitoAMeia } from "./regras.ts";
import { montarIngressos, calcularTotal } from "./preco.ts";

function comTempoLimite<T>(promessa: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const limite = new Promise<never>((_, rejeitar) => {
    timer = setTimeout(() => rejeitar(new Error("tempo esgotado")), ms);
  });
  return Promise.race([promessa, limite]).finally(() => clearTimeout(timer));
}

export class Bilheteria {
  #eventos: Evento[];
  #pagar: Pagamento;
  #limitePagamentoMs: number;
  #proximoReservaId = 1;

  constructor(config: ConfigBilheteria) {
    this.#eventos = [...config.eventos];
    this.#pagar = config.pagar;
    this.#limitePagamentoMs = config.limitePagamentoMs;
  }

  listarEventos() {
    return this.#eventos.map((evento) => evento.info());
  }

  async reservar(pedido: Pedido): Promise<Comprovante> {
    if (!Array.isArray(pedido?.ingressos) || pedido.ingressos.length === 0) {
      throw new DadosInvalidosErro("pedido sem ingressos");
    }
    const evento = this.#eventos.find((item) => item.id === pedido.eventoId);
    if (!evento) throw new NaoEncontradoErro("evento não encontrado");

    const poltronas = pedido.ingressos.map((pessoa) => pessoa.poltrona);
    evento.reservar(poltronas);
    const ingressos = montarIngressos(evento.preco, pedido.ingressos, direitoAMeia);
    const total = calcularTotal(ingressos);
    try {
      await comTempoLimite(this.#pagar(total), this.#limitePagamentoMs);
    } catch {
      evento.liberar(poltronas);
      throw new PagamentoErro("pagamento não aprovado");
    }
    return { reservaId: this.#proximoReservaId++, eventoId: evento.id, ingressos, total };
  }
}

export function criarBilheteria(config: ConfigBilheteria): Bilheteria {
  return new Bilheteria(config);
}

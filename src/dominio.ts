import type { EventoInfo } from "./tipos.ts";

export abstract class ErroDeNegocio extends Error {
  constructor(mensagem: string, public readonly status: number) {
    super(mensagem);
    this.name = new.target.name;
  }
}

export class DadosInvalidosErro extends ErroDeNegocio {
  constructor(mensagem: string) { super(mensagem, 400); }
}
export class NaoEncontradoErro extends ErroDeNegocio {
  constructor(mensagem: string) { super(mensagem, 404); }
}
export class PoltronaOcupadaErro extends ErroDeNegocio {
  constructor(mensagem: string) { super(mensagem, 409); }
}
export class PagamentoErro extends ErroDeNegocio {
  constructor(mensagem: string) { super(mensagem, 502); }
}

export class Evento {
  #vendidas: number[] = [];

  constructor(
    public readonly id: number,
    public readonly nome: string,
    public readonly preco: number,
    public readonly capacidade: number,
  ) {}

  get disponivel(): number {
    return this.capacidade - this.#vendidas.length;
  }

  reservar(poltronas: number[]): void {
    if (!Array.isArray(poltronas) || poltronas.length === 0 ||
        poltronas.some((n) => !Number.isInteger(n) || n < 1 || n > this.capacidade) ||
        new Set(poltronas).size !== poltronas.length) {
      throw new DadosInvalidosErro("poltronas inválidas");
    }
    if (poltronas.some((n) => this.#vendidas.includes(n))) {
      throw new PoltronaOcupadaErro("poltrona já vendida");
    }
    this.#vendidas.push(...poltronas);
  }

  liberar(poltronas: number[]): void {
    if (!Array.isArray(poltronas) || poltronas.length === 0 ||
        new Set(poltronas).size !== poltronas.length ||
        poltronas.some((n) => !this.#vendidas.includes(n))) {
      throw new DadosInvalidosErro("poltrona não estava reservada");
    }
    this.#vendidas = this.#vendidas.filter((n) => !poltronas.includes(n));
  }

  info(): EventoInfo {
    return {
      id: this.id,
      nome: this.nome,
      preco: this.preco,
      capacidade: this.capacidade,
      disponivel: this.disponivel,
    };
  }
}

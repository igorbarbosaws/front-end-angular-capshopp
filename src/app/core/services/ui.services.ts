import { Injectable, signal } from '@angular/core';

/* ---------- Avisos rápidos (toast) ---------- */

export type TipoAviso = 'ok' | 'warn' | 'bad' | 'info';

export interface Aviso {
  id: number;
  texto: string;
  tipo: TipoAviso;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private proximo = 1;
  readonly avisos = signal<Aviso[]>([]);

  mostrar(texto: string, tipo: TipoAviso = 'info'): void {
    const aviso: Aviso = { id: this.proximo++, texto, tipo };
    this.avisos.update((lista) => [...lista, aviso]);
    setTimeout(() => this.avisos.update((lista) => lista.filter((a) => a.id !== aviso.id)), 3800);
  }

  ok(texto: string): void {
    this.mostrar(texto, 'ok');
  }

  erro(texto: string): void {
    this.mostrar(texto, 'bad');
  }
}

/* ---------- Janela de confirmação ---------- */

export interface OpcoesConfirmacao {
  titulo: string;
  mensagem: string;
  confirmar: string;
  cancelar?: string;
  /** Destaca o botão de confirmação como ação destrutiva. */
  perigo?: boolean;
}

export interface ConfirmacaoAberta extends OpcoesConfirmacao {
  resolver: (confirmou: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  readonly aberta = signal<ConfirmacaoAberta | null>(null);

  perguntar(opcoes: OpcoesConfirmacao): Promise<boolean> {
    return new Promise((resolver) => this.aberta.set({ ...opcoes, resolver }));
  }

  responder(confirmou: boolean): void {
    const atual = this.aberta();
    this.aberta.set(null);
    atual?.resolver(confirmou);
  }
}

/* ---------- Termo de busca compartilhado (cabeçalho e catálogo) ---------- */

@Injectable({ providedIn: 'root' })
export class BuscaService {
  readonly termo = signal('');
}

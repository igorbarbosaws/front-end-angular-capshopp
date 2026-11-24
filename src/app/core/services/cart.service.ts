import { Injectable, computed, inject, signal } from '@angular/core';
import { ItemCarrinho, Produto, Usuario } from '../models';
import { AuthService } from './auth.service';

export interface ResultadoCarrinho {
  ok: boolean;
  mensagem: string;
}

/**
 * Carrinho individual por cliente, guardado no localStorage do navegador
 * (PDF, seção 05). Continua salvo depois do logout. Guarda só produtoId e
 * quantidade; nome, preço e estoque são sempre lidos da API.
 */
@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly auth = inject(AuthService);

  /** Muda a cada gravação, para o computed reler o storage. */
  private readonly versao = signal(0);

  readonly itens = computed<ItemCarrinho[]>(() => {
    this.versao();
    const usuario = this.auth.usuario();
    return usuario?.perfil === 'CLIENTE' ? this.ler(usuario) : [];
  });

  readonly quantidadeTotal = computed(() => this.itens().reduce((soma, i) => soma + i.quantidade, 0));

  adicionar(produto: Produto, quantidade: number): ResultadoCarrinho {
    if (produto.estoque < 1) {
      return { ok: false, mensagem: 'Produto sem estoque não pode ser comprado.' };
    }
    const itens = [...this.itens()];
    const existente = itens.find((i) => i.produtoId === produto.id);
    const jaTem = existente?.quantidade ?? 0;
    if (jaTem + quantidade > produto.estoque) {
      return {
        ok: false,
        mensagem: `Só há ${produto.estoque} unidade(s) em estoque. Você já tem ${jaTem} no carrinho.`,
      };
    }
    if (existente) existente.quantidade += quantidade;
    else itens.push({ produtoId: produto.id, quantidade });
    this.gravar(itens);
    return { ok: true, mensagem: `${produto.nome} adicionado ao carrinho.` };
  }

  /** Aumenta ou diminui em 1. Chegando a zero, remove o item. */
  alterar(produtoId: number, delta: number, estoqueAtual: number): ResultadoCarrinho {
    const itens = this.itens().map((i) => ({ ...i }));
    const item = itens.find((i) => i.produtoId === produtoId);
    if (!item) return { ok: false, mensagem: 'Item não encontrado.' };
    if (delta > 0 && item.quantidade + 1 > estoqueAtual) {
      return { ok: false, mensagem: `Só há ${estoqueAtual} unidade(s) em estoque.` };
    }
    item.quantidade += delta;
    this.gravar(itens.filter((i) => i.quantidade > 0));
    return { ok: true, mensagem: '' };
  }

  remover(produtoId: number): void {
    this.gravar(this.itens().filter((i) => i.produtoId !== produtoId));
  }

  limpar(): void {
    this.gravar([]);
  }

  private chave(usuario: Usuario): string {
    return `capshopp-cart-${usuario.email}`;
  }

  private ler(usuario: Usuario): ItemCarrinho[] {
    try {
      const bruto = localStorage.getItem(this.chave(usuario));
      return bruto ? (JSON.parse(bruto) as ItemCarrinho[]) : [];
    } catch {
      return [];
    }
  }

  private gravar(itens: ItemCarrinho[]): void {
    const usuario = this.auth.usuario();
    if (!usuario) return;
    try {
      localStorage.setItem(this.chave(usuario), JSON.stringify(itens));
    } catch {
      // sem storage: o carrinho some ao recarregar
    }
    this.versao.update((v) => v + 1);
  }
}

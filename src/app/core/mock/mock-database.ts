import { Injectable } from '@angular/core';
import { Pedido, Produto, Usuario } from '../models';

/**
 * Banco simulado, guardado no localStorage do navegador. Existe só para o
 * front funcionar enquanto o back-end não está pronto. Não use em produção.
 */

export interface UsuarioRegistro extends Usuario {
  senha: string;
}

export interface PedidoRegistro extends Pedido {
  /** Garante que o cancelamento devolve o estoque exatamente uma vez. */
  estoqueReposto: boolean;
}

interface Estado {
  seq: { produto: number; pedido: number };
  produtos: Produto[];
  pedidos: PedidoRegistro[];
}

const CHAVE = 'capshopp-mock-db-v3';

/** Os cinco usuários do PDF. No back-end real são inseridos por INSERT SQL. */
const USUARIOS: UsuarioRegistro[] = [
  { id: 1, nome: 'Renata Figueiredo', email: 'renata.figueiredo@teste.com', senha: '123456', perfil: 'ADMIN' },
  { id: 2, nome: 'TechNova Eletrônicos', email: 'technova@teste.com', senha: '123456', perfil: 'LOJISTA' },
  { id: 3, nome: 'Arena Gamer', email: 'arenagamer@teste.com', senha: '123456', perfil: 'LOJISTA' },
  { id: 4, nome: 'Ana Beatriz Souza', email: 'ana.souza@teste.com', senha: '123456', perfil: 'CLIENTE' },
  { id: 5, nome: 'Carlos Eduardo Lima', email: 'carlos.lima@teste.com', senha: '123456', perfil: 'CLIENTE' },
];

function semente(): Estado {
  const base = { imagemUrl: null, ativo: true };
  return {
    seq: { produto: 5, pedido: 1001 },
    pedidos: [],
    // Quatro produtos de exemplo, dois por loja (PDF, seção 04).
    produtos: [
      { ...base, id: 1, lojaId: 2, lojaNome: 'TechNova Eletrônicos', nome: 'Smartphone 5G Pro 256 GB', preco: 2499, estoque: 8,
        descricao: 'Tela de 6,7 polegadas, câmera tripla e bateria para o dia todo.' },
      { ...base, id: 2, lojaId: 2, lojaNome: 'TechNova Eletrônicos', nome: 'Notebook Ultra 14', preco: 4299, estoque: 5,
        descricao: 'Notebook leve de 14 polegadas, 16 GB de memória e SSD de 512 GB.' },
      { ...base, id: 3, lojaId: 3, lojaNome: 'Arena Gamer', nome: 'Headset Gamer Surround 7.1', preco: 799.9, estoque: 15,
        descricao: 'Som envolvente, microfone removível e almofadas macias.' },
      { ...base, id: 4, lojaId: 3, lojaNome: 'Arena Gamer', nome: 'Teclado Mecânico RGB', preco: 219.9, estoque: 0,
        descricao: 'Switches mecânicos, iluminação RGB e layout ABNT2.' },
    ],
  };
}

@Injectable({ providedIn: 'root' })
export class MockDatabase {
  readonly usuarios: UsuarioRegistro[] = USUARIOS;
  estado: Estado = this.ler() ?? semente();

  salvar(): void {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(this.estado));
    } catch {
      // Sem localStorage (ou cheio): o protótipo continua só em memória.
    }
  }

  /** Volta aos quatro produtos iniciais e apaga pedidos e carrinhos. */
  restaurar(): void {
    this.estado = semente();
    try {
      localStorage.removeItem(CHAVE);
      Object.keys(localStorage)
        .filter((k) => k.startsWith('capshopp-cart-'))
        .forEach((k) => localStorage.removeItem(k));
    } catch {
      // ignorado
    }
  }

  private ler(): Estado | null {
    try {
      const bruto = localStorage.getItem(CHAVE);
      return bruto ? (JSON.parse(bruto) as Estado) : null;
    } catch {
      return null;
    }
  }
}

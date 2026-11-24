import { Observable, from, of, throwError } from 'rxjs';
import { ApiError, Pedido, ProdutoInput } from '../models';
import { PedidoRegistro } from './mock-database';

/**
 * Funções de apoio das implementações simuladas. As implementações aplicam no
 * navegador as MESMAS regras que o back-end deve aplicar (PDF Revisão 3.0).
 */

export const clonar = <T>(valor: T): T => JSON.parse(JSON.stringify(valor)) as T;
export const erro = (mensagem: string, status: number, detalhes: string[] = []) =>
  throwError(() => new ApiError(mensagem, detalhes, status));
export const normalizar = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
export const publico = (p: PedidoRegistro): Pedido => {
  const { estoqueReposto: _ignorado, ...pedido } = p;
  return clonar(pedido);
};

function lerArquivo(arquivo: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve(leitor.result as string);
    leitor.onerror = () => reject(new ApiError('Não foi possível ler a imagem.'));
    leitor.readAsDataURL(arquivo);
  });
}

/** Upload vira data URL no mock; no back-end real vira arquivo salvo e URL pública. */
export function resolverImagem(dados: ProdutoInput): Observable<string | null> {
  return dados.imagemArquivo ? from(lerArquivo(dados.imagemArquivo)) : of(dados.imagemUrl);
}

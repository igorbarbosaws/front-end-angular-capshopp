import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProdutoApi } from '../../core/api/apis';
import { ApiError, Produto, ProdutoInput } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/ui.services';
import { arteProduto } from '../../core/util/product-art';

type ModoImagem = 'upload' | 'url';

const TIPOS_IMAGEM = ['image/jpeg', 'image/png', 'image/webp'];
const LIMITE_BYTES = 2 * 1024 * 1024; // 2 MB (PDF, seção 04)

/** Cadastro e edição de produto da própria loja. */
@Component({
  selector: 'app-produto-form',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <a class="crumb" routerLink="/meus-produtos">‹ Voltar para meus produtos</a>
    <div class="page-h"><h1>{{ editando() ? 'Editar produto' : 'Novo produto' }}</h1></div>

    <section class="panel">
      <form class="f" (ngSubmit)="salvar()">
        <div class="fld">
          <label for="nome">Nome</label>
          <input id="nome" name="nome" type="text" maxlength="80" [(ngModel)]="nome" />
        </div>
        <div class="fld">
          <label for="descricao">Descrição</label>
          <textarea id="descricao" name="descricao" maxlength="400" [(ngModel)]="descricao"></textarea>
        </div>
        <div class="two-f">
          <div class="fld">
            <label for="preco">Preço (R$)</label>
            <input id="preco" name="preco" type="text" inputmode="decimal" placeholder="0,00" [(ngModel)]="preco" />
          </div>
          <div class="fld">
            <label for="estoque">Estoque</label>
            <input id="estoque" name="estoque" type="number" min="0" step="1" placeholder="0" [(ngModel)]="estoque" />
          </div>
        </div>

        <fieldset class="fld">
          <legend>Imagem</legend>
          <div class="mode">
            <label><input type="radio" name="modo" value="upload" [(ngModel)]="modo" /> Upload local</label>
            <label><input type="radio" name="modo" value="url" [(ngModel)]="modo" /> URL</label>
          </div>
          @if (modo === 'upload') {
            <input id="arquivo" name="arquivo" type="file" accept="image/jpeg,image/png,image/webp" (change)="escolherArquivo($event)" />
            <div class="hint">JPG, PNG ou WebP, até 2 MB.</div>
          } @else {
            <input id="url" name="url" type="text" placeholder="https://exemplo.com/imagem.jpg" [(ngModel)]="url" />
            <div class="hint">Sem imagem, uma ilustração padrão é usada.</div>
          }
          <div class="preview"><img [src]="previa()" alt="Pré-visualização da imagem" (error)="previaFalhou()" /></div>
        </fieldset>

        @if (erros().length) {
          <div class="note bad" role="alert">
            <ul style="margin: 0; padding-left: 18px">
              @for (e of erros(); track e) {
                <li>{{ e }}</li>
              }
            </ul>
          </div>
        }

        <div class="acts">
          <button type="submit" class="btn cta" [disabled]="salvando()">Salvar produto</button>
          <a class="btn" routerLink="/meus-produtos">Cancelar</a>
        </div>
      </form>
    </section>
  `,
})
export class ProdutoFormComponent implements OnInit {
  private readonly api = inject(ProdutoApi);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private produtoId: number | null = null;
  readonly editando = signal(false);
  readonly erros = signal<string[]>([]);
  readonly salvando = signal(false);

  nome = '';
  descricao = '';
  preco = '';
  estoque: number | null = null;
  modo: ModoImagem = 'upload';
  url = '';

  /** Imagem já salva no produto (ao editar). */
  private readonly imagemAtual = signal<string | null>(null);
  /** Arquivo escolhido agora e sua pré-visualização. */
  private arquivo: File | null = null;
  private readonly previaArquivo = signal<string | null>(null);
  private readonly previaQuebrada = signal(false);

  /** Método (não computed): depende de campos do formulário que não são signals. */
  previa(): string {
    const escolhida = this.modo === 'upload' ? (this.previaArquivo() ?? this.imagemAtual()) : null;
    const candidata = this.previaQuebrada() ? null : (escolhida ?? (this.modo === 'url' && this.url ? this.url : null));
    return candidata ?? arteProduto(this.nome || 'produto');
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.produtoId = Number(id);
    this.editando.set(true);
    this.api.buscar(this.produtoId).subscribe({
      next: (p) => this.preencher(p),
      error: (e: ApiError) => {
        this.toast.erro(e.message);
        this.router.navigateByUrl('/meus-produtos');
      },
    });
  }

  escolherArquivo(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const arquivo = input.files?.[0];
    if (!arquivo) return;
    if (!TIPOS_IMAGEM.includes(arquivo.type)) {
      this.erros.set(['Formato não aceito. Use JPG, PNG ou WebP.']);
      input.value = '';
      return;
    }
    if (arquivo.size > LIMITE_BYTES) {
      this.erros.set(['A imagem passa de 2 MB. Escolha um arquivo menor.']);
      input.value = '';
      return;
    }
    this.erros.set([]);
    this.arquivo = arquivo;
    this.previaQuebrada.set(false);
    const leitor = new FileReader();
    leitor.onload = () => this.previaArquivo.set(leitor.result as string);
    leitor.readAsDataURL(arquivo);
  }

  previaFalhou(): void {
    this.previaQuebrada.set(true);
  }

  salvar(): void {
    const usuario = this.auth.usuario();
    if (!usuario) return;

    const preco = Number(this.preco.replace(/\./g, '').replace(',', '.'));
    const estoque = this.estoque;
    const erros: string[] = [];
    if (this.nome.trim().length < 2) erros.push('Informe o nome do produto.');
    if (!this.descricao.trim()) erros.push('Informe a descrição.');
    if (!(preco > 0)) erros.push('Informe um preço maior que zero.');
    if (estoque === null || !Number.isInteger(estoque) || estoque < 0) {
      erros.push('O estoque deve ser um número inteiro, zero ou maior.');
    }
    if (this.modo === 'url' && this.url.trim() && !/^https?:\/\//i.test(this.url.trim())) {
      erros.push('A URL da imagem deve começar com http:// ou https://.');
    }
    this.erros.set(erros);
    if (erros.length || estoque === null) return;

    const dados: ProdutoInput = {
      nome: this.nome.trim(),
      descricao: this.descricao.trim(),
      preco,
      estoque,
      imagemUrl: this.modo === 'url' ? this.url.trim() || null : this.imagemAtual(),
      imagemArquivo: this.modo === 'upload' ? this.arquivo : null,
    };

    this.salvando.set(true);
    const chamada =
      this.produtoId === null ? this.api.criar(usuario.id, dados) : this.api.atualizar(this.produtoId, dados);
    chamada.subscribe({
      next: () => {
        this.toast.ok(
          this.produtoId === null
            ? 'Produto cadastrado.'
            : 'Produto atualizado. Pedidos antigos mantêm o preço da compra.',
        );
        this.router.navigateByUrl('/meus-produtos');
      },
      error: (e: ApiError) => {
        this.erros.set(e.detalhes.length ? e.detalhes : [e.message]);
        this.salvando.set(false);
      },
    });
  }

  private preencher(p: Produto): void {
    this.nome = p.nome;
    this.descricao = p.descricao;
    this.preco = String(p.preco).replace('.', ',');
    this.estoque = p.estoque;
    // Imagem enviada por upload (data URL no mock) abre no modo upload; qualquer outra URL abre no modo URL.
    const upload = !!p.imagemUrl && p.imagemUrl.startsWith('data:');
    this.modo = p.imagemUrl && !upload ? 'url' : 'upload';
    this.url = p.imagemUrl && !upload ? p.imagemUrl : '';
    this.imagemAtual.set(upload ? p.imagemUrl : null);
  }
}

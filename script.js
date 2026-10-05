// Landing page OCFO: comportamentos em JavaScript.
document.documentElement.classList.add('js'); // o CSS só esconde/anima coisas se o JS estiver rodando

const $ = (seletor, base = document) => base.querySelector(seletor);
const $$ = (seletor, base = document) => [...base.querySelectorAll(seletor)];

// 1. Ano do rodapé
function atualizarAnoRodape() {
  const el = $('[data-ano]');
  if (el) el.textContent = new Date().getFullYear();
}

// 2. Menu mobile: abre/fecha, fecha ao clicar num link ou apertar Escape
function inicializarMenuMobile() {
  const botao = $('#menu-botao');
  const menu = $('#menu');
  const definir = (aberto) => {
    menu.classList.toggle('aberto', aberto);
    botao.setAttribute('aria-expanded', aberto);
    botao.textContent = aberto ? 'Fechar' : 'Menu';
  };
  botao.addEventListener('click', () => definir(!menu.classList.contains('aberto')));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) definir(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('aberto')) { definir(false); botao.focus(); }
  });
}

// 3. Tema claro/escuro: lembra a escolha; sem escolha, segue o sistema
function inicializarTema() {
  const botao = $('#botao-tema');
  let salvo = null;
  try { salvo = localStorage.getItem('tema'); } catch { /* armazenamento bloqueado */ }
  const aplicar = (escuro) => {
    document.body.classList.toggle('escuro', escuro);
    botao.setAttribute('aria-pressed', escuro);
    botao.textContent = escuro ? 'Tema claro' : 'Tema escuro';
  };
  aplicar(salvo ? salvo === 'escuro' : matchMedia('(prefers-color-scheme: dark)').matches);
  botao.addEventListener('click', () => {
    const escuro = !document.body.classList.contains('escuro');
    aplicar(escuro);
    try { localStorage.setItem('tema', escuro ? 'escuro' : 'claro'); } catch { /* ignora */ }
  });
}

// 4. Navegação ativa: marca o link da seção que está no meio da tela
function inicializarNavegacaoAtiva() {
  const links = $$('#menu a');
  const observador = new IntersectionObserver((entradas) => {
    entradas.forEach((entrada) => {
      if (!entrada.isIntersecting) return;
      links.forEach((a) => {
        if (a.getAttribute('href') === '#' + entrada.target.id) a.setAttribute('aria-current', 'page');
        else a.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  links.map((a) => $(a.getAttribute('href'))).filter(Boolean).forEach((s) => observador.observe(s));
}

// 5 e 6. Barra de progresso de leitura e botão "voltar ao topo"
function inicializarRolagem() {
  const barra = $('#progresso');
  const topo = $('#voltar-topo');
  const atualizar = () => {
    const maximo = document.documentElement.scrollHeight - innerHeight;
    barra.style.transform = `scaleX(${maximo > 0 ? scrollY / maximo : 0})`;
    topo.hidden = scrollY < innerHeight / 2;
  };
  addEventListener('scroll', atualizar, { passive: true });
  atualizar();
}

// 7. Texto que alterna no hero (parado se a pessoa pediu menos movimento)
function inicializarPapeis() {
  const el = $('#papel');
  const papeis = ['Programação', 'Banco de Dados', 'Inteligência Artificial', 'Desenvolvimento Web'];
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let i = 0;
  setInterval(() => { i = (i + 1) % papeis.length; el.textContent = papeis[i]; }, 2200);
}

// 8. Busca + filtro por categoria (ignora maiúsculas e acentos)
function inicializarBuscaEFiltro() {
  const cards = $$('.projeto');
  const busca = $('#busca');
  const filtros = $$('.filtro');
  let categoria = 'todos';
  const normalizar = (t) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const aplicar = () => {
    const termo = normalizar(busca.value.trim());
    let total = 0;
    cards.forEach((card) => {
      const visivel = (categoria === 'todos' || card.dataset.categoria === categoria)
        && normalizar(card.textContent).includes(termo);
      card.hidden = !visivel;
      if (visivel) total++;
    });
    $('#contagem').textContent = `${total} ${total === 1 ? 'projeto' : 'projetos'}`;
    $('#sem-resultado').hidden = total > 0;
  };
  busca.addEventListener('input', aplicar);
  filtros.forEach((botao) => botao.addEventListener('click', () => {
    categoria = botao.dataset.filtro;
    filtros.forEach((b) => b.setAttribute('aria-pressed', b === botao));
    aplicar();
  }));
  aplicar();
}

// 9. Modal de detalhes (<dialog>): devolve o foco ao botão que abriu
function inicializarModal() {
  const modal = $('#modal');
  let origem = null;
  $$('.btn-detalhes').forEach((botao) => botao.addEventListener('click', () => {
    const card = botao.closest('.projeto');
    origem = botao;
    $('#modal-titulo').textContent = card.dataset.titulo;
    $('#modal-descricao').textContent = card.dataset.descricao;
    modal.showModal();
  }));
  $('#modal-fechar').addEventListener('click', () => modal.close());
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.close(); });
  modal.addEventListener('close', () => origem && origem.focus());
}

// 10. Formulário: valida os campos e envia a mensagem pelo Web3Forms, que repassa para o meu e-mail
function inicializarFormulario() {
  const form = $('#formulario');
  const retorno = $('#erro-form');
  const botao = form.querySelector('button[type="submit"]');
  const mostrar = (texto, ok = false) => {
    retorno.textContent = texto;
    retorno.classList.toggle('ok', ok);
  };
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nome = form.nome.value.trim();
    const email = form.email.value.trim();
    const mensagem = form.mensagem.value.trim();
    if (nome.length < 2) return mostrar('Informe seu nome.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return mostrar('Informe um e-mail válido.');
    if (mensagem.length < 10) return mostrar('A mensagem precisa ter pelo menos 10 caracteres.');
    botao.disabled = true;
    mostrar('Enviando...', true);
    try {
      const resposta = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: form.access_key.value,
          subject: `Contato pela landing page: ${nome}`,
          name: nome,
          email,
          message: mensagem,
        }),
      });
      const dados = await resposta.json();
      if (dados.success) {
        form.reset();
        $('#mensagem').dispatchEvent(new Event('input')); // zera o contador
        mostrar('Mensagem enviada! Obrigado pelo contato.', true);
      } else {
        mostrar('Não foi possível enviar agora. Tente de novo ou use o e-mail ao lado.');
      }
    } catch {
      mostrar('Erro no envio. Verifique a conexão e tente de novo.');
    } finally {
      botao.disabled = false;
    }
  });
}

// 11. Contador de caracteres da mensagem
function inicializarContador() {
  const campo = $('#mensagem');
  const atualizar = () => { $('#contador').textContent = `${campo.value.length} / ${campo.maxLength} caracteres`; };
  campo.addEventListener('input', atualizar);
  atualizar();
}

// 12. Copiar e-mail para a área de transferência
function inicializarCopiaEmail() {
  const retorno = $('#copiar-retorno');
  const email = $('#email-link').textContent.trim();
  $('#copiar-email').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(email);
      retorno.textContent = 'E-mail copiado!';
    } catch {
      retorno.textContent = 'Não consegui copiar. Selecione o e-mail e copie manualmente.';
    }
    setTimeout(() => { retorno.textContent = ''; }, 3000);
  });
}

// 13. Revelar elementos ao entrar na tela
function inicializarRevelar() {
  const alvos = $$('.secao h2, .sobre > *, .competencias > section, .projeto, .contato > *');
  alvos.forEach((el) => el.classList.add('revelar'));
  const observador = new IntersectionObserver((entradas, obs) => {
    entradas.forEach((entrada) => {
      if (entrada.isIntersecting) { entrada.target.classList.add('visivel'); obs.unobserve(entrada.target); }
    });
  }, { threshold: 0.15 });
  alvos.forEach((el) => observador.observe(el));
}

atualizarAnoRodape();
inicializarMenuMobile();
inicializarTema();
inicializarNavegacaoAtiva();
inicializarRolagem();
inicializarPapeis();
inicializarBuscaEFiltro();
inicializarModal();
inicializarFormulario();
inicializarContador();
inicializarCopiaEmail();
inicializarRevelar();

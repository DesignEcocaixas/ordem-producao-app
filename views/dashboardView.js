module.exports = function dashboardView(rotativa, flexo, query = {}, rotativaNovas = 0, flexoNovas = 0) {

  function formatarCor(cor) {
    if (!cor || cor === 'N/D') return 'Não definida';
    return cor.replace(/personalização/i, '').trim();
  }

  function modeloComTamanho(modelo, tamanho) {
    if (!modelo) return '';
    return tamanho ? `${modelo} ${tamanho}` : modelo;
  }

  const badgeStatus = status =>
    status === 'concluido'
      ? '<span class="badge bg-success">Concluído</span>'
      : '<span class="badge bg-warning text-dark">Pendente</span>';

  const textoStatus = status =>
    status === 'concluido'
      ? 'concluído'
      : 'pendente';

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Ordem de Produção</title>

  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">


  <!-- Bootstrap -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">

  <style>
  html, body {
  height: 100%;
}

body {
  margin: 0;
  display: flex;
  flex-direction: column;
  background-color: #e9ecef;
  min-height: 100vh;
  position: relative;
}

/* Granulado */
body::before {
  content: "";
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: -1; /* 🔥 IMPORTANTE */
  background-image:
    radial-gradient(rgba(0,0,0,0.15) 1px, transparent 1px),
    radial-gradient(rgba(0,0,0,0.15) 1px, transparent 1px);
  background-size: 3px 3px;
  background-position: 0 0, 1.5px 1.5px;
  opacity: 0.35;
}

    .btn-area {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }

    .btn-area button {
      flex: 1;
      min-width: 220px;
      padding: 18px;
      font-size: 1.1rem;
      border-radius: 12px;
    }

    .card {
      border-radius: 12px;
      transition: transform .2s ease, box-shadow .2s ease;
    }

    .card:hover {
      transform: translateY(-4px);
      box-shadow: 0 10px 25px rgba(0,0,0,.1);
    }

    .modal.fade .modal-dialog {
      transform: translateY(40px);
      transition: transform .3s ease-out;
    }

    .modal.show .modal-dialog {
      transform: translateY(0);
    }

    .footer-fixo {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  z-index: 1000;
}

.sucesso-icone {
  width: 90px;
  height: 90px;
  margin: 0 auto;
  border-radius: 50%;
  background: rgba(25, 135, 84, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: popSucesso 0.4s ease;
}

.sucesso-icone i {
  font-size: 48px;
  color: #198754;
}

@keyframes popSucesso {
  0% {
    transform: scale(0.5);
    opacity: 0;
  }
  70% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.erro-icone {
  width: 90px;
  height: 90px;
  margin: 0 auto;
  border-radius: 50%;
  background: rgba(220, 53, 69, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: popErro 0.4s ease;
}

.erro-icone i {
  font-size: 48px;
  color: #dc3545;
}

@keyframes popErro {
  0% {
    transform: scale(0.5);
    opacity: 0;
  }
  70% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
  </style>
</head>

<body>

<div class="flex-grow-1">

<div class="container my-5 position-relative" style="z-index:1;">

  <div class="row align-items-center g-5">

    <!-- LADO ESQUERDO -->
    <div class="col-lg-6">

      <div class="pe-lg-4">

        <h1 class="fw-bold mb-3">
          <i class="fa-solid fa-industry text-primary me-2"></i>
          Ordens de Produção
        </h1>

        <p class="text-muted fs-5">
          Sistema para gerenciamento das produções
          Rotativa, Plana e Flexográfica.
        </p>

        <p class="text-muted">
          Importe planilhas em Excel, gere automaticamente as ordens
          e acompanhe o andamento da produção de forma organizada.
        </p>

      </div>

    </div>


    <!-- LADO DIREITO -->
    <div class="col-lg-6">

      <div class="border border-secondary-subtle p-4 bg-white">

        <h5 class="fw-semibold mb-4">
          Gerenciar Produção
        </h5>

        <!-- IMPORTAR -->
        <form action="/importar" method="POST" enctype="multipart/form-data">

          <label class="form-label fw-semibold">
            Selecionar Planilha
          </label>

          <input
            type="file"
            name="planilha"
            accept=".xlsx,.xls"
            class="form-control mb-4"
            required
          >

          <!-- BOTÕES LADO A LADO -->
          <div class="d-flex gap-3 mb-4">

            <button class="btn btn-primary w-50">
              Gerar Ordens
            </button>

        </form>

        <form action="/limpar"
              method="POST"
              class="w-50"
              onsubmit="return confirm('Tem certeza que deseja excluir TODOS os cards?')">

            <button class="btn btn-outline-danger w-100">
              Limpar Todas
            </button>

        </form>

          </div>

          <div class="d-flex gap-3 flex-wrap">

            <button class="btn btn-outline-primary flex-fill py-3 position-relative"
                    data-bs-toggle="modal"
                    data-bs-target="#modalRotativa"
                    onclick="marcarVisualizado('rotativa', this)">

              <i class="fa-solid fa-gear me-2"></i>
              Rotativa / Plana

              ${rotativaNovas > 0 ? `
                <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                  ${rotativaNovas}
                </span>
              ` : ''}

            </button>

            <button class="btn btn-outline-success flex-fill py-3 position-relative"
                    data-bs-toggle="modal"
                    data-bs-target="#modalFlexo"
                    onclick="marcarVisualizado('flexografica', this)">

              <i class="fa-solid fa-layer-group me-2"></i>
              Flexográfica

              ${flexoNovas > 0 ? `
                <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                  ${flexoNovas}
                </span>
              ` : ''}

            </button>

          </div>

      </div>

    </div>

  </div>

</div>


<div class="modal fade" id="modalRotativa" tabindex="-1">
  <div class="modal-dialog modal-lg modal-dialog-scrollable modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header bg-primary text-white">
        <h5 class="modal-title">Produção Rotativa / Plana</h5>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
      </div>

      <div class="modal-body">

<div class="input-group mb-3">
  <input
    type="text"
    class="form-control"
    placeholder="Buscar por cliente, vendedor, modelo, tamanho ou status..."
    oninput="filtrarCards(this, 'rotativa')"
    id="buscaRotativa">

  <button
    class="btn btn-outline-secondary"
    type="button"
    onclick="limparBusca('rotativa')"
    title="Limpar busca">
    <i class="fa-solid fa-xmark"></i>
  </button>

          <a href="/exportar/rotativa" class="btn btn-outline-primary btn-sm">
            <i class="fa-solid fa-download"></i> Baixar ordem (Rotativa)
          </a>
        </div>

        ${rotativa.length === 0 ? `
  <p class="text-center text-muted">Nenhum item para rotativa.</p>
` : rotativa.map(r => `
  <div class="card mb-3"
     data-search="
       ${r.cliente}
       ${r.vendedor}
       ${r.modelo}
       ${r.tamanho}
       ${textoStatus(r.status_producao)}
     ">

    <div class="card-body">
      <div class="d-flex justify-content-between align-items-start">
        <div>
          <strong class="fs-4">${r.cliente}</strong><br>

          <strong>
            <i class="fa-solid fa-user-tie me-1"></i>
            Vendedor:
          </strong> ${r.vendedor || '—'}<br>

          <strong>
            <i class="fa-solid fa-box me-1"></i>
            Modelo:
          </strong> ${modeloComTamanho(r.modelo)}<br>

          <strong>
            <i class="fa-solid fa-ruler-combined me-1"></i>
            Tamanho:
          </strong> ${modeloComTamanho(r.tamanho)}<br>

          <strong>
            <i class="fa-solid fa-hashtag me-1"></i>
            QTD:
          </strong> ${r.quantidade}
        </div>

        <div class="text-end">
          ${badgeStatus(r.status_producao)}

          <button
            class="btn btn-sm btn-outline-success mt-2"
            onclick="alterarStatus('rotativa', ${r.id}, this)"
            title="Marcar como concluído / pendente">
            <i class="fa-solid fa-check"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
`).join('')}

      </div>
    </div>
  </div>
</div>


<div class="modal fade" id="modalFlexo" tabindex="-1">
  <div class="modal-dialog modal-lg modal-dialog-scrollable modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header bg-success text-white">
        <h5 class="modal-title">Produção Flexográfica</h5>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
      </div>

      <div class="modal-body">

<div class="input-group mb-3">
  <input
    type="text"
    class="form-control"
    placeholder="Buscar por cliente, vendedor, modelo, tamanho, material, cor ou status..."
    oninput="filtrarCards(this, 'flexo')"
    id="buscaFlexo">

  <button
    class="btn btn-outline-secondary"
    type="button"
    onclick="limparBusca('flexo')"
    title="Limpar busca">
    <i class="fa-solid fa-xmark"></i>
  </button>


          <a href="/exportar/flexografica" class="btn btn-outline-success btn-sm">
            <i class="fa-solid fa-download"></i> Baixar ordem (Flexográfica)
          </a>
        </div>

        ${flexo.length === 0 ? `
          <p class="text-center text-muted">Nenhum item para flexográfica.</p>
        ` : flexo.map(f => `
          <div class="card mb-3 border border-success" data-search="
       ${f.cliente}
       ${f.vendedor}
       ${f.modelo}
       ${f.tamanho}
       ${f.material}
       ${f.cor_personalizacao}
       ${textoStatus(f.status_producao)}
     ">

            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start">
                <div>
                  <strong class="fs-4">
                    ${f.cliente}
                  </strong><br>

                  <strong>
                    <i class="fa-solid fa-user-tie me-1"></i>
                    Vendedor:
                  </strong> ${f.vendedor || '—'}<br>

                  <strong>
                    <i class="fa-solid fa-box me-1"></i>
                    Modelo:
                  </strong> ${modeloComTamanho(f.modelo)}<br>

                  <strong>
                    <i class="fa-solid fa-ruler-combined me-1"></i>
                    Tamanho:
                  </strong> ${modeloComTamanho(f.tamanho)}<br>

                  <strong>
                    <i class="fa-solid fa-layer-group me-1"></i>
                    Material:
                  </strong> ${f.material || ''} |
                  <i class="fa-solid fa-palette me-1"></i>
                  ${f.qtd_cores || 0} cor(es)<br>

                  <strong>
                    <i class="fa-solid fa-fill-drip me-1"></i>
                    Cor:
                  </strong> ${formatarCor(f.cor_personalizacao)}<br>

                  <strong>
                    <i class="fa-solid fa-hashtag me-1"></i>
                    QTD:
                  </strong> ${f.quantidade}<br>

                  <small>
                    <i class="fa-solid fa-clipboard-check me-1"></i>
                    ${f.status_pedido || ''}
                  </small>
                </div>

                <div class="text-end">
                  ${badgeStatus(f.status_producao)}

                  <!--<form action="/status/flexografica/${f.id}" method="POST" class="mt-2">
                    <button
                      type="submit"
                      class="btn btn-sm btn-outline-success"
                      title="Marcar como concluído / pendente">
                      <i class="fa-solid fa-check"></i>
                    </button>
                  </form>-->

                  <button
                    class="btn btn-sm btn-outline-success mt-2"
                    onclick="alterarStatus('flexografica', ${f.id}, this)"
                    title="Marcar como concluído / pendente">
                    <i class="fa-solid fa-check"></i>
                  </button>

                </div>
              </div>

            </div>
          </div>
        `).join('')}
      </div>
    </div>
  </div>
</div>

<!-- MODAL DE SUCESSO -->
<div class="modal fade" id="modalSucesso" tabindex="-1">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content border-0 shadow-lg rounded-4">

      <div class="modal-header bg-success text-white border-0">
        <h5 class="modal-title fw-semibold">
          <i class="fa-solid fa-circle-check me-2"></i>
          Importação concluída
        </h5>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
      </div>

      <div class="modal-body text-center py-4">

        <!-- Ícone / Imagem de Sucesso -->
        <div class="mb-3">
          <div class="sucesso-icone">
            <i class="fa-solid fa-circle-check"></i>
          </div>
        </div>

        <p class="fs-5 fw-semibold mb-2">
          Planilha importada com sucesso!
        </p>

        <p class="text-muted mb-0">
          As ordens de produção foram geradas corretamente.
        </p>

      </div>

      <div class="modal-footer border-0 justify-content-center pb-4">
        <button class="btn btn-success px-4 rounded-pill" data-bs-dismiss="modal">
          OK
        </button>
      </div>

    </div>
  </div>
</div>

<!-- MODAL ERRO PLANILHA -->
<div class="modal fade" id="modalErro" tabindex="-1">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content border-0 shadow-lg rounded-4">

      <div class="modal-header bg-danger text-white border-0">
        <h5 class="modal-title fw-semibold">
          <i class="fa-solid fa-triangle-exclamation me-2"></i>
          Erro na planilha
        </h5>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
      </div>

      <div class="modal-body text-center py-4">

        <!-- Ícone / Imagem de Erro -->
        <div class="mb-3">
          <div class="erro-icone">
            <i class="fa-solid fa-circle-xmark"></i>
          </div>
        </div>

        <p class="fs-5 fw-semibold mb-2">
          A planilha enviada é incompatível.
        </p>

        <p class="text-muted mb-0">
          Verifique se está usando o modelo correto e tente novamente.
        </p>

      </div>

      <div class="modal-footer border-0 justify-content-center pb-4">
        <button class="btn btn-danger px-4 rounded-pill" data-bs-dismiss="modal">
          Entendi
        </button>
      </div>

    </div>
  </div>
</div>

<!-- MODAL CONFIRMAÇÃO DE EXCLUSÃO -->
<div class="modal fade" id="modalExcluir" tabindex="-1">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">

      <div class="modal-header bg-danger text-white">
        <h5 class="modal-title">⚠️ Confirmar exclusão</h5>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
      </div>

      <div class="modal-body text-center">
        <p class="fs-5 mb-2">
          Tem certeza que deseja excluir <strong>todas as ordens</strong>?
        </p>
        <p class="text-muted mb-0">
          Essa ação não poderá ser desfeita.
        </p>
      </div>

      <div class="modal-footer">
        <button type="button"
                class="btn btn-secondary"
                data-bs-dismiss="modal">
          Cancelar
        </button>

        <form action="/limpar" method="POST" class="m-0">
          <button type="submit" class="btn btn-danger">
            Sim, excluir tudo
          </button>
        </form>
      </div>

    </div>
  </div>
</div>

<!-- MODAL PROCESSAMENTO -->
<div class="modal fade" id="modalProcessamento" tabindex="-1" data-bs-backdrop="static" data-bs-keyboard="false">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">

      <div class="modal-header bg-primary text-white">
        <h5 class="modal-title">
          <i class="fa-solid fa-gear fa-spin me-2"></i>
          Processando Planilha
        </h5>
      </div>

      <div class="modal-body">

        <p id="textoEtapa" class="fw-semibold mb-3">
          Iniciando...
        </p>

        <div class="progress" style="height: 20px;">
          <div id="barraProgresso"
               class="progress-bar progress-bar-striped progress-bar-animated"
               role="progressbar"
               style="width: 0%">
          </div>
        </div>

      </div>

    </div>
  </div>
</div>


<!-- Bootstrap JS -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>

<script>
  const sucesso = ${query.sucesso ? 'true' : 'false'};

if (sucesso) {

  const modalElement = document.getElementById('modalSucesso');
  const modal = new bootstrap.Modal(modalElement);

  modal.show();

  // 🔥 Quando fechar, remover backdrop manualmente
  modalElement.addEventListener('hidden.bs.modal', function () {

    document.querySelectorAll('.modal-backdrop')
      .forEach(el => el.remove());

    document.body.classList.remove('modal-open');
    document.body.style = '';

  });

  // 🔥 Remove parâmetro da URL
  if (window.history.replaceState) {
    const url = new URL(window.location);
    url.searchParams.delete('sucesso');
    window.history.replaceState({}, document.title, url.pathname);
  }
}
  const erroPlanilha = ${query.erro === 'planilha' ? 'true' : 'false'};

  if (erroPlanilha) {
  const modalErro = new bootstrap.Modal(
    document.getElementById('modalErro')
  );
  modalErro.show();
}

  if (sucesso) {
    const modal = new bootstrap.Modal(
      document.getElementById('modalSucesso')
    );
    modal.show();
  }

  function normalizarTexto(texto) {
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  function alterarStatus(tipo, id, btn) {
    fetch(\`/status/\${tipo}/\${id}\`, { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        if (!data.success) return;

        const card = btn.closest('.card');
        const badge = card.querySelector('.badge');

        // 🔄 Atualiza badge visual
        if (data.status === 'concluido') {
          badge.className = 'badge bg-success ms-2';
          badge.innerText = 'Concluído';
        } else {
          badge.className = 'badge bg-warning text-dark ms-2';
          badge.innerText = 'Pendente';
        }

        // 🔥 ATUALIZA O DATA-SEARCH (ESSENCIAL)
        let search = card.dataset.search || '';

        // remove status antigo
        search = search
          .replace(/pendente|concluido|concluído/gi, '')
          .trim();

        // adiciona status novo
        const novoStatus =
          data.status === 'concluido'
            ? 'concluído'
            : 'pendente';

        card.dataset.search = \`\${search} \${novoStatus}\`;
      })
      .catch(err => console.error(err));
  }

  function filtrarCards(input, tipo) {
    const termo = normalizarTexto(input.value);

    const modalId =
      tipo === 'rotativa'
        ? 'modalRotativa'
        : 'modalFlexo';

    const modal = document.getElementById(modalId);
    const cards = modal.querySelectorAll('.card');

    cards.forEach(card => {
      const texto = normalizarTexto(card.dataset.search || '');
      card.style.display = texto.includes(termo) ? '' : 'none';
    });
  }

  function limparBusca(tipo) {
    const inputId =
      tipo === 'rotativa'
        ? 'buscaRotativa'
        : 'buscaFlexo';

    const modalId =
      tipo === 'rotativa'
        ? 'modalRotativa'
        : 'modalFlexo';

    const input = document.getElementById(inputId);
    const modal = document.getElementById(modalId);
    const cards = modal.querySelectorAll('.card');

    input.value = '';
    cards.forEach(card => card.style.display = '');
  }

  function normalizarTexto(texto) {
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  function filtrarCards(input, tipo) {
    const termo = normalizarTexto(input.value);

    const modalId =
      tipo === 'rotativa'
        ? 'modalRotativa'
        : 'modalFlexo';

    const modal = document.getElementById(modalId);
    const cards = modal.querySelectorAll('.card');

    cards.forEach(card => {
      const texto = normalizarTexto(card.dataset.search || '');
      card.style.display = texto.includes(termo) ? '' : 'none';
    });
  }

  function limparBusca(tipo) {
    const inputId =
      tipo === 'rotativa'
        ? 'buscaRotativa'
        : 'buscaFlexo';

    const modalId =
      tipo === 'rotativa'
        ? 'modalRotativa'
        : 'modalFlexo';

    const input = document.getElementById(inputId);
    const modal = document.getElementById(modalId);
    const cards = modal.querySelectorAll('.card');

    input.value = '';

    cards.forEach(card => {
      card.style.display = '';
    });
  }

  const formImportar = document.querySelector('form[action="/importar"]');

  if (formImportar) {
    formImportar.addEventListener('submit', function () {

      const modal = new bootstrap.Modal(
        document.getElementById('modalProcessamento')
      );

      modal.show();

      const barra = document.getElementById('barraProgresso');
      const texto = document.getElementById('textoEtapa');

      let progresso = 0;

      const etapas = [
        { valor: 25, texto: "Limpando dados antigos..." },
        { valor: 50, texto: "Processando planilha..." },
        { valor: 75, texto: "Gerando ordens..." },
        { valor: 95, texto: "Finalizando..." }
      ];

      let index = 0;

      const intervalo = setInterval(() => {
        if (index >= etapas.length) {
          clearInterval(intervalo);
          return;
        }

        progresso = etapas[index].valor;
        barra.style.width = progresso + "%";
        texto.innerText = etapas[index].texto;

        index++;
      }, 800);

    });
  }

  function marcarVisualizado(tipo, botao) {

  fetch(\`/notificacao/\${tipo}\`, { method: 'POST' })
    .then(res => res.json())
    .then(data => {
      if (!data.success) return;

      // 🔥 Remove o badge visual sem reload
      const badge = botao.querySelector('.badge');
      if (badge) {
        badge.remove();
      }
    })
    .catch(err => console.error(err));
}
</script>

<footer class="bg-dark text-light py-3 border-top border-secondary footer-fixo">
  <div class="container text-center small text-secondary">
    <span class="text-light fw-semibold">71dev</span> © 2026 —
    Todos os direitos reservados
  </div>
</footer>
</body>
</html>
`;
};


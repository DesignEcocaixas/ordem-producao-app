module.exports = function dashboardView(rotativa, flexo, query = {}) {

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
  </style>
</head>

<body class="bg-light">

<div class="container my-5">

  <!-- TÍTULO -->
  <div class="border rounded p-3 mb-4 text-start">
    <h2 class="mb-0">
      <i class="fa-solid fa-clipboard-list me-2 text-primary"></i>
      Ordens de Produção
    </h2>
  </div>

  <!-- BLOCO DE AÇÕES -->
  <div class="border rounded p-4">

    <div class="d-flex justify-content-center align-items-end gap-3">

  <!-- IMPORTAR / GERAR -->
  <form action="/importar" method="POST" enctype="multipart/form-data"
        class="d-inline-flex align-items-end gap-2">

    <div>
      <label class="form-label mb-1 fw-semibold">
        <i class="fa-solid fa-file-excel me-1 text-success"></i>
        Planilha
      </label>
      <input
        type="file"
        name="planilha"
        accept=".xlsx,.xls"
        class="form-control"
        required
      >
    </div>

    <button class="btn btn-primary px-4">
      <i class="fa-solid fa-file-lines me-1"></i>
      Gerar
    </button>

  </form>

  <!-- LIMPAR -->
  <form action="/limpar" method="POST"
        class="d-inline-flex align-items-end"
        onsubmit="return confirm('Tem certeza que deseja excluir TODOS os cards?')">

    <button class="btn btn-outline-danger px-4">
      <i class="fa-solid fa-trash-can me-1"></i>
      Limpar
    </button>

  </form>

</div>


  </div>

</div>


<!-- BOTÕES PRINCIPAIS -->
<div class="d-flex justify-content-center gap-4 mb-5 flex-wrap">

  <!-- ROTATIVA / PLANA -->
  <button class="btn btn-outline-primary d-flex align-items-center justify-content-center gap-2
                 px-5 py-4"
          style="min-width: 280px;"
          data-bs-toggle="modal"
          data-bs-target="#modalRotativa">

    <i class="fa-solid fa-gears fa-sm"></i>
    <span class="small fw-semibold">Rotativa / Plana</span>

  </button>

  <!-- FLEXOGRÁFICA -->
  <button class="btn btn-outline-success d-flex align-items-center justify-content-center gap-2
                 px-5 py-4"
          style="min-width: 280px;"
          data-bs-toggle="modal"
          data-bs-target="#modalFlexo">

    <i class="fa-solid fa-layer-group fa-sm"></i>
    <span class="small fw-semibold">Flexográfica</span>

  </button>

</div>


<div class="modal fade" id="modalRotativa" tabindex="-1">
  <div class="modal-dialog modal-lg modal-dialog-scrollable modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header bg-primary text-white">
        <h5 class="modal-title">🔵 Produção Rotativa / Plana</h5>
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
        <h5 class="modal-title">🟢 Produção Flexográfica</h5>
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
    <div class="modal-content">
      <div class="modal-header bg-success text-white">
        <h5 class="modal-title">✅ Importação concluída</h5>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body text-center">
        <p class="fs-5 mb-2">
          Planilha importada com sucesso!
        </p>
        <p class="text-muted mb-0">
          As ordens de produção foram geradas corretamente.
        </p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-success" data-bs-dismiss="modal">
          OK
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




<!-- Bootstrap JS -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>

<script>
  const sucesso = ${query.sucesso ? 'true' : 'false'};

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
</script>


</body>
</html>
`;
};

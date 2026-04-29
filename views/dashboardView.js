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
      ? '<span class="badge bg-success-subtle text-success border border-success-subtle">Concluído</span>'
      : '<span class="badge bg-light text-muted border">Pendente</span>';

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
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">

  <style>
    html, body {
        height: 100%;
    }

    /* ========================================================= */
    /* GLOBAL DARK THEME & MOVING GRADIENT SMASH                 */
    /* ========================================================= */
    body {
        margin: 0;
        display: flex;
        flex-direction: column;
        min-height: 100vh;
        background: linear-gradient(-45deg, #050505, #1d0745, #050505, #08295c);
        background-size: 400% 400%;
        animation: smashGradient 15s ease infinite;
        background-attachment: fixed !important;
        color: #e5e5e5 !important;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    @keyframes smashGradient {
        0% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
        100% { background-position: 0% 50%; }
    }

    /* ========================================================= */
    /* TELA DE LOADING (SPINNER)                                 */
    /* ========================================================= */
    #global-loader {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background-color: #0f0f0f;
        z-index: 9999;
        display: flex;
        justify-content: center;
        align-items: center;
        transition: opacity 0.4s ease, visibility 0.4s ease;
    }

    /* ========================================================= */
    /* SOBREPOSIÇÃO DE CLASSES & GLASSMORPHISM                   */
    /* ========================================================= */
    .glass-panel {
        background: rgba(25, 25, 25, 0.4) !important;
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border: 1px solid rgba(255,255,255,0.08) !important;
        border-radius: 24px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
    }

    /* Remove o Glass Panel em telas mobile/tablet até 990px */
    @media (max-width: 990px) {
        .glass-panel {
            background: transparent !important;
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
            border: none !important;
            box-shadow: none !important;
        }
    }

    /* Base para modais e cards limpos */
    .card {
        background-color: rgba(25, 25, 25, 0.5) !important;
        backdrop-filter: blur(12px);
        border: 1px solid rgba(255,255,255,0.08) !important;
        color: #e5e5e5 !important;
    }

    /* Estilo Específico dos Cards de Produção (Clicáveis) */
    .card-producao {
        cursor: pointer;
        transition: background-color 0.2s ease, border-color 0.2s ease;
    }
    .card-producao:hover {
        background-color: rgba(45, 45, 45, 0.5) !important;
    }
    .card-concluido {
        background-color: rgba(25, 135, 84, 0.1) !important;
        border-color: rgba(25, 135, 84, 0.4) !important;
    }
    .card-concluido:hover {
        background-color: rgba(25, 135, 84, 0.15) !important;
    }
    
    /* Fontes menores nos cards */
    .info-sm {
        font-size: 0.82rem;
    }

    .bg-white, .bg-light, .bg-light-subtle { background-color: transparent !important; }
    .text-dark { color: #f8f9fa !important; }
    .text-muted { color: #adb5bd !important; }

    /* Inputs e Selects */
    .form-control, .form-select {
        background-color: rgba(0, 0, 0, 0.4) !important;
        border: 1px solid rgba(255, 255, 255, 0.15) !important;
        color: #fff !important;
    }
    .form-control::placeholder { color: #6c757d !important; }
    .form-control:focus, .form-select:focus {
        background-color: rgba(0, 0, 0, 0.6) !important;
        border-color: #0d6efd !important;
        box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25) !important;
        color: #fff !important;
    }
    .input-group-text {
        background-color: rgba(255,255,255,0.05) !important;
        border: 1px solid rgba(255,255,255,0.15) !important;
        color: #adb5bd !important;
    }

    /* Modais */
    .modal-content {
        background-color: #1a1a1a !important;
        border: 1px solid rgba(255,255,255,0.1) !important;
        color: #e5e5e5 !important;
        box-shadow: 0 10px 40px rgba(0,0,0,0.8) !important;
        backdrop-filter: blur(20px);
    }
    .modal-header { border-bottom: 1px solid rgba(255,255,255,0.05) !important; }
    .modal-footer { border-top: 1px solid rgba(255,255,255,0.05) !important; background-color: transparent !important; }
    .btn-close { filter: invert(1) grayscale(100%) brightness(200%); }

    /* Badges */
    .badge.bg-light { background-color: rgba(255,255,255,0.1) !important; color: #f8f9fa !important; border-color: rgba(255,255,255,0.2) !important; }
    .bg-success-subtle { background-color: rgba(25, 135, 84, 0.2) !important; color: #75b798 !important; border-color: rgba(25, 135, 84, 0.3) !important; }

    /* ========================================= */
    /* ANIMAÇÕES DE ENTRADA (CARREGAMENTO)       */
    /* ========================================= */
    .animate-up { 
        animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) backwards; 
    }
    @keyframes fadeInUp {
        0% { opacity: 0; transform: translateY(30px); }
        100% { opacity: 1; transform: translateY(0); }
    }
    
    .animate-modal { 
        animation: zoomIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) backwards; 
    }
    @keyframes zoomIn {
        0% { opacity: 0; transform: scale(0.95); }
        100% { opacity: 1; transform: scale(1); }
    }

    .footer-fixo {
        position: fixed;
        bottom: 0;
        left: 0;
        width: 100%;
        z-index: 1000;
        background-color: transparent !important;
        backdrop-filter: blur(5px);
        border-top: 1px solid rgba(255,255,255,0.05) !important;
    }

    .sucesso-icone {
        width: 90px;
        height: 90px;
        margin: 0 auto;
        border-radius: 50%;
        background: rgba(25, 135, 84, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        animation: popSucesso 0.4s ease;
    }
    .sucesso-icone i { font-size: 48px; color: #20c997; }
    @keyframes popSucesso { 0% { transform: scale(0.5); opacity: 0; } 70% { transform: scale(1.1); } 100% { transform: scale(1); opacity: 1; } }

    .erro-icone {
        width: 90px;
        height: 90px;
        margin: 0 auto;
        border-radius: 50%;
        background: rgba(220, 53, 69, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        animation: popErro 0.4s ease;
    }
    .erro-icone i { font-size: 48px; color: #ea868f; }
    @keyframes popErro { 0% { transform: scale(0.5); opacity: 0; } 70% { transform: scale(1.1); } 100% { transform: scale(1); opacity: 1; } }

    /* ========================================= */
    /* BOTÃO FLUTUANTE DE AJUDA                  */
    /* ========================================= */
    .btn-floating-help {
        position: fixed;
        bottom: 70px;
        right: 30px;
        width: 55px;
        height: 55px;
        border-radius: 50%;
        background-color: #0d6efd;
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
        z-index: 1050;
        border: 2px solid rgba(255,255,255,0.2);
        cursor: pointer;
        transition: transform 0.2s ease, background-color 0.2s ease;
    }
    .btn-floating-help:hover {
        transform: scale(1.1);
        background-color: #0b5ed7;
        color: #fff;
    }
    @media (max-width: 576px) {
        .btn-floating-help {
            bottom: 60px;
            right: 20px;
            width: 50px;
            height: 50px;
            font-size: 1.25rem;
        }
    }
  </style>
</head>

<body>

<div id="global-loader">
  <div class="spinner-border text-primary" style="width: 4rem; height: 4rem;" role="status">
    <span class="visually-hidden">Carregando...</span>
  </div>
</div>

<div class="flex-grow-1 d-flex flex-column justify-content-center align-items-center mb-5 pb-5">

<div class="container position-relative animate-up" style="z-index:1; max-width: 1100px;">

  <div class="glass-panel p-4 p-md-5">
      <div class="row align-items-center g-5">

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

        <div class="col-lg-6">
            <h5 class="fw-bold text-light mb-4">
              <i class="fa-solid fa-cloud-arrow-up me-2 text-primary"></i> Gerenciar Produção
            </h5>

            <form action="/importar" method="POST" enctype="multipart/form-data" class="mb-4" id="formImportacao">

              <label class="form-label text-muted small fw-bold text-uppercase">
                Selecionar Planilha
              </label>

              <input
                type="file"
                name="planilha"
                accept=".xlsx,.xls"
                class="form-control mb-4"
                required
              >

              <div class="d-flex flex-column flex-sm-row gap-3">
                <button type="submit" class="btn btn-primary fw-bold flex-fill">
                  Gerar Ordens
                </button>
                
                <button type="button" class="btn btn-outline-danger fw-bold flex-fill" data-bs-toggle="modal" data-bs-target="#modalExcluir">
                  Limpar
                </button>
              </div>
            </form>

            <div class="d-flex flex-column flex-sm-row gap-3 flex-wrap">
              <button class="btn btn-outline-primary flex-fill py-3 position-relative fw-bold"
                      data-bs-toggle="modal"
                      data-bs-target="#modalRotativa"
                      onclick="marcarVisualizado('rotativa', this)">
                <i class="fa-solid fa-gear me-2"></i> Rotativa / Plana
                ${rotativaNovas > 0 ? `
                  <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                    ${rotativaNovas}
                  </span>
                ` : ''}
              </button>

              <button class="btn btn-outline-success flex-fill py-3 position-relative fw-bold"
                      data-bs-toggle="modal"
                      data-bs-target="#modalFlexo"
                      onclick="marcarVisualizado('flexografica', this)">
                <i class="fa-solid fa-layer-group me-2"></i> Flexográfica
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

</div>

<button class="btn-floating-help" data-bs-toggle="modal" data-bs-target="#modalInstrucoes" title="Como usar o sistema">
  <i class="fa-solid fa-info"></i>
</button>

<div class="modal fade" id="modalInstrucoes" tabindex="-1">
  <div class="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
    <div class="modal-content border-0 shadow-lg animate-modal">
      <div class="modal-header bg-dark text-white border-0">
        <h5 class="modal-title fw-bold">
          <i class="fa-solid fa-circle-info text-primary me-2"></i>Como usar o sistema
        </h5>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body p-4 bg-light-subtle">
        <ul class="list-group list-group-flush bg-transparent">
          <li class="list-group-item bg-transparent text-light border-secondary py-3">
            <h6 class="fw-bold">1. Importando as Ordens</h6>
            <p class="mb-0 text-muted small">Clique no botão "Selecionar Planilha", escolha seu arquivo Excel (.xlsx ou .xls) e clique em "Gerar Ordens". O sistema lerá os dados e fará a separação automática entre Rotativa/Plana e Flexográfica.</p>
          </li>
          <li class="list-group-item bg-transparent text-light border-secondary py-3">
            <h6 class="fw-bold">2. Acompanhamento</h6>
            <p class="mb-0 text-muted small">Clique nos botões "Rotativa / Plana" ou "Flexográfica" para ver as ordens separadas. Se houverem ordens novas não visualizadas, um aviso vermelho indicará a quantidade.</p>
          </li>
          <li class="list-group-item bg-transparent text-light border-secondary py-3">
            <h6 class="fw-bold">3. Atualizando Status da Produção</h6>
            <p class="mb-0 text-muted small">Dentro da listagem, você pode pesquisar por ordens usando a barra de busca. Para marcar uma ordem como "Concluída", basta <strong>clicar no card</strong> referente a ela. O card ficará verde. Clique novamente se quiser desfazer.</p>
          </li>
          <li class="list-group-item bg-transparent text-light border-secondary py-3">
            <h6 class="fw-bold">4. Exportação</h6>
            <p class="mb-0 text-muted small">Na tela das ordens (Rotativa ou Flexo), clique em "Baixar" para gerar e fazer o download de um arquivo Excel limpo e formatado contendo a listagem que está na tela.</p>
          </li>
          <li class="list-group-item bg-transparent text-light border-0 py-3">
            <h6 class="fw-bold">5. Limpeza Total</h6>
            <p class="mb-0 text-muted small">Ao fim de um ciclo de produção, você pode clicar em "Limpar" na tela inicial para remover todas as ordens do banco de dados e preparar o sistema para a próxima remessa de importação.</p>
          </li>
        </ul>
      </div>
      <div class="modal-footer border-0 bg-transparent justify-content-end">
        <button class="btn btn-primary fw-bold px-4" data-bs-dismiss="modal">Entendi</button>
      </div>
    </div>
  </div>
</div>


<div class="modal fade" id="modalRotativa" tabindex="-1">
  <div class="modal-dialog modal-lg modal-dialog-scrollable modal-dialog-centered">
    <div class="modal-content border-0 shadow-lg animate-modal">
      <div class="modal-header bg-dark text-white border-0">
        <h5 class="modal-title fw-bold"><i class="fa-solid fa-gear text-primary me-2"></i> Produção Rotativa / Plana</h5>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
      </div>

      <div class="modal-body p-3 p-md-4 bg-light-subtle">

        <div class="d-flex flex-column flex-sm-row gap-2 mb-4">
          <div class="input-group flex-fill">
            <input
              type="text"
              class="form-control"
              placeholder="Buscar por cliente, vendedor, modelo..."
              oninput="filtrarCards(this, 'rotativa')"
              id="buscaRotativa">
            <button
              class="btn btn-outline-secondary"
              type="button"
              onclick="limparBusca('rotativa')"
              title="Limpar busca">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
          <a href="/exportar/rotativa" class="btn btn-outline-primary fw-bold text-nowrap">
            <i class="fa-solid fa-download me-1"></i> Baixar
          </a>
        </div>

        ${rotativa.length === 0 ? `
          <p class="text-center text-muted py-4"><i class="fa-solid fa-folder-open fa-2x mb-2 text-secondary"></i><br>Nenhum item para rotativa.</p>
        ` : rotativa.map(r => `
          <div class="card card-producao mb-2 border-start ${r.status_producao === 'concluido' ? 'card-concluido border-success' : 'border-primary'} border-4"
               onclick="alterarStatus('rotativa', ${r.id}, this)"
               data-search="
                 ${r.cliente}
                 ${r.vendedor}
                 ${r.modelo}
                 ${r.tamanho}
                 ${textoStatus(r.status_producao)}
               ">

            <div class="card-body py-2 px-3">
              <div class="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2">
                <div>
                  <strong class="fs-6 text-light">${r.cliente}</strong><br>

                  <div class="text-muted info-sm mt-1">
                    <i class="fa-solid fa-user-tie me-1"></i>Vendedor: <span class="text-light">${r.vendedor || '—'}</span> &nbsp;|&nbsp;
                    <i class="fa-solid fa-box me-1"></i>Modelo: <span class="text-light">${modeloComTamanho(r.modelo)}</span><br>
                    <i class="fa-solid fa-ruler-combined me-1"></i>Tamanho: <span class="text-light">${modeloComTamanho(r.tamanho)}</span> &nbsp;|&nbsp;
                    <i class="fa-solid fa-hashtag me-1"></i>QTD: <span class="text-light fw-bold">${r.quantidade}</span>
                  </div>
                </div>

                <div class="text-start text-sm-end">
                  ${badgeStatus(r.status_producao)}
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
    <div class="modal-content border-0 shadow-lg animate-modal">
      <div class="modal-header bg-dark text-white border-0">
        <h5 class="modal-title fw-bold"><i class="fa-solid fa-layer-group text-success me-2"></i> Produção Flexográfica</h5>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
      </div>

      <div class="modal-body p-3 p-md-4 bg-light-subtle">

        <div class="d-flex flex-column flex-sm-row gap-2 mb-4">
          <div class="input-group flex-fill">
            <input
              type="text"
              class="form-control"
              placeholder="Buscar por cliente, vendedor, modelo, cor..."
              oninput="filtrarCards(this, 'flexo')"
              id="buscaFlexo">
            <button
              class="btn btn-outline-secondary"
              type="button"
              onclick="limparBusca('flexo')"
              title="Limpar busca">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
          <a href="/exportar/flexografica" class="btn btn-outline-success fw-bold text-nowrap">
            <i class="fa-solid fa-download me-1"></i> Baixar
          </a>
        </div>

        ${flexo.length === 0 ? `
          <p class="text-center text-muted py-4"><i class="fa-solid fa-folder-open fa-2x mb-2 text-secondary"></i><br>Nenhum item para flexográfica.</p>
        ` : flexo.map(f => `
          <div class="card card-producao mb-2 border-start ${f.status_producao === 'concluido' ? 'card-concluido border-success' : 'border-success'} border-4" 
               onclick="alterarStatus('flexografica', ${f.id}, this)"
               data-search="
                 ${f.cliente}
                 ${f.vendedor}
                 ${f.modelo}
                 ${f.tamanho}
                 ${f.material}
                 ${f.cor_personalizacao}
                 ${textoStatus(f.status_producao)}
               ">

            <div class="card-body py-2 px-3">
              <div class="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2">
                <div>
                  <strong class="fs-6 text-light">${f.cliente}</strong><br>

                  <div class="text-muted info-sm mt-1">
                    <i class="fa-solid fa-user-tie me-1"></i>Vendedor: <span class="text-light">${f.vendedor || '—'}</span> &nbsp;|&nbsp;
                    <i class="fa-solid fa-box me-1"></i>Modelo: <span class="text-light">${modeloComTamanho(f.modelo)}</span><br>
                    <i class="fa-solid fa-ruler-combined me-1"></i>Tam: <span class="text-light">${modeloComTamanho(f.tamanho)}</span> &nbsp;|&nbsp;
                    <i class="fa-solid fa-layer-group me-1"></i>Mat: <span class="text-light">${f.material || ''}</span> &nbsp;|&nbsp;
                    <i class="fa-solid fa-palette text-muted me-1"></i><span class="text-light">${f.qtd_cores || 0} cor(es)</span><br>
                    <i class="fa-solid fa-fill-drip me-1"></i>Cor: <span class="text-light">${formatarCor(f.cor_personalizacao)}</span> &nbsp;|&nbsp;
                    <i class="fa-solid fa-hashtag me-1"></i>QTD: <span class="text-light fw-bold">${f.quantidade}</span>
                  </div>

                  <small class="text-info mt-1 d-block" style="font-size: 0.75rem;">
                    <i class="fa-solid fa-clipboard-check me-1"></i>${f.status_pedido || ''}
                  </small>
                </div>

                <div class="text-start text-sm-end">
                  ${badgeStatus(f.status_producao)}
                </div>
              </div>

            </div>
          </div>
        `).join('')}
      </div>
    </div>
  </div>
</div>

<div class="modal fade" id="modalSucesso" tabindex="-1">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content border-0 shadow-lg animate-modal">
      <div class="modal-header bg-dark text-white border-0">
        <h5 class="modal-title fw-bold">
          <i class="fa-solid fa-circle-check text-success me-2"></i>
          Importação concluída
        </h5>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body text-center py-4">
        <div class="mb-3">
          <div class="sucesso-icone">
            <i class="fa-solid fa-circle-check"></i>
          </div>
        </div>
        <p class="fs-5 fw-bold text-light mb-2">
          Planilha importada com sucesso!
        </p>
        <p class="text-muted mb-0">
          As ordens de produção foram geradas corretamente.
        </p>
      </div>
      <div class="modal-footer border-0 bg-transparent justify-content-center pb-4">
        <button class="btn btn-success fw-bold px-4" data-bs-dismiss="modal">
          OK
        </button>
      </div>
    </div>
  </div>
</div>

<div class="modal fade" id="modalLimpeza" tabindex="-1">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content border-0 shadow-lg animate-modal">
      <div class="modal-header bg-dark text-white border-0">
        <h5 class="modal-title fw-bold">
          <i class="fa-solid fa-broom text-success me-2"></i>
          Limpeza concluída
        </h5>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body text-center py-4">
        <div class="mb-3">
          <div class="sucesso-icone">
            <i class="fa-solid fa-broom"></i>
          </div>
        </div>
        <p class="fs-5 fw-bold text-light mb-2">
          Ordens removidas com sucesso!
        </p>
        <p class="text-muted mb-0">
          O painel de produção foi totalmente limpo.
        </p>
      </div>
      <div class="modal-footer border-0 bg-transparent justify-content-center pb-4">
        <button class="btn btn-success fw-bold px-4" data-bs-dismiss="modal">
          OK
        </button>
      </div>
    </div>
  </div>
</div>

<div class="modal fade" id="modalErro" tabindex="-1">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content border-0 shadow-lg animate-modal">
      <div class="modal-header bg-dark text-white border-0">
        <h5 class="modal-title fw-bold">
          <i class="fa-solid fa-triangle-exclamation text-danger me-2"></i>
          Erro na planilha
        </h5>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body text-center py-4">
        <div class="mb-3">
          <div class="erro-icone">
            <i class="fa-solid fa-circle-xmark"></i>
          </div>
        </div>
        <p class="fs-5 fw-bold text-light mb-2">
          A planilha enviada é incompatível.
        </p>
        <p class="text-muted mb-0">
          Verifique se está usando o modelo correto e tente novamente.
        </p>
      </div>
      <div class="modal-footer border-0 bg-transparent justify-content-center pb-4">
        <button class="btn btn-danger fw-bold px-4" data-bs-dismiss="modal">
          Entendido
        </button>
      </div>
    </div>
  </div>
</div>

<div class="modal fade" id="modalExcluir" tabindex="-1">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content border-0 shadow-lg animate-modal">

      <div class="modal-header bg-dark text-white border-0">
        <h5 class="modal-title fw-bold"><i class="fa-solid fa-trash-can text-danger me-2"></i>Confirmar exclusão</h5>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
      </div>

      <div class="modal-body p-4 text-center">
        <p class="fs-5 text-light mb-2">
          Tem certeza que deseja excluir <strong>todas as ordens</strong>?
        </p>
        <p class="text-muted mb-0">
          Essa ação não poderá ser desfeita e todo o painel será limpo.
        </p>
      </div>

      <div class="modal-footer border-0 bg-transparent d-flex flex-column flex-sm-row gap-2">
        <form action="/limpar" method="POST" class="m-0 flex-fill d-flex">
          <button type="submit" class="btn btn-danger fw-bold w-100">
            Excluir
          </button>
        </form>

        <button type="button"
                class="btn btn-secondary fw-bold flex-fill m-0"
                data-bs-dismiss="modal">
          Cancelar
        </button>
      </div>

    </div>
  </div>
</div>

<div class="modal fade" id="modalProcessamento" tabindex="-1" data-bs-backdrop="static" data-bs-keyboard="false">
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content border-0 shadow-lg animate-modal">
      <div class="modal-header bg-dark text-white border-0">
        <h5 class="modal-title fw-bold">
          <i class="fa-solid fa-gear fa-spin text-primary me-2"></i>
          Processando Planilha
        </h5>
      </div>
      <div class="modal-body p-4">
        <p id="textoEtapa" class="fw-bold text-light mb-3 text-center">
          Iniciando...
        </p>
        <div class="progress" style="height: 20px; border-radius: 20px; background-color: rgba(255,255,255,0.05);">
          <div id="barraProgresso"
               class="progress-bar bg-primary progress-bar-striped progress-bar-animated"
               role="progressbar"
               style="width: 0%">
          </div>
        </div>
      </div>
    </div>
  </div>
</div>


<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>

<script>
  // =========================================
  // REMOÇÃO DO LOADING APÓS CARREGAMENTO
  // =========================================
  window.addEventListener('load', function () {
    const loader = document.getElementById('global-loader');
    if (loader) {
      loader.style.opacity = '0';
      loader.style.visibility = 'hidden';
      setTimeout(() => {
        loader.style.display = 'none';
      }, 400); 
    }
  });

  const sucesso = ${query.sucesso ? 'true' : 'false'};
  const limpo = ${query.limpo ? 'true' : 'false'};
  const erroPlanilha = ${query.erro === 'planilha' ? 'true' : 'false'};

  function fecharModalEUrl(modalElement, parametroUrl) {
    modalElement.addEventListener('hidden.bs.modal', function () {
      document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
      document.body.classList.remove('modal-open');
      document.body.style = '';
    });

    if (window.history.replaceState) {
      const url = new URL(window.location);
      url.searchParams.delete(parametroUrl);
      window.history.replaceState({}, document.title, url.pathname);
    }
  }

  if (sucesso) {
    const modalElement = document.getElementById('modalSucesso');
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
    fecharModalEUrl(modalElement, 'sucesso');
  }

  // 🔥 GATILHO DO NOVO MODAL DE LIMPEZA
  if (limpo) {
    const modalElement = document.getElementById('modalLimpeza');
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
    fecharModalEUrl(modalElement, 'limpo');
  }

  if (erroPlanilha) {
    const modalErro = new bootstrap.Modal(document.getElementById('modalErro'));
    modalErro.show();
  }

  function normalizarTexto(texto) {
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\\u0300-\\u036f]/g, '');
  }

  function alterarStatus(tipo, id, card) {
    fetch(\`/status/\${tipo}/\${id}\`, { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        if (!data.success) return;

        const badge = card.querySelector('.badge');

        if (data.status === 'concluido') {
          badge.className = 'badge bg-success-subtle text-success border border-success-subtle';
          badge.innerText = 'Concluído';
          card.classList.add('card-concluido');
          
          if(tipo === 'rotativa') {
              card.classList.replace('border-primary', 'border-success');
          }
        } else {
          badge.className = 'badge bg-light text-muted border';
          badge.innerText = 'Pendente';
          card.classList.remove('card-concluido');

          if(tipo === 'rotativa') {
              card.classList.replace('border-success', 'border-primary');
          }
        }

        let search = card.dataset.search || '';
        search = search.replace(/pendente|concluido|concluído/gi, '').trim();
        const novoStatus = data.status === 'concluido' ? 'concluído' : 'pendente';
        card.dataset.search = \`\${search} \${novoStatus}\`;
      })
      .catch(err => console.error(err));
  }

  function filtrarCards(input, tipo) {
    const termo = normalizarTexto(input.value);
    const modalId = tipo === 'rotativa' ? 'modalRotativa' : 'modalFlexo';
    const modal = document.getElementById(modalId);
    const cards = modal.querySelectorAll('.card');

    cards.forEach(card => {
      const texto = normalizarTexto(card.dataset.search || '');
      card.style.display = texto.includes(termo) ? '' : 'none';
    });
  }

  function limparBusca(tipo) {
    const inputId = tipo === 'rotativa' ? 'buscaRotativa' : 'buscaFlexo';
    const modalId = tipo === 'rotativa' ? 'modalRotativa' : 'modalFlexo';

    const input = document.getElementById(inputId);
    const modal = document.getElementById(modalId);
    const cards = modal.querySelectorAll('.card');

    input.value = '';
    cards.forEach(card => card.style.display = '');
  }

  const formImportar = document.getElementById('formImportacao');

  if (formImportar) {
    formImportar.addEventListener('submit', function () {
      const modal = new bootstrap.Modal(document.getElementById('modalProcessamento'));
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
        const badge = botao.querySelector('.badge');
        if (badge) badge.remove();
      })
      .catch(err => console.error(err));
  }
</script>

<footer class="text-light py-2 footer-fixo">
  <div class="container text-center small text-secondary">
    <span class="text-light fw-bold">Desenvolvido por 71dev</span> © 2026 —
    <a href="https://www.instagram.com/71dev" target="_blank" class="text-secondary text-decoration-none ms-1"><i class="fa-brands fa-instagram"></i></a>
  </div>
</footer>
</body>
</html>
`;
};
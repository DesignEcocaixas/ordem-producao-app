const express = require('express');
const app = express();
const db = require('./db');
const path = require('path');
const { exec } = require('child_process');
const ExcelJS = require('exceljs');
const multer = require('multer');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/public', express.static(path.join(__dirname, 'public')));

const upload = multer({
  dest: path.join(__dirname, 'uploads'),
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    if (ext !== '.xlsx' && ext !== '.xls') {
      return cb(new Error('Apenas arquivos Excel são permitidos'));
    }
    cb(null, true);
  }
});

app.get('/', async (req, res) => {
  try {
    const [rotativa] = await db.query(
      'SELECT * FROM pedidos_rotativa ORDER BY created_at DESC'
    );

    const [flexo] = await db.query(
      'SELECT * FROM pedidos_flexografica ORDER BY created_at DESC'
    );

    const [[rotativaNovas]] = await db.query(
      'SELECT COUNT(*) as total FROM pedidos_rotativa WHERE notificado = 1'
    );

    const [[flexoNovas]] = await db.query(
      'SELECT COUNT(*) as total FROM pedidos_flexografica WHERE notificado = 1'
    );

    res.send(
      require('./views/dashboardView')(
        rotativa,
        flexo,
        req.query,
        rotativaNovas.total,
        flexoNovas.total
      )
    );

  } catch (err) {
    console.error('[ERRO DASHBOARD]', err);
    res.status(500).send('Erro ao carregar dashboard');
  }
});

app.post('/notificacao/:tipo', async (req, res) => {
  const tipo = req.params.tipo;

  try {
    if (tipo === 'rotativa') {
      await db.query('UPDATE pedidos_rotativa SET notificado = 0');
    }

    if (tipo === 'flexografica') {
      await db.query('UPDATE pedidos_flexografica SET notificado = 0');
    }

    res.json({ success: true });

  } catch (err) {
    console.error('[ERRO NOTIFICACAO]', err);
    res.json({ success: false });
  }
});


app.post('/importar', upload.single('planilha'), async (req, res) => {
  try {

    if (!req.file) {
      return res.redirect('/?erro=arquivo');
    }

    const caminhoArquivo = req.file.path;

    exec(`python3 app.py "${caminhoArquivo}"`, async (error, stdout, stderr) => {

      console.log('----- PYTHON STDOUT -----');
      console.log(stdout);

      console.log('----- PYTHON STDERR -----');
      console.log(stderr);

      // ❌ Se Python retornar erro
      if (error || stdout.includes("Erro:")) {

        console.error('----- ERRO NA IMPORTAÇÃO -----');
        console.error(error || stdout);

        try {
          // 🔥 LIMPA APENAS SE DER ERRO
          await db.query('TRUNCATE TABLE pedidos_rotativa');
          await db.query('TRUNCATE TABLE pedidos_flexografica');

          console.log('[ROLLBACK] Dados removidos devido a erro na planilha');
        } catch (dbError) {
          console.error('[ERRO AO LIMPAR APÓS FALHA]', dbError);
        }

        return res.redirect('/?erro=planilha');
      }

      // ✅ SUCESSO (não limpa nada)
      return res.redirect('/?sucesso=1');

    });

  } catch (err) {
    console.error('[ERRO IMPORTAÇÃO]', err);
    res.redirect('/?erro=importacao');
  }
});

app.post('/limpar', async (req, res) => {
  try {
    await db.query('TRUNCATE TABLE pedidos_rotativa');
    await db.query('TRUNCATE TABLE pedidos_flexografica');

    console.log('[LIMPEZA] Todos os pedidos foram removidos');

    res.redirect('/');
  } catch (err) {
    console.error('[ERRO LIMPEZA]', err);
    res.status(500).send('Erro ao limpar os dados');
  }
});

app.get('/exportar/rotativa', async (req, res) => {
  try {
    const [dados] = await db.query(`
      SELECT cliente, vendedor, modelo, tamanho, quantidade, previsao_faturamento
      FROM pedidos_rotativa
      ORDER BY 
        modelo,
        CAST(REGEXP_REPLACE(tamanho, '[^0-9]', '') AS UNSIGNED),
        cliente
    `);

    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Rotativa');

    sheet.columns = [
      { header: 'MODELO', key: 'modelo', width: 25 },
      { header: 'TAMANHO', key: 'tamanho', width: 12 },
      { header: 'CLIENTE', key: 'cliente', width: 30 },
      { header: 'QUANTIDADE', key: 'quantidade', width: 15 },
      { header: 'VENDEDOR', key: 'vendedor', width: 25 },
      { header: 'DATA', key: 'previsao_faturamento', width: 15 },
      { header: 'OPERADOR', key: 'operador', width: 20 } // 👈 NOVA COLUNA
    ];

    let modeloAtual = null;
    let tamanhoAtual = null;

    dados.forEach(d => {

      if (modeloAtual !== null && modeloAtual !== d.modelo) {
        sheet.addRow({});
        sheet.addRow({});
      }

      if (
        tamanhoAtual !== null &&
        tamanhoAtual !== d.tamanho &&
        modeloAtual === d.modelo
      ) {
        sheet.addRow({});
      }

      sheet.addRow({
        modelo: modeloAtual === d.modelo ? '' : d.modelo,
        tamanho:
          tamanhoAtual === d.tamanho && modeloAtual === d.modelo
            ? ''
            : d.tamanho,
        cliente: d.cliente,
        quantidade: d.quantidade,
        vendedor: d.vendedor,
        previsao_faturamento: d.previsao_faturamento
          ? new Date(d.previsao_faturamento)
          : null,
        operador: '' // 👈 vazio para preenchimento manual
      });

      modeloAtual = d.modelo;
      tamanhoAtual = d.tamanho;
    });

    // =========================
    // ESTILIZAÇÃO
    // =========================

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

    sheet.getColumn('modelo').alignment = { horizontal: 'center' };
    sheet.getColumn('tamanho').alignment = { horizontal: 'center' };

    sheet.getColumn('previsao_faturamento').numFmt = 'dd/mm/yyyy';
    sheet.getColumn('previsao_faturamento').alignment = { horizontal: 'center' };

    sheet.getColumn('operador').alignment = { horizontal: 'left' };

    // =========================

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );

    res.setHeader(
      'Content-Disposition',
      'attachment; filename=relatorio-rotativa.xlsx'
    );

    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error('[ERRO EXPORTAR ROTATIVA]', err);
    res.status(500).send('Erro ao gerar planilha');
  }
});


app.get('/exportar/flexografica', async (req, res) => {
  const [dados] = await db.query(
    `SELECT cliente, vendedor, modelo, tamanho, material,
       qtd_cores, cor_personalizacao, quantidade,
       status_pedido, previsao_faturamento
    FROM pedidos_flexografica
    ORDER BY cliente`
  );

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Flexografica');

  sheet.columns = [
    { header: 'CLIENTE', key: 'cliente', width: 30 },
    { header: 'VENDEDOR', key: 'vendedor', width: 20 },
    { header: 'MODELO', key: 'modelo', width: 20 },
    { header: 'TAMANHO', key: 'tamanho', width: 8.5 },
    { header: 'MATERIAL', key: 'material', width: 15 },
    { header: 'QTD CORES', key: 'qtd_cores', width: 9 },
    { header: 'COR PERSONALIZAÇÃO', key: 'cor_personalizacao', width: 25 },
    { header: 'QTD', key: 'quantidade', width: 10 },
    { header: 'STATUS', key: 'status_pedido', width: 25 },
    { header: 'PREV. FATURAMENTO', key: 'previsao_faturamento', width: 25 }
  ];

  let clienteAnterior = null;

  dados.forEach(d => {
    if (clienteAnterior && d.cliente !== clienteAnterior) {
      sheet.addRow({});
    }

    sheet.addRow({
      ...d,
      operador: '' // 👈 força sair vazio
    });

    clienteAnterior = d.cliente;
  });

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    'attachment; filename=flexografica.xlsx'
  );

  await workbook.xlsx.write(res);
  res.end();
});

/* ---------- ALTERAR STATUS DO CARD (AJAX | CORRETO) ---------- */
app.post('/status/:tipo/:id', async (req, res) => {
  const { tipo, id } = req.params;

  const tabela =
    tipo === 'rotativa'
      ? 'pedidos_rotativa'
      : 'pedidos_flexografica';

  try {
    // 1️⃣ Atualiza o status
    const [updateResult] = await db.query(
      `
      UPDATE ${tabela}
      SET status_producao =
        CASE
          WHEN status_producao = 'pendente' THEN 'concluido'
          ELSE 'pendente'
        END
      WHERE id = ?
      `,
      [id]
    );

    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ success: false });
    }

    // 2️⃣ Busca o novo status (SEM CALLBACK)
    const [rows] = await db.query(
      `SELECT status_producao FROM ${tabela} WHERE id = ?`,
      [id]
    );

    res.json({
      success: true,
      status: rows[0].status_producao
    });

  } catch (err) {
    console.error('[ERRO STATUS]', err);
    res.status(500).json({ success: false });
  }
});

/* ---------- SERVIDOR ---------- */
app.listen(3051, () => {
  console.log('🔥 Sistema rodando em http://localhost:3051');
});

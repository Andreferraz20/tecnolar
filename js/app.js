/* ==========================================================
   TECNOLAR: dados compartilhados (localStorage)

   Não tem back-end, então esse arquivo faz as vezes de banco
   de dados: usuários, chamados e sessão de quem tá logado.
   Toda página que precisa desses dados inclui esse arquivo
   antes do próprio script dela.
   ========================================================== */

const TecnolarDB = {
  CHAVES: {
    usuarios: "tecnolar_usuarios",
    chamados: "tecnolar_chamados",
    sessao: "tecnolar_sessao",
    empresa: "tecnolar_empresa",
    rascunho: "tecnolar_rascunho_chamado",
    ultimoChamado: "tecnolar_ultimo_chamado",
  },

  _ler(chave, padrao) {
    try {
      const bruto = localStorage.getItem(chave);
      return bruto ? JSON.parse(bruto) : padrao;
    } catch (e) {
      return padrao;
    }
  },

  _salvar(chave, valor) {
    localStorage.setItem(chave, JSON.stringify(valor));
  },

  gerarId(prefixo) {
    return prefixo + Math.random().toString(36).slice(2, 8);
  },

  // ---------- usuários ----------
  listarUsuarios() {
    return this._ler(this.CHAVES.usuarios, []);
  },

  salvarUsuario(usuario) {
    const usuarios = this.listarUsuarios();
    usuario.id = usuario.id || this.gerarId("u_");
    usuarios.push(usuario);
    this._salvar(this.CHAVES.usuarios, usuarios);
    return usuario;
  },

  buscarUsuarioPorEmail(email) {
    return this.listarUsuarios().find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
  },

  // O login do sistema usa esse campo (6 letras), não o e-mail.
  // E-mail é só contato mesmo.
  buscarUsuarioPorLogin(login) {
    return this.listarUsuarios().find(
      (u) => (u.login || "").toLowerCase() === (login || "").toLowerCase()
    );
  },

  buscarUsuarioPorId(id) {
    return this.listarUsuarios().find((u) => u.id === id);
  },

  // ---------- empresa (preenchida no setup inicial) ----------
  getEmpresa() {
    return this._ler(this.CHAVES.empresa, null);
  },

  salvarEmpresa(empresa) {
    this._salvar(this.CHAVES.empresa, empresa);
  },

  // ---------- sessão ----------
  login(usuarioId) {
    this._salvar(this.CHAVES.sessao, { usuarioId });
  },

  logout() {
    localStorage.removeItem(this.CHAVES.sessao);
  },

  sessaoAtual() {
    const sessao = this._ler(this.CHAVES.sessao, null);
    if (!sessao) return null;
    return this.buscarUsuarioPorId(sessao.usuarioId) || null;
  },

  // ---------- rascunho do chamado (passos 1→2→3) ----------
  getRascunho() {
    return this._ler(this.CHAVES.rascunho, {});
  },

  salvarRascunho(parcial) {
    const atual = this.getRascunho();
    const novo = Object.assign(atual, parcial);
    this._salvar(this.CHAVES.rascunho, novo);
    return novo;
  },

  limparRascunho() {
    localStorage.removeItem(this.CHAVES.rascunho);
  },

  // ---------- chamados ----------
  listarChamados() {
    return this._ler(this.CHAVES.chamados, []);
  },

  buscarChamado(id) {
    return this.listarChamados().find((c) => c.id === id);
  },

  salvarChamado(chamado) {
    const chamados = this.listarChamados();
    const indice = chamados.findIndex((c) => c.id === chamado.id);
    if (indice >= 0) {
      chamados[indice] = chamado;
    } else {
      chamado.id = chamado.id || this.gerarId("c_");
      chamados.push(chamado);
    }
    this._salvar(this.CHAVES.chamados, chamados);
    return chamado;
  },

  proximoNumeroChamado() {
    const chamados = this.listarChamados();
    const maior = chamados.reduce((m, c) => Math.max(m, c.numero || 0), 4800);
    return maior + 1;
  },

  // ---------- distribuição de técnico ----------
  // Cada tipo de aparelho vira uma "tag" de especialidade, e é por
  // essa tag que o chamado casa com quem sabe consertar aquilo.
  tagDoAparelho(aparelho) {
    const a = (aparelho || "").toLowerCase();
    if (a.includes("geladeira") || a.includes("freezer") || a.includes("frigobar")) return "refrigeração";
    if (a.includes("lava") || a.includes("secadora")) return "lavanderia";
    if (a.includes("fogão") || a.includes("fogao") || a.includes("cooktop") || a.includes("forno")) return "cocção";
    if (a.includes("ar-condicionado") || a.includes("ar condicionado") || a.includes("split")) return "climatização";
    return null;
  },

  listarTecnicosAprovados() {
    return this.listarUsuarios().filter((u) => u.tipo === "tecnico" && u.status === "aprovado");
  },

  // Tenta achar um técnico aprovado com a especialidade certa pro
  // aparelho do chamado. Por enquanto só olha isso, não o bairro
  // (primeira versão da distribuição automática, dá pra melhorar
  // depois). Se não achar ninguém, o chamado fica "sem técnico"
  // esperando alguém do admin atribuir na mão.
  sugerirTecnico(aparelho) {
    const tag = this.tagDoAparelho(aparelho);
    const tecnicos = this.listarTecnicosAprovados();
    if (!tag) return null;
    return tecnicos.find((t) => (t.especialidades || []).includes(tag)) || null;
  },

  // Usada tanto na distribuição automática (passo 3) quanto no botão
  // "Atribuir/Reatribuir técnico" do painel admin.
  atribuirTecnico(chamado, tecnico, modo) {
    chamado.tecnicoId = tecnico.id;
    chamado.equipe = tecnico.equipe;
    // Atribuir só bota o chamado na fila do técnico. "Em rota" é
    // outro passo, decidido pelo andamento real do atendimento.
    if (chamado.status === "novo") chamado.status = "fila_atendimento";
    chamado.linhaDoTempo = chamado.linhaDoTempo || [];
    chamado.linhaDoTempo.push({
      titulo: modo === "manual" ? "Técnico atribuído manualmente" : "Distribuído automaticamente",
      detalhe:
        modo === "manual"
          ? `${tecnico.equipe} · ${tecnico.nome} — atribuído pelo admin`
          : `${tecnico.equipe} · ${tecnico.nome} — regra: especialidade "${this.tagDoAparelho(chamado.aparelho) || "-"}"`,
      quando: "agora",
    });
    return this.salvarChamado(chamado);
  },

  // Passo seguinte ao "na fila": o técnico (no painel dele) ou o admin
  // marca que já está a caminho do endereço do chamado.
  marcarEmRota(chamado) {
    if (chamado.status !== "fila_atendimento") return chamado;
    chamado.status = "em_rota";
    chamado.linhaDoTempo = chamado.linhaDoTempo || [];
    chamado.linhaDoTempo.push({ titulo: "Técnico a caminho", detalhe: "", quando: "agora" });
    return this.salvarChamado(chamado);
  },

  listarChamadosDoTecnico(tecnicoId) {
    return this.listarChamados().filter((c) => c.tecnicoId === tecnicoId);
  },

  listarChamadosDoCliente(clienteId) {
    return this.listarChamados().filter((c) => c.clienteId === clienteId);
  },

  // Técnico manda o orçamento depois da visita, daí o chamado fica
  // esperando o cliente aprovar (tela chamado-acompanhar.html).
  enviarOrcamento(chamado, itens) {
    const total = itens.reduce((soma, item) => soma + (Number(item.valor) || 0), 0);
    chamado.orcamento = { itens, total };
    chamado.status = "aguardando_cliente";
    chamado.linhaDoTempo = chamado.linhaDoTempo || [];
    chamado.linhaDoTempo.push({
      titulo: `Orçamento enviado · R$ ${total}`,
      detalhe: "Link por WhatsApp",
      quando: "agora",
    });
    return this.salvarChamado(chamado);
  },

  // Cliente aprova o orçamento (tela chamado-acompanhar.html), mas o
  // conserto em si ainda não rolou. Só vira "concluído" quando o
  // técnico confirmar o reparo lá no painel dele.
  aprovarOrcamento(chamado) {
    if (chamado.status !== "aguardando_cliente") return chamado;
    chamado.status = "em_reparo";
    chamado.linhaDoTempo = chamado.linhaDoTempo || [];
    chamado.linhaDoTempo.push({ titulo: "Orçamento aprovado pelo cliente", detalhe: "", quando: "agora" });
    return this.salvarChamado(chamado);
  },

  // Último passo do técnico: confirma que o reparo foi feito. Só
  // depois disso o chamado conta como concluído de verdade.
  concluirReparo(chamado) {
    if (chamado.status !== "em_reparo") return chamado;
    chamado.status = "concluido";
    chamado.linhaDoTempo = chamado.linhaDoTempo || [];
    chamado.linhaDoTempo.push({
      titulo: "Reparo concluído",
      detalhe: "Garantia de 90 dias a partir de hoje.",
      quando: "agora",
    });
    return this.salvarChamado(chamado);
  },

  // ---------- dados de exemplo ----------
  // Só roda uma vez: se já existe algo salvo, não mexe no que o
  // usuário criou. Isso deixa o painel admin e o login com dados
  // pra mostrar assim que a pessoa abre o site pela primeira vez.
  semear() {
    if (this.listarUsuarios().length > 0) return;

    this.salvarEmpresa({
      nomeFantasia: "TecnoLar Assistência",
      cnpj: "12.345.678/0001-00",
      cidade: "rio-de-janeiro",
    });

    const admin = this.salvarUsuario({
      tipo: "admin",
      nome: "Administradora TecnoLar",
      login: "gestor",
      email: "admin@tecnolar.com.br",
      senha: "gestores",
      cpf: "123.456.789-09",
      telefone: "(+55)21-90000099",
      cidade: "Rio de Janeiro",
      uf: "RJ",
    });

    const tecnico1 = this.salvarUsuario({
      tipo: "tecnico",
      nome: "Leonardo Martins",
      login: "leotec",
      email: "leo@tecnolar.com.br",
      senha: "tecnicos",
      cpf: "222.333.444-05",
      telefone: "(+55)21-90000001",
      cidade: "Rio de Janeiro",
      uf: "RJ",
      status: "aprovado",
      equipe: "Norte-2",
      bairros: ["Aparecida", "Vila Nova"],
      especialidades: ["refrigeração"],
    });

    const tecnico2 = this.salvarUsuario({
      tipo: "tecnico",
      nome: "Bruno Costa Teixeira",
      login: "brunot",
      email: "bruno@tecnolar.com.br",
      senha: "tecnicos",
      cpf: "333.444.555-08",
      telefone: "(+55)21-90000002",
      cidade: "Rio de Janeiro",
      uf: "RJ",
      status: "aprovado",
      equipe: "Leste-1",
      bairros: ["Palmeiras"],
      especialidades: ["cocção", "gás"],
    });

    // Técnico generalista, atende qualquer especialidade. Serve de
    // "curinga" quando ninguém mais bate com o aparelho do chamado.
    const tecnico3 = this.salvarUsuario({
      tipo: "tecnico",
      nome: "Rita Ferreira Souza",
      login: "ritafe",
      email: "rita@tecnolar.com.br",
      senha: "tecnicos",
      cpf: "444.555.666-19",
      telefone: "(+55)21-90000003",
      cidade: "Rio de Janeiro",
      uf: "RJ",
      status: "aprovado",
      equipe: "Sul-2",
      bairros: ["Boa Vista"],
      especialidades: ["refrigeração", "gás", "cocção", "lavanderia", "climatização"],
    });

    const cliente = this.salvarUsuario({
      tipo: "cliente",
      nome: "Ricardo Dias Pereira",
      login: "ricard",
      email: "cliente@exemplo.com",
      senha: "clientes",
      cpf: "987.654.321-00",
      telefone: "(+55)21-90000000",
      cidade: "Rio de Janeiro",
      uf: "RJ",
      endereco: "R. das Palmeiras, 120 — Leste",
    });

    const cliente2 = this.salvarUsuario({
      tipo: "cliente",
      nome: "Fernanda Souza Lima",
      login: "fernan",
      email: "cliente2@exemplo.com",
      senha: "clientes",
      cpf: "111.222.333-96",
      telefone: "(+55)21-90000011",
      cidade: "Rio de Janeiro",
      uf: "RJ",
      endereco: "Av. Central, 900 — Vila Nova",
    });

    this.salvarChamado({
      numero: 4816,
      clienteId: cliente.id,
      aparelho: "Cooktop Fischer 4 bocas",
      defeito: "Não acende nenhuma boca",
      garantia: "nao",
      urgencia: "normal",
      endereco: "R. das Palmeiras, 120 — Leste",
      data: "2026-08-22",
      horario: "10:00 – 12:00",
      equipe: "Leste-1",
      tecnicoId: tecnico2.id,
      status: "aguardando_cliente",
      orcamento: {
        itens: [
          { descricao: "Placa de ignição (peça original)", valor: 210 },
          { descricao: "Mão de obra", valor: 170 },
        ],
        total: 380,
      },
      linhaDoTempo: [
        { titulo: "Chamado criado", detalhe: 'Defeito relatado: "não acende nenhuma boca"', quando: "22/08 10:12" },
        { titulo: "Distribuído automaticamente", detalhe: "Leste-1 · Bruno T. — regra: bairro Palmeiras + tag \"cocção\"", quando: "22/08 10:13" },
        { titulo: "Aceito pelo técnico", detalhe: "", quando: "22/08 10:41" },
        { titulo: "Visita realizada · checklist 8/8", detalhe: "Diagnóstico: placa de ignição queimada", quando: "23/08 14:20" },
        { titulo: "Orçamento enviado · R$ 380", detalhe: "Link por WhatsApp · sem visualização há 3h", quando: "23/08 15:02" },
      ],
    });

    this.salvarChamado({
      numero: 4821,
      clienteId: cliente.id,
      aparelho: "Geladeira Brastemp BRM45",
      defeito: "não gela, urgência alta",
      garantia: "nao",
      urgencia: "urgente",
      endereco: "Norte · Aparecida",
      data: "2026-08-24",
      horario: "",
      equipe: "Norte-2",
      tecnicoId: null,
      status: "novo",
      orcamento: null,
      linhaDoTempo: [
        { titulo: "Chamado criado", detalhe: "não gela, urgência alta", quando: "24/08" },
      ],
    });

    // Técnico já foi distribuído mas ainda não marcou "a caminho".
    // Mostra esse passo que falta (sair pra visita) e, depois, o
    // de mandar o orçamento, que é quando o cliente passa a ter
    // algo pra aprovar.
    this.salvarChamado({
      numero: 4822,
      clienteId: cliente.id,
      aparelho: "Geladeira Brastemp BRM45",
      defeito: "não gela direito",
      garantia: "nao",
      urgencia: "normal",
      endereco: "R. das Palmeiras, 120 — Leste",
      data: "2026-08-26",
      horario: "08:00 – 12:00",
      equipe: "Norte-2",
      tecnicoId: tecnico1.id,
      status: "fila_atendimento",
      orcamento: null,
      linhaDoTempo: [
        { titulo: "Chamado criado", detalhe: "não gela direito", quando: "26/08" },
        { titulo: "Distribuído automaticamente", detalhe: "Norte-2 · Leonardo M. — regra: especialidade \"refrigeração\"", quando: "26/08" },
      ],
    });

    this.salvarChamado({
      numero: 4820,
      clienteId: cliente2.id,
      aparelho: "Lava-roupas LG VC4",
      defeito: "vaza água na centrifugação",
      garantia: "nao",
      urgencia: "normal",
      endereco: "Av. Central, 900 — Vila Nova",
      bairro: "Boa Vista",
      data: "2026-08-24",
      horario: "14:30",
      equipe: "Sul-2",
      tecnicoId: tecnico3.id,
      status: "em_rota",
      orcamento: null,
      linhaDoTempo: [
        { titulo: "Chamado criado", detalhe: "vaza água na centrifugação", quando: "24/08" },
        { titulo: "Distribuído automaticamente", detalhe: "Sul-2 · Rita F. — regra: especialidade \"lavanderia\"", quando: "24/08" },
        { titulo: "Técnico a caminho", detalhe: "chegada prevista 14:30", quando: "24/08" },
      ],
    });
  },
};

TecnolarDB.semear();

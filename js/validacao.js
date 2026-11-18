/* ==========================================================
   TECNOLAR: validações e máscaras compartilhadas

   Funções puras de validação (usadas nos 3 formulários de
   cadastro) mais o helper de busca de endereço pelo ViaCEP,
   que antes tava duplicado em cada um. Nada aqui depende de
   uma página específica, cada formulário chama o que precisar.
   ========================================================== */

const TecnolarValidacao = {
  // ---------- nome ----------
  // Só letras (com acento) e espaço, entre 15 e 80 caracteres.
  nomeValido(nome) {
    return /^[A-Za-zÀ-ÖØ-öø-ÿ\s]{15,80}$/.test((nome || "").trim());
  },

  // ---------- CPF ----------
  aplicarMascaraCpf(valor) {
    const d = valor.replace(/\D/g, "").slice(0, 11);
    return d
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1-$2");
  },

  // Algoritmo oficial do dígito verificador do CPF (módulo 11).
  cpfValido(cpf) {
    const numeros = (cpf || "").replace(/\D/g, "");
    if (numeros.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(numeros)) return false; // 111.111.111-11 etc.

    const calcularDigito = (base) => {
      let soma = 0;
      let peso = base.length + 1;
      for (const digito of base) {
        soma += Number(digito) * peso;
        peso--;
      }
      const resto = soma % 11;
      return resto < 2 ? 0 : 11 - resto;
    };

    const nove = numeros.slice(0, 9);
    const digito1 = calcularDigito(nove);
    const digito2 = calcularDigito(nove + digito1);

    return numeros === nove + String(digito1) + String(digito2);
  },

  // ---------- telefone ----------
  // Formato pedido: (+55)XX-XXXXXXXX, 2 dígitos de DDD + 8 do número.
  aplicarMascaraTelefone(valor) {
    const d = valor.replace(/\D/g, "").slice(0, 10);
    if (d.length <= 2) return d.length ? `(+55)${d}` : "";
    return `(+55)${d.slice(0, 2)}-${d.slice(2)}`;
  },

  telefoneValido(telefone) {
    return /^\(\+55\)\d{2}-\d{8}$/.test((telefone || "").trim());
  },

  // ---------- login ----------
  loginValido(login) {
    return /^[A-Za-zÀ-ÖØ-öø-ÿ]{6}$/.test((login || "").trim());
  },

  // ---------- senha ----------
  // Exatamente 8 caracteres, só letras (sem número ou símbolo).
  senhaValida(senha) {
    return /^[A-Za-zÀ-ÖØ-öø-ÿ]{8}$/.test(senha || "");
  },

  // ---------- CEP / ViaCEP ----------
  aplicarMascaraCep(valor) {
    const d = valor.replace(/\D/g, "").slice(0, 8);
    return d.replace(/^(\d{5})(\d)/, "$1-$2");
  },

  // Busca o endereço pelo CEP e preenche os campos passados.
  // `campos` é um objeto com os elementos: { rua, bairro, cidade, uf, status }.
  async buscarEnderecoPorCep(cep, campos) {
    const cepLimpo = (cep || "").replace(/\D/g, "");
    if (cepLimpo.length !== 8) return;

    if (campos.status) campos.status.textContent = "Buscando endereço...";
    try {
      const resposta = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const dados = await resposta.json();

      if (dados.erro) {
        if (campos.status) campos.status.textContent = "CEP não encontrado — preencha o endereço manualmente.";
        return;
      }

      if (campos.rua) campos.rua.value = dados.logradouro || "";
      if (campos.bairro) campos.bairro.value = dados.bairro || "";
      if (campos.cidade) campos.cidade.value = dados.localidade || "";
      if (campos.uf) campos.uf.value = dados.uf || "";
      if (campos.status) campos.status.textContent = "Endereço encontrado pelo CEP.";
    } catch (erro) {
      if (campos.status) campos.status.textContent = "Não deu pra consultar o CEP agora — preencha o endereço manualmente.";
    }
  },
};

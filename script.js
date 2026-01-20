// Configurações
const CONFIG = {
    quadras: 5,
    horariosDisponiveis: [
        '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
        '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
        '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
        '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
        '20:00', '20:30', '21:00', '21:30', '22:00', '22:15'
    ],
    storageKey: 'bravaQuadrasReservas'
};

// Estado global
let estadoAtual = {
    dataSelecionada: new Date().toISOString().split('T')[0],
    quadraSelecionada: null,
    horarioSelecionado: null,
    reservaEditando: null,
    reservas: carregarReservas()
};

// ==================== INICIALIZAÇÃO ====================
document.addEventListener('DOMContentLoaded', () => {
    const hoje = new Date().toISOString().split('T')[0];
    document.getElementById('datePicker').value = hoje;
    document.getElementById('datePicker').min = hoje;
    
    inicializarEventosDates();
    renderizarQuadras();
    atualizarResumo();
});

// ==================== STORAGE (LocalStorage) ====================
function carregarReservas() {
    try {
        const dados = localStorage.getItem(CONFIG.storageKey);
        return dados ? JSON.parse(dados) : {};
    } catch (e) {
        console.error('Erro ao carregar reservas:', e);
        return {};
    }
}

function salvarReservas() {
    try {
        localStorage.setItem(CONFIG.storageKey, JSON.stringify(estadoAtual.reservas));
    } catch (e) {
        console.error('Erro ao salvar reservas:', e);
        alert('Erro ao salvar dados!');
    }
}

// ==================== EVENTOS ====================
function inicializarEventosDates() {
    document.getElementById('datePicker').addEventListener('change', (e) => {
        estadoAtual.dataSelecionada = e.target.value;
        renderizarQuadras();
    });
}

// Modal
const modal = document.getElementById('reservaModal');
const closeBtn = document.querySelector('.close');

closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
    limparFormulario();
});

window.addEventListener('click', (event) => {
    if (event.target === modal) {
        modal.style.display = 'none';
        limparFormulario();
    }
});

// Formulário
document.getElementById('reservaForm').addEventListener('submit', (e) => {
    e.preventDefault();
    salvarReserva();
});

// ==================== RENDERIZAÇÃO ====================
function renderizarQuadras() {
    const container = document.getElementById('quadrasGrid');
    container.innerHTML = '';

    for (let i = 1; i <= CONFIG.quadras; i++) {
        const quadraDiv = criarCardQuadra(i);
        container.appendChild(quadraDiv);
    }
}

function criarCardQuadra(numeroQuadra) {
    const card = document.createElement('div');
    card.className = 'quadra-card';
    
    const header = document.createElement('div');
    header.className = 'quadra-header';
    header.textContent = `Quadra ${numeroQuadra}`;
    
    const horariosDiv = document.createElement('div');
    horariosDiv.className = 'horarios-grid';
    
    CONFIG.horariosDisponiveis.forEach(horario => {
        const slot = criarSlotHorario(numeroQuadra, horario);
        horariosDiv.appendChild(slot);
    });
    
    card.appendChild(header);
    card.appendChild(horariosDiv);
    
    return card;
}

function criarSlotHorario(numeroQuadra, horario) {
    const slot = document.createElement('div');
    
    // Verifica se há alguma reserva que cobre este horário
    const reservaCobrindo = verificarReservaNoHorario(numeroQuadra, horario);
    const estaReservado = reservaCobrindo !== null;
    
    slot.className = `horario-slot ${estaReservado ? 'reservado' : 'disponivel'}`;
    slot.textContent = horario;
    slot.dataset.quadra = numeroQuadra;
    slot.dataset.horario = horario;
    
    slot.addEventListener('click', () => {
        if (!estaReservado) {
            abrirModalReserva(numeroQuadra, horario);
        } else {
            // Abre o modal para editar a reserva que começa neste horário
            abrirModalEdicaoReserva(numeroQuadra, reservaCobrindo.horario, reservaCobrindo);
        }
    });
    
    return slot;
}

// ==================== MODAL ====================
function abrirModalReserva(numeroQuadra, horario) {
    estadoAtual.quadraSelecionada = numeroQuadra;
    estadoAtual.horarioSelecionado = horario;
    estadoAtual.reservaEditando = null;
    
    document.getElementById('modalTitle').textContent = 'Reservar Quadra';
    document.getElementById('modalQuadra').textContent = `Quadra ${numeroQuadra}`;
    document.getElementById('modalData').textContent = formatarData(estadoAtual.dataSelecionada);
    document.getElementById('modalHorario').textContent = `${horario}h`;
    
    document.getElementById('nomeCliente').value = '';
    document.getElementById('telefoneCliente').value = '';
    document.getElementById('duracaoReserva').value = '1';
    
    document.getElementById('btnCancelarReserva').style.display = 'none';
    
    modal.style.display = 'block';
}

function abrirModalEdicaoReserva(numeroQuadra, horario, reserva) {
    estadoAtual.quadraSelecionada = numeroQuadra;
    estadoAtual.horarioSelecionado = horario;
    estadoAtual.reservaEditando = {
        quadra: numeroQuadra,
        horario: horario,
        data: estadoAtual.dataSelecionada
    };
    
    document.getElementById('modalTitle').textContent = 'Editar Reserva';
    document.getElementById('modalQuadra').textContent = `Quadra ${numeroQuadra}`;
    document.getElementById('modalData').textContent = formatarData(estadoAtual.dataSelecionada);
    document.getElementById('modalHorario').textContent = `${horario}h`;
    
    document.getElementById('nomeCliente').value = reserva.cliente;
    document.getElementById('telefoneCliente').value = reserva.telefone || '';
    document.getElementById('duracaoReserva').value = reserva.duracao || '1';
    
    document.getElementById('btnCancelarReserva').style.display = 'block';
    document.getElementById('btnCancelarReserva').onclick = () => cancelarReserva();
    
    modal.style.display = 'block';
}

// ==================== RESERVAS ====================
function salvarReserva() {
    const nome = document.getElementById('nomeCliente').value.trim();
    const telefone = document.getElementById('telefoneCliente').value.trim();
    const duracao = parseFloat(document.getElementById('duracaoReserva').value);
    
    if (!nome) {
        alert('Por favor, insira o nome do cliente!');
        return;
    }
    
    if (estadoAtual.reservaEditando) {
        // Editando reserva existente
        const chaveAntiga = gerarChaveReserva(
            estadoAtual.reservaEditando.quadra,
            estadoAtual.reservaEditando.horario
        );
        
        if (estadoAtual.reservaEditando.quadra !== estadoAtual.quadraSelecionada ||
            estadoAtual.reservaEditando.horario !== estadoAtual.horarioSelecionado) {
            // Mudou de slot
            delete estadoAtual.reservas[chaveAntiga];
        }
    }
    
    const chaveReserva = gerarChaveReserva(estadoAtual.quadraSelecionada, estadoAtual.horarioSelecionado);
    
    estadoAtual.reservas[chaveReserva] = {
        cliente: nome,
        telefone: telefone,
        data: estadoAtual.dataSelecionada,
        quadra: estadoAtual.quadraSelecionada,
        horario: estadoAtual.horarioSelecionado,
        duracao: duracao,
        dataReserva: new Date().toISOString()
    };
    
    salvarReservas();
    renderizarQuadras();
    atualizarResumo();
    
    modal.style.display = 'none';
    limparFormulario();
    
    alert('Reserva salva com sucesso!');
}

function cancelarReserva() {
    if (!confirm('Tem certeza que deseja cancelar esta reserva?')) {
        return;
    }
    
    const chaveReserva = gerarChaveReserva(
        estadoAtual.reservaEditando.quadra,
        estadoAtual.reservaEditando.horario
    );
    
    delete estadoAtual.reservas[chaveReserva];
    salvarReservas();
    renderizarQuadras();
    atualizarResumo();
    
    modal.style.display = 'none';
    limparFormulario();
    
    alert('Reserva cancelada!');
}

// ==================== RESUMO ====================
function atualizarResumo() {
    const container = document.getElementById('resumoReservas');
    
    const reservasOrdenadas = Object.values(estadoAtual.reservas)
        .sort((a, b) => {
            const dataA = new Date(a.data + ' ' + a.horario);
            const dataB = new Date(b.data + ' ' + b.horario);
            return dataA - dataB;
        });
    
    if (reservasOrdenadas.length === 0) {
        container.innerHTML = '<div class="vazio">Nenhuma reserva agendada</div>';
        return;
    }
    
    container.innerHTML = reservasOrdenadas.map(reserva => `
        <div class="resumo-item">
            <div class="resumo-info">
                <h3>Quadra ${reserva.quadra} - ${reserva.horario}h</h3>
                <p><strong>Cliente:</strong> ${reserva.cliente}</p>
                <p><strong>Telefone:</strong> ${reserva.telefone || 'N/A'}</p>
                <p><strong>Data:</strong> ${formatarData(reserva.data)}</p>
                <p><strong>Duração:</strong> ${formatarDuracao(reserva.duracao)}</p>
            </div>
            <div class="resumo-acoes">
                <button class="btn btn-primary btn-small" onclick="editarReservaDoResumo('${reserva.data}', ${reserva.quadra}, '${reserva.horario}')">
                    Editar
                </button>
                <button class="btn btn-danger btn-small" onclick="deletarReservaDoResumo('${reserva.data}', ${reserva.quadra}, '${reserva.horario}')">
                    Deletar
                </button>
            </div>
        </div>
    `).join('');
}

function editarReservaDoResumo(data, quadra, horario) {
    document.getElementById('datePicker').value = data;
    estadoAtual.dataSelecionada = data;
    renderizarQuadras();
    
    setTimeout(() => {
        const chaveReserva = gerarChaveReserva(quadra, horario);
        const reserva = estadoAtual.reservas[chaveReserva];
        if (reserva) {
            abrirModalEdicaoReserva(quadra, horario, reserva);
        }
    }, 100);
}

function deletarReservaDoResumo(data, quadra, horario) {
    if (!confirm('Tem certeza que deseja deletar esta reserva?')) {
        return;
    }
    
    const chaveReserva = gerarChaveReserva(quadra, horario);
    delete estadoAtual.reservas[chaveReserva];
    salvarReservas();
    atualizarResumo();
    renderizarQuadras();
}

// ==================== UTILITÁRIOS ====================
function converterHoraParaMinutos(horario) {
    const [horas, minutos] = horario.split(':').map(Number);
    return horas * 60 + minutos;
}

function converterMinutosParaHora(minutos) {
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    return `${String(horas).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

function obterHorariosCobertos(horarioInicio, duracao) {
    const minutoInicio = converterHoraParaMinutos(horarioInicio);
    const duracaoMinutos = duracao * 60;
    const minutoFim = minutoInicio + duracaoMinutos;
    
    const horariosCobertos = [];
    
    for (let minuto = minutoInicio; minuto < minutoFim; minuto += 30) {
        horariosCobertos.push(converterMinutosParaHora(minuto));
    }
    
    return horariosCobertos;
}

function verificarReservaNoHorario(numeroQuadra, horario) {
    // Verifica se alguma reserva nesta quadra/data cobre este horário
    for (const chave in estadoAtual.reservas) {
        const reserva = estadoAtual.reservas[chave];
        
        // Verifica se é na mesma quadra e data
        if (reserva.quadra !== numeroQuadra || reserva.data !== estadoAtual.dataSelecionada) {
            continue;
        }
        
        // Obtém os horários cobertos por esta reserva
        const horariosCobertos = obterHorariosCobertos(reserva.horario, reserva.duracao);
        
        // Se o horário atual está nos horários cobertos, retorna a reserva
        if (horariosCobertos.includes(horario)) {
            return reserva;
        }
    }
    
    return null;
}

function gerarChaveReserva(quadra, horario) {
    return `${estadoAtual.dataSelecionada}-Q${quadra}-${horario}`;
}

function formatarData(dataString) {
    const [ano, mes, dia] = dataString.split('-');
    return `${dia}/${mes}/${ano}`;
}

function formatarDuracao(duracao) {
    duracao = parseFloat(duracao);
    const horas = Math.floor(duracao);
    const minutos = Math.round((duracao - horas) * 60);
    
    if (horas === 0) {
        return `${minutos} minutos`;
    } else if (minutos === 0) {
        return `${horas}h`;
    } else {
        return `${horas}h ${minutos}min`;
    }
}

function limparFormulario() {
    document.getElementById('reservaForm').reset();
    estadoAtual.quadraSelecionada = null;
    estadoAtual.horarioSelecionado = null;
    estadoAtual.reservaEditando = null;
}

// Exportar/Importar dados (Bonus)
function exportarDados() {
    const dados = JSON.stringify(estadoAtual.reservas, null, 2);
    const blob = new Blob([dados], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reservas-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
}

function limparTodosDados() {
    if (confirm('Tem certeza que deseja deletar TODAS as reservas? Esta ação não pode ser desfeita!')) {
        estadoAtual.reservas = {};
        salvarReservas();
        renderizarQuadras();
        atualizarResumo();
        alert('Todos os dados foram deletados!');
    }
}

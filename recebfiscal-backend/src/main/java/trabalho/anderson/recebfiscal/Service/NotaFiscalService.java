package trabalho.anderson.recebfiscal.Service;

import java.util.List;
import java.math.BigDecimal;
import java.time.LocalDate;


import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import trabalho.anderson.recebfiscal.Model.NotaFiscal;
import trabalho.anderson.recebfiscal.Repository.NotaFiscalRepository;


@Service
@RequiredArgsConstructor
public class NotaFiscalService {

    private final NotaFiscalRepository repository;

    // Cadastrar nota fiscal
    public NotaFiscal salvarNotas(NotaFiscal notaFiscal) {

        if (repository.existsByNumero(notaFiscal.getNumero())) {
            throw new RuntimeException("Já existe uma nota fiscal com esse número");
        }

        return repository.save(notaFiscal);
    }

    // Listar todas as notas
    public List<NotaFiscal> listarNotas() {
        return repository.findAll();
    }

    // Buscar nota por ID
    public NotaFiscal buscarPorId(Long id) {
        return repository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Nota Fiscal não encontrada"));
    }

    // Buscar notas por CPF ou CNPJ
    public List<NotaFiscal> buscarPorCpfCnpj(String cpfCnpj) {
        return repository.findByCpfCnpj(cpfCnpj);
    }

    // Buscar notas por período
    public List<NotaFiscal> buscarPorPeriodo(
            LocalDate dataInicial,
            LocalDate dataFinal) {

        if (dataInicial.isAfter(dataFinal)) {
            throw new RuntimeException("A data inicial não pode ser maior que a data final");
        }

        return repository.findByDataEmissaoBetween(dataInicial, dataFinal);
    }

    // Buscar notas por nome do cliente
    public List<NotaFiscal> buscarPorCliente(String nomeCliente) {
        
        return repository.findByNomeClienteContainingIgnoreCase(nomeCliente);
    }

    // Somar o valor total de todas as notas
    public BigDecimal somarValorNotas() {
        
        return repository.somarValorTotal();
    }

    // Atualizar nota fiscal
    public NotaFiscal atualizar(Long id, NotaFiscal dadosAtualizados) {

        NotaFiscal notaExistente = buscarPorId(id);

        notaExistente.setNumero(dadosAtualizados.getNumero());
        notaExistente.setDataEmissao(dadosAtualizados.getDataEmissao());
        notaExistente.setNomeCliente(dadosAtualizados.getNomeCliente());
        notaExistente.setCpfCnpj(dadosAtualizados.getCpfCnpj());
        notaExistente.setValorTotal(dadosAtualizados.getValorTotal());
        notaExistente.setDescricao(dadosAtualizados.getDescricao());

        return repository.save(notaExistente);
    }

    // Excluir nota fiscal
    public void excluir(Long id) {

        NotaFiscal nota = buscarPorId(id);

        repository.delete(nota);
    }
}

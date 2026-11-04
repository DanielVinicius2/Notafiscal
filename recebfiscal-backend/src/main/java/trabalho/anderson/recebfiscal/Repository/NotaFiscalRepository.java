package trabalho.anderson.recebfiscal.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import trabalho.anderson.recebfiscal.Model.NotaFiscal;

public interface NotaFiscalRepository extends JpaRepository<NotaFiscal, Long> {
        List <NotaFiscal> findByCpfCnpj(String cpf_cnpj);

        // Verificar se já existe uma nota com determinado número
        boolean existsByNumero(String numero);

        // Buscar notas por período de emissão
        List<NotaFiscal> findByDataEmissaoBetween(
            LocalDate dataInicial,
            LocalDate dataFinal
    );

        // Buscar notas pelo nome do cliente
        List<NotaFiscal> findByNomeClienteContainingIgnoreCase(String nomeCliente);

        @Query("SELECT COALESCE(SUM(n.valorTotal), 0) FROM NotaFiscal n")
            BigDecimal somarValorTotal();
}

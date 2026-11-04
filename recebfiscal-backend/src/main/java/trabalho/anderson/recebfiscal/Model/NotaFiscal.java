package trabalho.anderson.recebfiscal.Model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.AccessLevel;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "nota_fiscal")
@Getter
@Setter
@NoArgsConstructor
public class NotaFiscal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Setter(AccessLevel.NONE)
    private Long id;

    @Column(name = "numero", nullable = false, unique = true)
    private String numero;

    @Column(name = "data_emissao", nullable = false)
    private LocalDate dataEmissao;

    @Column(name = "nome_cliente", nullable = false, length = 150)
    private String nomeCliente;

    @Column(name = "cpf_cnpj", nullable = false, length = 18)
    private String cpfCnpj;

    @Column(name = "valor_total", nullable = false, precision = 12, scale = 2)
    private BigDecimal valorTotal;

    @Column(name = "descricao", length = 500)
    private String descricao;
}

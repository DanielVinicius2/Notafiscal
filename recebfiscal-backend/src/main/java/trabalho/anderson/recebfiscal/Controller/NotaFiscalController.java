package trabalho.anderson.recebfiscal.Controller;

import trabalho.anderson.recebfiscal.Model.NotaFiscal;
import trabalho.anderson.recebfiscal.Service.NotaFiscalService;

import lombok.RequiredArgsConstructor;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/notas")
@RequiredArgsConstructor
public class NotaFiscalController {

    private final NotaFiscalService service;

    // Cadastrar nota
    @PostMapping
    public ResponseEntity<NotaFiscal> salvar(@RequestBody NotaFiscal notaFiscal) {
        return ResponseEntity.ok(service.salvarNotas(notaFiscal));
    }

    // Listar todas as notas
    @GetMapping
    public ResponseEntity<List<NotaFiscal>> listar() {
        return ResponseEntity.ok(service.listarNotas());
    }

    // Buscar por ID
    @GetMapping("/{id}")
    public ResponseEntity<NotaFiscal> buscarPorId(@PathVariable Long id) {
        return ResponseEntity.ok(service.buscarPorId(id));
    }

    // Buscar por CPF ou CNPJ
    @GetMapping("/documento/{cpfCnpj}")
    public ResponseEntity<List<NotaFiscal>> buscarPorCpfCnpj(
            @PathVariable String cpfCnpj) {

        return ResponseEntity.ok(service.buscarPorCpfCnpj(cpfCnpj));
    }

    // Buscar por período
    @GetMapping("/periodo")
    public ResponseEntity<List<NotaFiscal>> buscarPorPeriodo(
            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate dataInicial,

            @RequestParam
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate dataFinal) {

        return ResponseEntity.ok(
                service.buscarPorPeriodo(dataInicial, dataFinal)
        );
    }

    // Buscar por cliente
    @GetMapping("/cliente")
    public ResponseEntity<List<NotaFiscal>> buscarPorCliente(
            @RequestParam String nome) {

        return ResponseEntity.ok(service.buscarPorCliente(nome));
    }

    // Somar valores das notas
    @GetMapping("/total")
    public ResponseEntity<BigDecimal> somarValorNotas() {
        return ResponseEntity.ok(service.somarValorNotas());
    }

    // Atualizar nota
    @PutMapping("/{id}")
    public ResponseEntity<NotaFiscal> atualizar(
            @PathVariable Long id,
            @RequestBody NotaFiscal notaFiscal) {

        return ResponseEntity.ok(service.atualizar(id, notaFiscal));
    }

    // Excluir nota
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {

        service.excluir(id);

        return ResponseEntity.noContent().build();
    }
}
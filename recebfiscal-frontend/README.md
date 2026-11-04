# RecebFiscal - Front-end

Interface administrativa feita com HTML, CSS e JavaScript puro para consumir a API RecebFiscal em Spring Boot.

## Funcionalidades

- Dashboard com quantidade de notas, soma dos valores e notas emitidas no mês.
- Listagem de notas fiscais.
- Cadastro, edição e exclusão.
- Pesquisa por CPF/CNPJ ou nome do cliente.
- Filtro por período de emissão.
- Indicador de conexão com a API.

## 1. Pré-requisitos

- API Spring Boot executando em `http://localhost:8080`.
- Navegador atualizado.
- Python instalado para servir os arquivos estáticos (ou a extensão Live Server do VS Code).

## 2. Configurar o endereço da API

Abra `js/api.js` e confira:

```javascript
const API_BASE_URL = "http://localhost:8080/notas";
```

Altere o endereço se sua API utilizar outra porta ou caminho.

## 3. Executar a interface

Não abra o `index.html` diretamente com `file://`. Sirva a pasta por HTTP.

No terminal, dentro da pasta `recebfiscal-frontend`, execute:

```bash
python -m http.server 5500
```

No Windows, se `python` não funcionar, tente:

```bash
py -m http.server 5500
```

Abra no navegador:

`http://localhost:5500`

Alternativa: abra a pasta no VS Code e use a extensão Live Server.

## 4. Habilitar CORS no Spring Boot

Como a interface roda em `localhost:5500` e a API em `localhost:8080`, o navegador considera origens diferentes. Configure CORS no Back-end.

Crie uma classe de configuração dentro do pacote principal da aplicação (ou em um subpacote dele), por exemplo `config/CorsConfig.java`:

```java
package trabalho.anderson.recebfiscal.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig {

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**")
                        .allowedOrigins("http://localhost:5500")
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .allowedHeaders("*");
            }
        };
    }
}
```

Ajuste a linha `package` para o pacote real do seu projeto. Se usar Live Server, confira a porta exibida pela extensão e coloque essa origem no `allowedOrigins`.

Reinicie o Spring Boot após adicionar a configuração.

## 5. Endpoints esperados

O projeto espera estes endpoints, conforme a API construída:

| Método | Endpoint | Uso |
|---|---|---|
| GET | `/notas` | Listar todas |
| POST | `/notas` | Cadastrar |
| GET | `/notas/{id}` | Buscar uma nota |
| PUT | `/notas/{id}` | Atualizar |
| DELETE | `/notas/{id}` | Excluir |
| GET | `/notas/documento/{cpfCnpj}` | Buscar por CPF/CNPJ |
| GET | `/notas/cliente?nome=...` | Buscar por nome |
| GET | `/notas/periodo?dataInicial=AAAA-MM-DD&dataFinal=AAAA-MM-DD` | Buscar por período |
| GET | `/notas/total` | Somar valores |

Os nomes dos campos JSON esperados são: `id`, `numero`, `dataEmissao`, `nomeCliente`, `cpfCnpj`, `valorTotal` e `descricao`.

## 6. Observações

- A pesquisa por nome e documento usa os endpoints específicos da API.
- O filtro por período usa o endpoint `/notas/periodo`.
- O dashboard carrega a lista e consulta `/notas/total`.
- A verificação de duplicidade é responsabilidade do Back-end.
- Em desenvolvimento, o CORS está limitado à origem `http://localhost:5500`. Em produção, configure apenas o domínio real do Front-end.
- Se o seu Controller tiver rotas ou nomes de parâmetros diferentes, ajuste `js/api.js` para corresponder exatamente à API.

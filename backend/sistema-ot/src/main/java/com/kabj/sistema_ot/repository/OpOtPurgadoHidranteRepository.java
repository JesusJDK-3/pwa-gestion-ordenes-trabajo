package com.kabj.sistema_ot.repository;

import com.kabj.sistema_ot.entity.OpOtFormulario;
import com.kabj.sistema_ot.entity.OpOtPurgadoHidrante;
import com.kabj.sistema_ot.entity.OpOrdenTrabajo;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface OpOtPurgadoHidranteRepository extends JpaRepository<OpOtPurgadoHidrante, Long> {

    Optional<OpOtPurgadoHidrante> findByFormulario(OpOtFormulario formulario);

    List<OpOtPurgadoHidrante> findByOrdenTrabajo(OpOrdenTrabajo ordenTrabajo);
}

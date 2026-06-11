package com.kabj.sistema_ot.repository;

import com.kabj.sistema_ot.entity.OpOtFormulario;
import com.kabj.sistema_ot.entity.OpOrdenTrabajo;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface OpOtFormularioRepository extends JpaRepository<OpOtFormulario, Long> {

    List<OpOtFormulario> findByOrdenTrabajo(OpOrdenTrabajo ordenTrabajo);

    List<OpOtFormulario> findByOrdenTrabajoAndEstadoFormulario(OpOrdenTrabajo ordenTrabajo, String estadoFormulario);
}

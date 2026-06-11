package com.kabj.sistema_ot.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/config")
public class AppConfigController {

    @Value("${app.validacion-fotos.url:http://45.71.33.77/proyecto_lima/}")
    private String validacionFotosUrl;

    @GetMapping("/public")
    public ResponseEntity<Map<String, String>> configPublica() {
        return ResponseEntity.ok(Map.of(
                "validacionFotosUrl", validacionFotosUrl
        ));
    }
}

package com.kabj.sistema_ot.controller;

import com.kabj.sistema_ot.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private JwtTokenProvider tokenProvider;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> loginRequest) {
        String username = loginRequest.get("username");
        String password = loginRequest.get("password");

        // validación con la BD

        if ("admin".equals(username) && "12345".equals(password)) {
            String token = tokenProvider.generarToken(username);

            Map<String, String> response = new HashMap<>();
            response.put("token", token);
            response.put("type", "Bearer");

            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(401).body("Credenciales incorrectas");
        }
    }
}
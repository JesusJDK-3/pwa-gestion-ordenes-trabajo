package com.kabj.sistema_ot;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.jdbc.autoconfigure.DataSourceAutoConfiguration;

@SpringBootApplication(exclude = {DataSourceAutoConfiguration.class}) // Falta bd
public class SistemaOtApplication {

	public static void main(String[] args) {
		SpringApplication.run(SistemaOtApplication.class, args);
	}

}

package com.movietime.api_gateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsConfigurationSource;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebFluxSecurity
public class SecurityConfig {

    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http,
                                                         CorsConfigurationSource corsConfig) {
        return http
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                .cors(cors -> cors.configurationSource(corsConfig))
                .authorizeExchange(exchanges -> exchanges.anyExchange().permitAll())
                .build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // Allow ALL origins — covers:
        //   - minikube tunnel (127.0.0.1 with random port)
        //   - Docker mode (localhost:80)
        //   - local dev (localhost:3000)
        //   - any other deployment
        config.setAllowedOriginPatterns(List.of("*"));

        config.addAllowedMethod("*");
        config.addAllowedHeader("*");
        config.setAllowCredentials(false); // must be false when using wildcard pattern

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}

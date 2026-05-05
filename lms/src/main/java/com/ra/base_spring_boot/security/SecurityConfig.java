package com.ra.base_spring_boot.security;

import com.ra.base_spring_boot.model.constants.RoleName;
import com.ra.base_spring_boot.security.exception.AccessDenied;
import com.ra.base_spring_boot.security.exception.JwtEntryPoint;
import com.ra.base_spring_boot.security.jwt.JwtTokenFilter;
import com.ra.base_spring_boot.security.principle.MyUserDetailsService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig
{
    private final MyUserDetailsService myUserDetailsService;
    private final JwtEntryPoint jwtEntryPoint;
    private final AccessDenied accessDenied;
    private final JwtTokenFilter jwtTokenFilter;

    @Value("${cors.allowed-origins:http://localhost:3000,http://localhost:5173,http://localhost:8080,https://api.lms-project.com,https://api.hocvienit.id.vn,https://d-gxvncujeka.execute-api.ap-southeast-1.amazonaws.com,https://hocvienit.id.vn,https://www.hocvienit.id.vn}")
    private String allowedOrigins;

    @Value("${cors.allowed-methods:GET,POST,PUT,PATCH,DELETE,OPTIONS}")
    private String allowedMethods;

    @Value("${cors.allowed-headers:*}")
    private String allowedHeaders;

    @Value("${cors.allow-credentials:true}")
    private boolean allowCredentials;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception
    {
        return http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(AbstractHttpConfigurer::disable)
                .authorizeHttpRequests(
                        url -> url
                                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                                .requestMatchers("/actuator/**", "/api/v1/actuator/**").permitAll()
                                .requestMatchers(
                                        "/auth/**",
                                        "/api/v1/auth/**"
                                ).permitAll()
                                .requestMatchers(
                                        "/public/**",
                                        "/api/v1/public/**"
                                ).permitAll()

                                .requestMatchers("/ws/**").permitAll()

                                .requestMatchers("/auth/me", "/api/v1/auth/me").authenticated() // Đã sửa và thêm prefix
                                .requestMatchers("/admin/**").hasAnyAuthority(
                                        RoleName.ROLE_ADMIN.toString(),
                                        RoleName.ROLE_MODERATOR.toString())
                                .requestMatchers("/admin/students/**").hasAuthority(RoleName.ROLE_ADMIN.toString())
                                .requestMatchers("/admin/classes/**").hasAnyAuthority(
                                        RoleName.ROLE_ADMIN.toString(),
                                        RoleName.ROLE_MODERATOR.toString())
                                .requestMatchers("/moderator/**").hasAnyAuthority(
                                        RoleName.ROLE_ADMIN.toString(),
                                        RoleName.ROLE_MODERATOR.toString())
                                .requestMatchers("/instructor/**").hasAnyAuthority(
                                        RoleName.ROLE_ADMIN.toString(),
                                        RoleName.ROLE_MODERATOR.toString(),
                                        RoleName.ROLE_USER.toString())
                                .requestMatchers("/exams/**").hasAnyAuthority(
                                        RoleName.ROLE_ADMIN.toString(),
                                        RoleName.ROLE_MODERATOR.toString(),
                                        RoleName.ROLE_USER.toString())
                                .requestMatchers(HttpMethod.GET, "/forum/topics").permitAll()
                                .requestMatchers(HttpMethod.GET, "/forum/topics/*").permitAll()
                                .requestMatchers(HttpMethod.GET, "/forum/classes/*/topics").permitAll()
                                .requestMatchers(HttpMethod.GET, "/forum/search").permitAll()
                                .requestMatchers(HttpMethod.GET, "/forum/posts/like-status").permitAll()
                                .requestMatchers(HttpMethod.POST, "/forum/reports").authenticated()
                                .requestMatchers("/forum/reports/**").hasAnyAuthority(
                                        RoleName.ROLE_ADMIN.toString(),
                                        RoleName.ROLE_MODERATOR.toString()
                                )
                                .requestMatchers("/forum/**").authenticated()
                                .requestMatchers("/user/**").hasAuthority(RoleName.ROLE_USER.toString())
                                .requestMatchers(HttpMethod.GET, "/posts/**").hasAnyAuthority(
                                        RoleName.ROLE_USER.toString(),
                                        RoleName.ROLE_ADMIN.toString(),
                                        RoleName.ROLE_MODERATOR.toString()
                                )
                                .requestMatchers(HttpMethod.POST, "/posts/**").hasAnyAuthority(
                                        RoleName.ROLE_ADMIN.toString(),
                                        RoleName.ROLE_MODERATOR.toString()
                                )
                                .requestMatchers(HttpMethod.PUT, "/posts/**").hasAnyAuthority(
                                        RoleName.ROLE_ADMIN.toString(),
                                        RoleName.ROLE_MODERATOR.toString()
                                )
                                .requestMatchers(HttpMethod.DELETE, "/posts/**").hasAnyAuthority(
                                        RoleName.ROLE_ADMIN.toString(),
                                        RoleName.ROLE_MODERATOR.toString()
                                )
                                .requestMatchers(HttpMethod.GET, "/teachers/**").hasAnyAuthority(
                                        RoleName.ROLE_ADMIN.toString(),
                                        RoleName.ROLE_MODERATOR.toString()
                                )
                                .requestMatchers(HttpMethod.POST, "/teachers/**").hasAnyAuthority(
                                        RoleName.ROLE_ADMIN.toString()
                                )
                                .requestMatchers(HttpMethod.PUT, "/teachers/**").hasAnyAuthority(
                                        RoleName.ROLE_ADMIN.toString(),
                                        RoleName.ROLE_MODERATOR.toString()
                                )
                                .requestMatchers(HttpMethod.DELETE, "/teachers/**").hasAnyAuthority(
                                        RoleName.ROLE_ADMIN.toString(),
                                        RoleName.ROLE_MODERATOR.toString()
                                )

                                .requestMatchers("/quiz/submit").hasAnyAuthority(
                                        RoleName.ROLE_USER.toString(),
                                        RoleName.ROLE_ADMIN.toString(),
                                        RoleName.ROLE_MODERATOR.toString()
                                )
                                .requestMatchers("/lessons/*/video/stream").hasAnyAuthority(
                                        RoleName.ROLE_USER.toString(),
                                        RoleName.ROLE_ADMIN.toString(),
                                        RoleName.ROLE_MODERATOR.toString()
                                )
                                .requestMatchers("/lessons/*/video/refresh-url").hasAnyAuthority(
                                        RoleName.ROLE_USER.toString(),
                                        RoleName.ROLE_ADMIN.toString(),
                                        RoleName.ROLE_MODERATOR.toString()
                                )
                                .requestMatchers(HttpMethod.POST, "/lessons/*/questions/submit-and-save").hasAuthority(
                                        RoleName.ROLE_USER.toString()
                                )

                                .requestMatchers(HttpMethod.POST, "/submissions/**").hasAuthority(
                                        RoleName.ROLE_USER.toString()
                                )
                                .requestMatchers(HttpMethod.GET, "/submissions/**").hasAnyAuthority(
                                        RoleName.ROLE_USER.toString(),
                                        RoleName.ROLE_ADMIN.toString(),
                                        RoleName.ROLE_MODERATOR.toString()
                                )

                                .requestMatchers(HttpMethod.GET, "/lessons/**").hasAnyAuthority(
                                        RoleName.ROLE_USER.toString(),
                                        RoleName.ROLE_ADMIN.toString(),
                                        RoleName.ROLE_MODERATOR.toString()
                                )
                                .requestMatchers(HttpMethod.POST, "/lessons/**").hasAnyAuthority(
                                        RoleName.ROLE_ADMIN.toString(),
                                        RoleName.ROLE_MODERATOR.toString()
                                )
                                .requestMatchers(HttpMethod.PUT, "/lessons/**").hasAnyAuthority(
                                        RoleName.ROLE_ADMIN.toString(),
                                        RoleName.ROLE_MODERATOR.toString()
                                )
                                .requestMatchers(HttpMethod.DELETE, "/lessons/**").hasAnyAuthority(
                                        RoleName.ROLE_ADMIN.toString(),
                                        RoleName.ROLE_MODERATOR.toString(),
                                        RoleName.ROLE_USER.toString()
                                )

                                .requestMatchers(HttpMethod.GET, "/timetables/admin/class/**").hasAuthority(
                                        RoleName.ROLE_ADMIN.toString()
                                )
                                .requestMatchers(HttpMethod.GET, "/timetables/instructor/me").hasAnyAuthority(
                                        RoleName.ROLE_MODERATOR.toString(),
                                        RoleName.ROLE_USER.toString()
                                )
                                .requestMatchers(HttpMethod.GET, "/timetables/**").hasAnyAuthority(
                                        RoleName.ROLE_USER.toString(),
                                        RoleName.ROLE_ADMIN.toString(),
                                        RoleName.ROLE_MODERATOR.toString()
                                )
                                .requestMatchers(HttpMethod.POST, "/timetables/**").hasAnyAuthority(
                                        RoleName.ROLE_ADMIN.toString(),
                                        RoleName.ROLE_MODERATOR.toString()
                                )
                                .requestMatchers(HttpMethod.PUT, "/timetables/**").hasAnyAuthority(
                                        RoleName.ROLE_ADMIN.toString(),
                                        RoleName.ROLE_MODERATOR.toString()
                                )
                                .requestMatchers(HttpMethod.DELETE, "/timetables/**").hasAnyAuthority(
                                        RoleName.ROLE_ADMIN.toString(),
                                        RoleName.ROLE_MODERATOR.toString()
                                )

                                .requestMatchers(HttpMethod.GET, "/assignments/**").hasAnyAuthority(
                                        RoleName.ROLE_ADMIN.toString(),
                                        RoleName.ROLE_MODERATOR.toString(),
                                        RoleName.ROLE_USER.toString()
                                )
                                .requestMatchers(HttpMethod.POST, "/assignments/**").hasAnyAuthority(
                                        RoleName.ROLE_ADMIN.toString(),
                                        RoleName.ROLE_MODERATOR.toString()
                                )
                                .requestMatchers(HttpMethod.PUT, "/assignments/**").hasAnyAuthority(
                                        RoleName.ROLE_ADMIN.toString(),
                                        RoleName.ROLE_MODERATOR.toString()
                                )
                                .requestMatchers(HttpMethod.DELETE, "/assignments/**").hasAnyAuthority(
                                        RoleName.ROLE_ADMIN.toString(),
                                        RoleName.ROLE_MODERATOR.toString()
                                )

                                .requestMatchers(HttpMethod.GET, "/attendance/session/**").hasAnyAuthority(
                                        RoleName.ROLE_MODERATOR.toString(),
                                        RoleName.ROLE_USER.toString()
                                )
                                .requestMatchers(HttpMethod.POST, "/attendance/save-batch").hasAnyAuthority(
                                        RoleName.ROLE_MODERATOR.toString(),
                                        RoleName.ROLE_USER.toString()
                                )
                                .requestMatchers(HttpMethod.POST, "/attendance/record").hasAnyAuthority(
                                        RoleName.ROLE_MODERATOR.toString(),
                                        RoleName.ROLE_USER.toString()
                                )
                                .requestMatchers(HttpMethod.GET, "/attendance/class/**").hasAnyAuthority(
                                        RoleName.ROLE_ADMIN.toString(),
                                        RoleName.ROLE_MODERATOR.toString(),
                                        RoleName.ROLE_USER.toString()
                                )

                                .anyRequest().authenticated()
                )
                .authenticationProvider(authenticationProvider())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(
                        exception -> exception
                                .authenticationEntryPoint(jwtEntryPoint)
                                .accessDeniedHandler(accessDenied)
                )
                .addFilterBefore(jwtTokenFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    public PasswordEncoder passwordEncoder()
    {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationProvider authenticationProvider()
    {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setPasswordEncoder(passwordEncoder());
        provider.setUserDetailsService(myUserDetailsService);
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration auth) throws Exception
    {
        return auth.getAuthenticationManager();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        String[] origins = allowedOrigins.split(",");
        for (int i = 0; i < origins.length; i++) {
            origins[i] = origins[i].trim();
        }
        System.out.println("CORS - Allowed Origins: " + List.of(origins));
        config.setAllowedOrigins(List.of(origins));

        String[] methods = allowedMethods.split(",");
        for (int i = 0; i < methods.length; i++) {
            methods[i] = methods[i].trim();
        }
        config.setAllowedMethods(List.of(methods));

        if ("*".equals(allowedHeaders.trim())) {
            config.setAllowedHeaders(List.of(
                    "Authorization",
                    "Content-Type",
                    "Accept",
                    "X-Requested-With",
                    "Cache-Control"
            ));
        } else {
            String[] headers = allowedHeaders.split(",");
            for (int i = 0; i < headers.length; i++) {
                headers[i] = headers[i].trim();
            }
            config.setAllowedHeaders(List.of(headers));
        }

        config.setExposedHeaders(List.of("Authorization", "Content-Type", "X-Total-Count", "X-Page-Number"));
        config.setAllowCredentials(allowCredentials);
        config.setMaxAge(1800L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
package com.ra.base_spring_boot.security.jwt;

import com.ra.base_spring_boot.model.User;
import com.ra.base_spring_boot.repository.IUserRepository;
import com.ra.base_spring_boot.repository.RefreshTokenRepository;
import com.ra.base_spring_boot.security.principle.MyUserDetails;
import com.ra.base_spring_boot.security.principle.MyUserDetailsService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;

@Slf4j
@Component
@RequiredArgsConstructor
public class JwtTokenFilter extends OncePerRequestFilter {
    private final MyUserDetailsService userDetailsService;
    private final JwtProvider jwtProvider;
    private final IUserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String token = getTokenFromRequest(request);
        String requestURI = request.getRequestURI();
        String method = request.getMethod();
        
        log.debug("🔐 JWT Filter - URI: {} {}, Token present: {}", method, requestURI, token != null);
        
        if (token != null) {
            log.debug("🔐 JWT Filter - Processing token for: {} {}", method, requestURI);
            try {
                String username = jwtProvider.extractUsername(token);
                UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                if (jwtProvider.validateToken(token, userDetails)) {
                    MyUserDetails myUser = (MyUserDetails) userDetails;
                    User user = myUser.getUser();

                    // Custom authentication logic: Password change check
                    Instant tokenIssuedAt = jwtProvider.extractIssuedAt(token).toInstant();
                    if (user.getPasswordChangedAt() != null &&
                            tokenIssuedAt.isBefore(user.getPasswordChangedAt().atZone(java.time.ZoneId.systemDefault()).toInstant())) {
                        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                        response.setContentType("application/json");
                        response.getWriter().write("{\"error\": \"Token invalid after password change\"}");
                        return;
                    }

                    // Custom authorization logic: First login check
                    boolean isFirstLogin = Boolean.TRUE.equals(user.getFirstLogin());
                    boolean isAuthEndpoint = requestURI.startsWith("/auth");

                    if (isFirstLogin && !isAuthEndpoint) {
                        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                        response.setContentType("application/json");
                        response.getWriter().write("{\"error\": \"Please change your password before accessing other resources.\"}");
                        return;
                    }

                    Authentication authentication = new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities());
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                }

            } catch (Exception e) {
                log.error("🔐 JWT Authentication Failure for {} {}: {}", method, requestURI, e.getMessage());
                // Attach the exception to the request so JwtEntryPoint can process it.
                request.setAttribute("jakarta.servlet.error.exception", e);
            }
        } else {
            log.debug("🔐 JWT Filter - No token for: {} {}", method, requestURI);
        }

        filterChain.doFilter(request, response);
    }

    private String getTokenFromRequest(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            return header.substring(7);
        }
        return null;
    }
}
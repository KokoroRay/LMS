package com.ra.base_spring_boot.security;

import com.ra.base_spring_boot.model.User;
import com.ra.base_spring_boot.model.constants.RoleName;
import com.ra.base_spring_boot.repository.IUserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class FirstLoginFilter extends OncePerRequestFilter {

    private final IUserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();
        if (path.startsWith("/auth/login") ||
                path.startsWith("/auth/register") ||
                path.startsWith("/auth/change-password") ||
                path.startsWith("/auth/forgot-password") ||
                path.startsWith("/auth/reset-password")) {
            filterChain.doFilter(request, response);
            return;
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && auth.getName() != null) {
            String username = auth.getName();
            User user = userRepository.findByUsername(username).orElse(null);

            if (user != null && Boolean.TRUE.equals(user.getFirstLogin()) &&
                    (user.getRole().getRoleName() == RoleName.ROLE_USER ||
                            user.getRole().getRoleName() == RoleName.ROLE_MODERATOR)) {

                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.setContentType("application/json");
                response.getWriter().write("""
                    {
                        "error": "Please change your password before accessing other resources."
                    }
                """);
                return;
            }
        }

        filterChain.doFilter(request, response);
    }
}
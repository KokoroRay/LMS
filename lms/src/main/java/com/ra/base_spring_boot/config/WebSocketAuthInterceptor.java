package com.ra.base_spring_boot.config;

import com.ra.base_spring_boot.security.jwt.JwtProvider;
import com.ra.base_spring_boot.security.principle.MyUserDetailsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import java.security.Principal;
import java.util.List;

/**
 * Interceptor để validate JWT token khi client kết nối WebSocket
 * Token có thể được gửi qua:
 * 1. Query parameter: ?token=xxx (SockJS info request)
 * 2. STOMP header: token: xxx (khi connect)
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private final JwtProvider jwtProvider;
    private final MyUserDetailsService userDetailsService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        
        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            // Lấy token từ STOMP header
            List<String> tokenList = accessor.getNativeHeader("token");
            String token = tokenList != null && !tokenList.isEmpty() ? tokenList.get(0) : null;
            
            // Nếu không có trong header, thử lấy từ query parameter (đã được set trước đó)
            if (token == null) {
                token = (String) accessor.getSessionAttributes().get("token");
            }
            
            if (token != null) {
                try {
                    // Validate token
                    String username = jwtProvider.extractUsername(token);
                    UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                    
                    if (jwtProvider.validateToken(token, userDetails)) {
                        // Set authentication
                        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                            userDetails, null, userDetails.getAuthorities());
                        accessor.setUser(auth);
                        log.info("WebSocket authenticated user: {}", username);
                    } else {
                        log.warn("Invalid token for WebSocket connection");
                        throw new RuntimeException("Invalid token");
                    }
                } catch (Exception e) {
                    log.error("WebSocket authentication failed: {}", e.getMessage());
                    throw new RuntimeException("Authentication failed", e);
                }
            } else {
                log.warn("No token provided for WebSocket connection");
                // Có thể cho phép kết nối không cần token, hoặc throw exception
                // throw new RuntimeException("Token required");
            }
        }
        
        return message;
    }
}

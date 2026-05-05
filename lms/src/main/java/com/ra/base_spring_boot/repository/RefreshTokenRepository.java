package com.ra.base_spring_boot.repository;

import com.ra.base_spring_boot.model.RefreshToken;
import com.ra.base_spring_boot.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Integer> {

    Optional<RefreshToken> findByRefreshTokenAndRevokedFalse(String refreshToken);

    boolean existsByRefreshTokenAndRevokedFalse(String refreshToken);

    boolean existsByRefreshTokenAndRevokedTrue(String refreshToken);

    @Transactional
    void deleteAllByUser(User user);

    @Transactional
    @Modifying
    @Query("UPDATE RefreshToken r SET r.revoked = true WHERE r.user = :user")
    void revokeAllByUser(@Param("user") User user);

    @Transactional
    @Modifying
    @Query("DELETE FROM RefreshToken r WHERE r.expiresAt < CURRENT_TIMESTAMP")
    void deleteExpiredTokens();
}

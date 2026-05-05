package com.ra.base_spring_boot.model;

import com.ra.base_spring_boot.model.base.BaseObject;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "refresh_tokens")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@AttributeOverride(name = "id", column = @Column(name = "token_id"))
public class RefreshToken extends BaseObject {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, foreignKey = @ForeignKey(name = "fk_rt_user"))
    private User user;

    @Column(name = "refresh_token", nullable = false, length = 512)
    private String refreshToken;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "revoked", nullable = false)
    private Boolean revoked = false;

}

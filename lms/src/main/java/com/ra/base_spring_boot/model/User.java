package com.ra.base_spring_boot.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.ra.base_spring_boot.model.base.BaseObject;
import com.ra.base_spring_boot.model.constants.Gender;
import com.ra.base_spring_boot.model.constants.UserStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.Date;

@Entity
@Table(name = "users")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@AttributeOverride(name = "id", column = @Column(name = "user_id"))
public class User extends BaseObject {

    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    @Column(unique = true, length = 100)
    private String username;

    @Column(unique = true, nullable = false, length = 255)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "first_name", length = 100)
    private String firstName;

    @Column(name = "last_name", length = 100)
    private String lastName;

    @Column(length = 20)
    private String phone;

    @Column(name = "date_of_birth")
    @Temporal(TemporalType.DATE)
    private Date dateOfBirth;

    @Enumerated(EnumType.STRING)
    private Gender gender;

    @Column(name = "avatar_url", length = 255)
    private String avatarUrl;

    @Column(name = "class_name", nullable = true)
    private String className;

    @Enumerated(EnumType.STRING)
    private UserStatus status;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    @JsonIgnore
    private UserProfile profile;

    @Column(name = "first_login")
    private Boolean firstLogin = true;

    @Column(name = "password_changed_at")
    private LocalDateTime passwordChangedAt;


    @Column(name = "reset_password_token", length = 36)
    private String resetPasswordToken;

    @Column(name = "token_expiry_date")
    private LocalDateTime tokenExpiryDate;


    public String getFullName() {
        if (firstName == null && lastName == null) return null;
        if (firstName == null) return lastName;
        if (lastName == null) return firstName;
        return firstName + " " + lastName;
    }

    public boolean isStudent() {
        return role != null && "ROLE_USER".equals(role.getRoleName().name());
    }

    public boolean isActive() {
        return status == UserStatus.ACTIVE;
    }

    public void setProfile(UserProfile profile) {
        this.profile = profile;
        if (profile != null) {
            profile.setUser(this);
        }
    }
}
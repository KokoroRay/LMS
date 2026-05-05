package com.ra.base_spring_boot.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.ra.base_spring_boot.model.base.BaseObject;
import jakarta.persistence.*;
import lombok.*;

import java.util.Date;

@Entity
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
@Table(name = "user_profiles")
@AttributeOverride(name = "id", column = @Column(name = "profile_id"))
public class UserProfile extends BaseObject {

    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    @JsonBackReference
    private User user;

    @Column(name = "student_code", length = 64)
    private String studentCode;

    @Column(name = "teacher_code", length = 50)
    private String teacherCode;

    @Column(name = "class_name", nullable = true, length = 10)
    private String className;

    @Column(length = 255)
    private String address;

    @Column(length = 255)
    private String city;

    @Column(length = 255)
    private String country;

    @Column(length = 255)
    private String occupation;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(name = "last_login")
    @Temporal(TemporalType.TIMESTAMP)
    private Date lastLogin;


    private void validateData() {
        if (this.studentCode != null) {
            this.studentCode = this.studentCode.trim().toUpperCase();
        }
        if (this.teacherCode != null) {
            this.teacherCode = this.teacherCode.trim().toUpperCase();
        }
    }

    public void updateLastLogin() {
        this.lastLogin = new Date();
    }

    public String getFullAddress() {
        StringBuilder sb = new StringBuilder();
        if (address != null) sb.append(address);
        if (city != null) sb.append((sb.length() > 0 ? ", " : "")).append(city);
        if (country != null) sb.append((sb.length() > 0 ? ", " : "")).append(country);
        return sb.length() > 0 ? sb.toString() : null;
    }


}

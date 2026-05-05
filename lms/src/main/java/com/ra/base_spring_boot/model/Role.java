package com.ra.base_spring_boot.model;

import com.ra.base_spring_boot.model.base.BaseObject;
import com.ra.base_spring_boot.model.constants.RoleName;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "roles")
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
@Builder
@AttributeOverride(name = "id", column = @Column(name = "role_id"))
public class Role extends BaseObject
{

    @Column(name = "role_name", nullable = false, unique = true, length = 50)
    @Enumerated(EnumType.STRING)
    private RoleName roleName;
    private String description;
}

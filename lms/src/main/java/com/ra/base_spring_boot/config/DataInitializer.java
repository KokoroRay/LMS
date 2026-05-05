package com.ra.base_spring_boot.config;


import com.ra.base_spring_boot.model.Role;
import com.ra.base_spring_boot.model.constants.RoleName;
import com.ra.base_spring_boot.repository.IRoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final IRoleRepository roleRepositor;


    @Override
    public void run(String... args) throws Exception {
        for (RoleName roleName : RoleName.values()) {
            if(!roleRepositor.existsByRoleName(roleName)) {
                String desc = switch (roleName) {
                    case ROLE_ADMIN -> "System Administrator";
                    case ROLE_MODERATOR -> "Teacher/Moderator";
                    case ROLE_USER -> "Student/User";
                };
                Role role = Role.builder().roleName(roleName).description(desc).build();
                roleRepositor.save(role);
            }
        }
    }
}

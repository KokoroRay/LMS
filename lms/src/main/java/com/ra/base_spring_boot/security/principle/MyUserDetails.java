package com.ra.base_spring_boot.security.principle;

import com.ra.base_spring_boot.model.User;
import com.ra.base_spring_boot.model.constants.UserStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;
import java.util.List;

@NoArgsConstructor
@AllArgsConstructor
@Data
@Builder
public class MyUserDetails implements UserDetails
{
    private User user;
    private Integer id;
    private  String username;
    private String email;
    private String password;
    private String firstName;
    private  String lastName;
    private Collection<? extends GrantedAuthority> authorities;

    public static MyUserDetails build(User user)
    {
        GrantedAuthority authority = new SimpleGrantedAuthority(user.getRole().getRoleName().name());
        return MyUserDetails.builder()
                .user(user)
                .id(user.getId())
                .username(user.getEmail()) // Use email as username for authentication
                .email(user.getEmail())
                .password(user.getPasswordHash())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .authorities(Collections.singletonList(authority))
                .build();
    }

    public String fullName()
    {
        return this.firstName + " " + this.lastName;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities()
    {
        return authorities;
    }

    @Override
    public String getPassword()
    {
        return password;
    }

    @Override
    public String getUsername()
    {
        return username;
    }

    @Override
    public boolean isAccountNonExpired()
    {
        return true;
    }

    @Override
    public boolean isAccountNonLocked()
    {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired()
    {
        return true;
    }

    @Override
    public boolean isEnabled()
    {
        return this.user.getStatus() != UserStatus.INACTIVE;
    }
}

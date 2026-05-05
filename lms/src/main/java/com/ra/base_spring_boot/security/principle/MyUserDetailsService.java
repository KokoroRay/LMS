package com.ra.base_spring_boot.security.principle;

import com.ra.base_spring_boot.model.User;
import com.ra.base_spring_boot.repository.IUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MyUserDetailsService implements UserDetailsService
{
    private final IUserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException
    {
        // Now we treat 'username' parameter as email for login
        User user = userRepository.findByEmail(username).orElseThrow(() -> new UsernameNotFoundException(username + " not found"));

        return MyUserDetails.build(user);
    }
}

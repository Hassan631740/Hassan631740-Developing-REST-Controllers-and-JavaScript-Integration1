package habsida.spring.boot_security.demo.service;

import habsida.spring.boot_security.demo.model.Role;
import org.springframework.security.core.userdetails.User;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
public interface UserService {
    Optional<User> getLoggedInUserByEmail(String email);

    List<User> findAllWithRoles();

    void deleteUserById(Long id);

    List<User> findAllUsers();

    Optional<User> findById(Long id);

    Optional<User> findByUsername(String username);

    Optional<User> findByEmail(String email);

    void saveUser(User user);

    void deleteUser(Long id);

    Set<Role> findAllRoles();

    User findUserById(Long id);

    Optional<Role> findRoleById(Long id);

}
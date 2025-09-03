package habsida.spring.boot_security.demo;

import habsida.spring.boot_security.demo.dto.DataInitializer;
import habsida.spring.boot_security.demo.model.Role;
import habsida.spring.boot_security.demo.model.User;
import habsida.spring.boot_security.demo.repository.RoleRepository;
import habsida.spring.boot_security.demo.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
public class DataInitializerTest {

    @Autowired
    private DataInitializer dataInitializer;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRepository userRepository;

    @Test
    public void testDataInitialization() {
        // This should not throw the detached entity exception
        assertDoesNotThrow(() -> dataInitializer.run());
        
        // Verify roles were created
        assertTrue(roleRepository.findByName("USER").isPresent());
        assertTrue(roleRepository.findByName("ADMIN").isPresent());
        
        // Verify users were created
        assertTrue(userRepository.existsByEmail("admin@gmail.com"));
        assertTrue(userRepository.existsByEmail("user@gmail.com"));
        
        // Verify admin user has both roles
        User admin = userRepository.findByEmail("admin@gmail.com").orElse(null);
        assertNotNull(admin);
        assertTrue(admin.hasRole("ADMIN"));
        assertTrue(admin.hasRole("USER"));
        
        // Verify regular user has only USER role
        User user = userRepository.findByEmail("user@gmail.com").orElse(null);
        assertNotNull(user);
        assertTrue(user.hasRole("USER"));
        assertFalse(user.hasRole("ADMIN"));
    }
} 
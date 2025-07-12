package habsida.spring.boot_security.demo;  // Adjust the package if needed

import model.Role;
import model.User;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import service.UserService;

@SpringBootApplication
@EnableJpaRepositories(basePackages = "repository")
@ComponentScan(basePackages = {"service", "controller", "configs"})  // Add your packages here (e.g., service for UserServiceImpl)
public class SpringBootSecurityDemoApplication {

	public static void main(String[] args) {
		SpringApplication.run(SpringBootSecurityDemoApplication.class, args);
	}

	@Bean
	public CommandLineRunner initData(UserService userService) {
		return args -> {
			// Create roles if not exist
			Role adminRole = new Role();
			adminRole.setName("ROLE_ADMIN");

			Role userRole = new Role();
			userRole.setName("ROLE_USER");

			// Create admin user
			User admin = new User();
			admin.setUsername("admin");
			admin.setEmail("admin@example.com");
			admin.setPassword("admin");  // Will be encoded in UserService
			admin.getRoles().add(adminRole);
			userService.saveUser(admin);

			// Create regular user
			User user = new User();
			user.setUsername("user");
			user.setEmail("user@example.com");
			user.setPassword("user");
			user.getRoles().add(userRole);
			userService.saveUser(user);
		};
	}
}
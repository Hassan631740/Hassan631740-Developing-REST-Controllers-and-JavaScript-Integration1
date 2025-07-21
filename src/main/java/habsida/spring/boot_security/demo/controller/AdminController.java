package habsida.spring.boot_security.demo.controller;

import habsida.spring.boot_security.demo.model.User;
import habsida.spring.boot_security.demo.repository.RoleRepository;
import habsida.spring.boot_security.demo.repository.UserRepository;
import habsida.spring.boot_security.demo.service.UserServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

import java.security.Principal;
@Controller
public class AdminController {
    private final UserServiceImpl userService;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    @Autowired
    public AdminController(UserServiceImpl userService, UserRepository userRepository, RoleRepository roleRepository) {
        this.userService = userService;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
    }

    @GetMapping("/admin")
    public String adminPage(Model model, @AuthenticationPrincipal UserDetails loggedInUser) {
        String email = loggedInUser.getUsername();
        habsida.spring.boot_security.demo.model.User user = userService.findByEmail(email).orElse(null);
        model.addAttribute("user", user);
        model.addAttribute("user", user);
        model.addAttribute("users", userRepository.findAll());
        model.addAttribute("newUser", new User());
        model.addAttribute("allRoles", roleRepository.findAll()); // <- Inject this too
        return "admin";
    }
    @GetMapping
    public String showAdminPage(Model model, Principal principal) {
        String email = principal.getName();
        User admin = userRepository.findByEmail(email).orElseThrow();
        model.addAttribute("adminEmail", admin.getEmail());
        model.addAttribute("adminRoles", admin.getRoles());
        model.addAttribute("users", userRepository.findAll());
        return "admin";
    }
}

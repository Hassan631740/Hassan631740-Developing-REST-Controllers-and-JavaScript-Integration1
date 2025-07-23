package habsida.spring.boot_security.demo.controller;

import habsida.spring.boot_security.demo.model.Role;
import habsida.spring.boot_security.demo.model.User;
import habsida.spring.boot_security.demo.service.RoleService;
import habsida.spring.boot_security.demo.service.UserServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Controller
public class AdminController {

    private final UserServiceImpl userService;
    private final RoleService roleService;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    // constructor
    public AdminController(UserServiceImpl userService, RoleService roleService, PasswordEncoder passwordEncoder) {
        this.userService = userService;
        this.roleService = roleService;
        this.passwordEncoder = passwordEncoder;
    }
    //  Show all users in an admin panel
    @GetMapping("/admin")
    public String adminPage(Model model, @AuthenticationPrincipal UserDetails loggedInUser) {
        List<User> users = userService.findAllWithRoles();
        model.addAttribute("users", users);
        String email = loggedInUser.getUsername();
        User currentUser = userService.findByEmail(email).orElse(null);
        model.addAttribute("loggedInUser", currentUser);
        model.addAttribute("newUser", new User());
        model.addAttribute("allRoles", roleService.findAll());

        return "admin";
    }

    //  Save a new user into the back
    @PostMapping("/api/users")
    public String saveUser(@ModelAttribute("newUser") User user,
                           @RequestParam("roles") List<Long> roleIds,
                           RedirectAttributes redirectAttributes) {
        Set<Role> resolvedRoles = roleIds.stream()
                .map(id -> roleService.findById(id).orElseThrow(() -> new RuntimeException("Role ID not found: " + id)))
                .collect(Collectors.toSet());

        //  Ensure a username is set!
        if (user.getUsername() == null || user.getUsername().isEmpty()) {
            user.setUsername(user.getEmail());
        }
        //  Encode the password
        user.setPassword(passwordEncoder.encode(user.getPassword()));

        user.setRoles(resolvedRoles);
        userService.saveUser(user);

        redirectAttributes.addFlashAttribute("addSuccess", "User added successfully!");
        return "redirect:/admin";
    }

    //  Default login for user
    @GetMapping("/default")
    public String defaultAfterLogin(@AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return "redirect:/admin";
        } else {
            return "redirect:/user";
        }
    }
    //  Delete a user from back
    @PostMapping("/admin/delete/{id}")
    public String deleteUser(@PathVariable Long id, RedirectAttributes redirectAttributes) {
        userService.deleteUser(id);
        redirectAttributes.addFlashAttribute("deleteSuccess", "User deleted successfully!");
        return "redirect:/admin";
    }


    // update user
    @PostMapping("/admin/update")
    public String updateUser(@ModelAttribute User user, @RequestParam("roles") List<Long> roleIds, RedirectAttributes redirectAttributes) {
        Set<Role> roles = roleIds.stream()
                .map(id -> roleService.findById(id).orElseThrow(() -> new RuntimeException("Role not found: " + id)))
                .collect(Collectors.toSet());

        user.setRoles(roles);

        User existing = userService.findUserById(user.getId());
        if (existing != null) {
            // Keep the existing password if not changed
            if (user.getPassword() == null || user.getPassword().isEmpty()) {
                user.setPassword(existing.getPassword());
            } else if (!user.getPassword().startsWith("$2a$")) {
                user.setPassword(passwordEncoder.encode(user.getPassword()));
            }
        }

        userService.saveUser(user);
        redirectAttributes.addFlashAttribute("editSuccess", "User updated successfully!");
        return "redirect:/admin";
    }

}
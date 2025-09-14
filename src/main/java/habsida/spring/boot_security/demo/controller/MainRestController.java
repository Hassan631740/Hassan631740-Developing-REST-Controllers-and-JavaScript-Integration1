package habsida.spring.boot_security.demo.controller;

import habsida.spring.boot_security.demo.model.User;
import habsida.spring.boot_security.demo.service.RoleService;
import habsida.spring.boot_security.demo.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import javax.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Arrays;

@Controller
public class MainRestController {

    private final UserService userService;



    public MainRestController(UserService userService ) {
        this.userService = userService;

    }

    @GetMapping("/")
    public String index() {

        return "index";
    }

    @GetMapping("/admin")
    public String admin() {
        return "redirect:/admin/dashboard";
    }

    @GetMapping("/admin/dashboard")
    public String adminDashboard() {
        return "admin-dashboard";
    }

    @GetMapping("/user")
    public String user() {
        return "user";
    }

    @GetMapping("/user/dashboard")
    public String userDashboard() {
        return "user-dashboard";
    }

    @GetMapping("/user/profile")
    public String userProfile(@AuthenticationPrincipal UserDetails loggedInUser, Model model) {
        // Get current logged in user
        User currentUser = userService.findByEmail(loggedInUser.getUsername()).orElse(null);
        
        // Add user data to model
        model.addAttribute("currentUser", currentUser);
        
        return "user-profile";
    }

    @GetMapping("/login")
    public String login(@RequestParam(value = "error", required = false) String error,
                       HttpServletRequest request,
                       Model model) {
        // Check for session error message
        String sessionError = (String) request.getSession().getAttribute("loginError");
        if (sessionError != null) {
            model.addAttribute("loginError", sessionError);
            // Clear the session error after displaying it
            request.getSession().removeAttribute("loginError");
        }
        return "login";
    }

    @GetMapping("/user/settings")
    public String userSettings(@AuthenticationPrincipal UserDetails loggedInUser, Model model) {
        // Get current logged in user
        User currentUser = userService.findByEmail(loggedInUser.getUsername()).orElse(null);
        
        // Add user data to model
        model.addAttribute("currentUser", currentUser);
        
        return "user-settings";
    }

    @GetMapping("/default")
    public String defaultPage() {
        return "index";
    }

    @GetMapping("/access-denied")
    public String accessDenied() {
        return "403";
    }

    // Handle user addition
    @PostMapping("/admin/users")
    public String addUser(User newUser, @RequestParam("roles") List<Long> roleIds, RedirectAttributes redirectAttributes) {
        try {
            userService.saveUserWithRoles(newUser, roleIds);
            redirectAttributes.addFlashAttribute("addSuccess", "사용자가 성공적으로 추가되었습니다!");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errors", Arrays.asList(e.getMessage()));
        }
        return "redirect:/admin/dashboard";
    }

    // Handle user update
    @PostMapping("/admin/update")
    public String updateUser(@RequestParam Long id,
                           @RequestParam String firstName,
                           @RequestParam String lastName,
                           @RequestParam int age,
                           @RequestParam String email,
                           @RequestParam(required = false) String password,
                           @RequestParam("roleIds") List<Long> roleIds,
                           RedirectAttributes redirectAttributes) {
        try {
            userService.updateUser(id, firstName, lastName, age, email, password, roleIds);
            redirectAttributes.addFlashAttribute("editSuccess", "사용자가 성공적으로 업데이트되었습니다!");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errors", Arrays.asList(e.getMessage()));
        }
        return "redirect:/admin/dashboard";
    }

    // Handle user deletion
    @PostMapping("/admin/delete/{id}")
    public String deleteUser(@PathVariable Long id, RedirectAttributes redirectAttributes) {
        try {
            userService.deleteUser(id);
            redirectAttributes.addFlashAttribute("deleteSuccess", "사용자가 성공적으로 삭제되었습니다!");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("errors", Arrays.asList(e.getMessage()));
        }
        return "redirect:/admin/dashboard";
    }
} 
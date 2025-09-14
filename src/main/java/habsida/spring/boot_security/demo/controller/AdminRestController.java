package habsida.spring.boot_security.demo.controller;

import habsida.spring.boot_security.demo.dto.ApiResponse;
import habsida.spring.boot_security.demo.dto.UserDto;
import habsida.spring.boot_security.demo.dto.RoleDto;
import habsida.spring.boot_security.demo.model.Role;
import habsida.spring.boot_security.demo.model.User;
import habsida.spring.boot_security.demo.service.UserService;
import habsida.spring.boot_security.demo.service.RoleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "*")
public class AdminRestController {

    private final UserService userService;
    private final RoleService roleService;
    private final PasswordEncoder passwordEncoder;


    public AdminRestController(UserService userService, RoleService roleService, PasswordEncoder passwordEncoder) {
        this.userService = userService;
        this.roleService = roleService;
        this.passwordEncoder = passwordEncoder;
    }
    /**
     * Get all users with roles for admin dashboard
     */
    @GetMapping("/users")
    public ResponseEntity<ApiResponse<List<UserDto>>> getAllUsersWithRoles() {
        try {
            List<User> users = userService.findAllWithRoles();
            List<UserDto> userDtos = users.stream()
                    .map(this::convertToDto)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(ApiResponse.success("Users retrieved successfully", userDtos));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error retrieving users: " + e.getMessage()));
        }
    }

    /**
     * Get current logged-in user
     */
    @GetMapping("/current-user")
    public ResponseEntity<ApiResponse<UserDto>> getCurrentUser(@AuthenticationPrincipal UserDetails loggedInUser) {
        try {
            String email = loggedInUser.getUsername();
            Optional<User> currentUser = userService.findByEmail(email);

            if (currentUser.isPresent()) {
                UserDto userDto = convertToDto(currentUser.get());
                return ResponseEntity.ok(ApiResponse.success("Current user retrieved successfully", userDto));
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Current user not found"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error retrieving current user: " + e.getMessage()));
        }
    }

    /**
     * Get all roles
     */
    @GetMapping("/roles")
    public ResponseEntity<ApiResponse<List<RoleDto>>> getAllRoles() {
        try {
            List<Role> roles = roleService.findAll();
            List<RoleDto> roleDtos = roles.stream()
                    .map(this::convertRoleToDto)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(ApiResponse.success("Roles retrieved successfully", roleDtos));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error retrieving roles: " + e.getMessage()));
        }
    }

    /**
     * Create new user
     */
    @PostMapping("/users")
    public ResponseEntity<ApiResponse<UserDto>> createUser(@RequestBody Map<String, Object> request) {
        try {
            if (request.get("firstName") == null || ((String) request.get("firstName")).trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error("First name is required"));
            }
            if (request.get("lastName") == null || ((String) request.get("lastName")).trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error("Last name is required"));
            }
            if (request.get("email") == null || ((String) request.get("email")).trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error("Email is required"));
            }
            if (request.get("password") == null || ((String) request.get("password")).trim().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error("Password is required"));
            }
            if (request.get("age") == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error("Age is required"));
            }
            if (request.get("roleIds") == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error("At least one role is required"));
            }

            String email = (String) request.get("email");
            if (userService.findByEmail(email).isPresent()) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(ApiResponse.error("User already exists with email: " + email));
            }

            User user = new User();
            user.setFirstName((String) request.get("firstName"));
            user.setLastName((String) request.get("lastName"));
            user.setAge((Integer) request.get("age"));
            user.setEmail(email);
            user.setUsername(email);

            // Correctly set and encode password
            String rawPassword = (String) request.get("password");
            user.setPassword(passwordEncoder.encode(rawPassword));

            @SuppressWarnings("unchecked")
            List<?> roleIdsRaw = (List<?>) request.get("roleIds");
            if (roleIdsRaw == null || roleIdsRaw.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error("At least one role must be selected"));
            }

            List<Long> roleIds = roleIdsRaw.stream()
                    .map(roleId -> Long.valueOf(roleId.toString()))
                    .collect(Collectors.toList());

            Set<Role> roles = roleIds.stream()
                    .map(roleId -> roleService.findById(roleId)
                            .orElseThrow(() -> new RuntimeException("Invalid role ID: " + roleId)))
                    .collect(Collectors.toSet());

            user.setRoles(roles);
            userService.saveUser(user);

            UserDto userDto = convertToDto(user);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("User created successfully", userDto));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Failed to create user: " + e.getMessage()));
        }
    }
    /**
     * Update existing user
     */
    @PutMapping("/users/{id}")
    public ResponseEntity<ApiResponse<UserDto>> updateUser(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        try {
            Optional<User> existingUser = userService.findById(id);
            if (!existingUser.isPresent()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("User not found with ID: " + id));
            }

            User user = existingUser.get();

            user.setFirstName((String) request.get("firstName"));
            user.setLastName((String) request.get("lastName"));
            user.setAge((Integer) request.get("age"));
            user.setEmail((String) request.get("email"));
            user.setUsername((String) request.get("email"));

            // Update password only if provided
            String password = (String) request.get("password");
            if (password != null && !password.isEmpty()) {
              user.setPassword(passwordEncoder.encode(password));
            }


            @SuppressWarnings("unchecked")
            List<?> roleIdsRaw = (List<?>) request.get("roleIds");
            if (roleIdsRaw == null || roleIdsRaw.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(ApiResponse.error("At least one role must be selected"));
            }

            // Convert to List<Long> to handle both Integer and Long types
            List<Long> roleIds = roleIdsRaw.stream()
                    .map(roleId -> Long.valueOf(roleId.toString()))
                    .collect(Collectors.toList());

            Set<Role> roles = roleIds.stream()
                    .map(roleId -> roleService.findById(roleId)
                            .orElseThrow(() -> new RuntimeException("Role not found with ID: " + roleId)))
                    .collect(Collectors.toSet());
            user.setRoles(roles);
            userService.saveUser(user);
            UserDto userDto = convertToDto(user);

            return ResponseEntity.ok(ApiResponse.success("User updated successfully", userDto));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Failed to update user: " + e.getMessage()));
        }
    }
    /**
     * Delete user
     */
    @DeleteMapping("/users/{id}")
    public ResponseEntity<ApiResponse<String>> deleteUser(@PathVariable Long id) {
        try {
            Optional<User> user = userService.findById(id);
            if (user.isPresent()) {
                userService.deleteUser(id);
                return ResponseEntity.ok(ApiResponse.success("User deleted successfully", 
                        "User with ID " + id + " has been deleted"));
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("User not found with ID: " + id));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error deleting user: " + e.getMessage()));
        }
    }

    /**
     * Enable user
     */
    @PutMapping("/users/{id}/enable")
    public ResponseEntity<ApiResponse<UserDto>> enableUser(@PathVariable Long id) {
        try {
            Optional<User> userOpt = userService.findById(id);
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                user.setActive(true);
                userService.saveUser(user);
                
                UserDto userDto = convertToDto(user);
                return ResponseEntity.ok(ApiResponse.success("User enabled successfully", userDto));
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("User not found with ID: " + id));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error enabling user: " + e.getMessage()));
        }
    }

    /**
     * Disable user
     */
    @PutMapping("/users/{id}/disable")
    public ResponseEntity<ApiResponse<UserDto>> disableUser(@PathVariable Long id) {
        try {
            Optional<User> userOpt = userService.findById(id);
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                user.setActive(false);
                userService.saveUser(user);
                
                UserDto userDto = convertToDto(user);
                return ResponseEntity.ok(ApiResponse.success("User disabled successfully", userDto));
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("User not found with ID: " + id));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error disabling user: " + e.getMessage()));
        }
    }
    /**
     * Get dashboard statistics
     */
    @GetMapping("/dashboard/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboardStats() {
        try {
            List<User> allUsers = userService.findAllUsers();
            List<Role> allRoles = roleService.findAll();

            long adminCount = allUsers.stream()
                    .filter(user -> user.getRoles().stream().anyMatch(role -> "ADMIN".equals(role.getName())))
                    .count();

            long userCount = allUsers.size() - adminCount;

            Map<String, Object> stats = new HashMap<>();
            stats.put("totalUsers", allUsers.size());
            stats.put("adminUsers", adminCount);
            stats.put("regularUsers", userCount);
            stats.put("totalRoles", allRoles.size());

            return ResponseEntity.ok(ApiResponse.success("Dashboard statistics retrieved successfully", stats));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error retrieving dashboard statistics: " + e.getMessage()));
        }
    }
    /**
     * Convert User entity to UserDto
     */
    private UserDto convertToDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .age(user.getAge())
                .email(user.getEmail())
                .photo(user.getPhoto())
                .photoContentType(user.getPhotoContentType())
                .roles(user.getRoles().stream()
                        .map(Role::getName)
                        .collect(Collectors.toSet()))
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .isActive(user.isActive())
                .build();
    }
    /**
     * Convert Role entity to RoleDto
     */
    private RoleDto convertRoleToDto(Role role) {
        return RoleDto.builder()
                .id(role.getId())
                .name(role.getName())
                .description(role.getDescription())
                .createdAt(role.getCreatedAt())
                .updatedAt(role.getUpdatedAt())
                .build();
    }
}

package habsida.spring.boot_security.demo.controller;

import habsida.spring.boot_security.demo.dto.ApiResponse;
import habsida.spring.boot_security.demo.dto.UserDto;
import habsida.spring.boot_security.demo.model.Role;
import habsida.spring.boot_security.demo.model.User;
import habsida.spring.boot_security.demo.service.UserService;
import javax.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class UserRestController {

    private final UserService userService;
    private final PasswordEncoder passwordEncoder;

    /**
     * Get all users
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<UserDto>>> getAllUsers() {
        try {
            log.info("Fetching all users");
            List<User> users = userService.findAllUsers();
            List<UserDto> userDtos = users.stream()
                    .map(this::convertToDto)
                    .collect(Collectors.toList());
            
            log.info("Successfully retrieved {} users", users.size());
            return ResponseEntity.ok(ApiResponse.success("Users retrieved successfully", userDtos));
        } catch (Exception e) {
            log.error("Error retrieving users: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error retrieving users: " + e.getMessage()));
        }
    }

    /**
     * Get user by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserDto>> getUserById(@PathVariable Long id) {
        try {
            log.info("Fetching user with ID: {}", id);
            Optional<User> user = userService.findById(id);
            
            if (user.isPresent()) {
                UserDto userDto = convertToDto(user.get());
                log.info("Successfully retrieved user with ID: {}", id);
                return ResponseEntity.ok(ApiResponse.success("User retrieved successfully", userDto));
            } else {
                log.warn("User not found with ID: {}", id);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("User not found with ID: " + id));
            }
        } catch (Exception e) {
            log.error("Error retrieving user with ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error retrieving user: " + e.getMessage()));
        }
    }

    /**
     * Create new user
     */
    @PostMapping
    public ResponseEntity<ApiResponse<UserDto>> createUser(@Valid @RequestBody UserDto userDto) {
        try {
            log.info("Creating new user with email: {}", userDto.getEmail());
            
            // Check if user already exists
            if (userService.findByEmail(userDto.getEmail()).isPresent()) {
                log.warn("User already exists with email: {}", userDto.getEmail());
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(ApiResponse.error("User already exists with email: " + userDto.getEmail()));
            }
            
            User user = convertToEntity(userDto);
            userService.saveUser(user);
            UserDto savedUserDto = convertToDto(user);
            
            log.info("Successfully created user with ID: {}", user.getId());
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("User created successfully", savedUserDto));
        } catch (Exception e) {
            log.error("Error creating user: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error creating user: " + e.getMessage()));
        }
    }

    /**
     * Update existing user
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UserDto>> updateUser(@PathVariable Long id, 
                                                          @Valid @RequestBody UserDto userDto) {
        try {
            log.info("Updating user with ID: {}", id);
            Optional<User> existingUser = userService.findById(id);
            
            if (existingUser.isPresent()) {
                User user = existingUser.get();
                
                // Check if email is being changed and if it already exists
                if (!user.getEmail().equals(userDto.getEmail()) && 
                    userService.findByEmail(userDto.getEmail()).isPresent()) {
                    log.warn("Email already exists: {}", userDto.getEmail());
                    return ResponseEntity.status(HttpStatus.CONFLICT)
                            .body(ApiResponse.error("Email already exists: " + userDto.getEmail()));
                }
                
                // Update user fields
                user.setFirstName(userDto.getFirstName());
                user.setLastName(userDto.getLastName());
                user.setAge(userDto.getAge());
                user.setEmail(userDto.getEmail());
                user.setUsername(userDto.getEmail()); // Using email as username
                
                // Update password only if provided
                if (userDto.getPassword() != null && !userDto.getPassword().isEmpty()) {
                    user.setPassword(passwordEncoder.encode(userDto.getPassword()));
                }
                
                userService.saveUser(user);
                UserDto updatedUserDto = convertToDto(user);
                
                log.info("Successfully updated user with ID: {}", id);
                return ResponseEntity.ok(ApiResponse.success("User updated successfully", updatedUserDto));
            } else {
                log.warn("User not found with ID: {}", id);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("User not found with ID: " + id));
            }
        } catch (Exception e) {
            log.error("Error updating user with ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error updating user: " + e.getMessage()));
        }
    }

    /**
     * Delete user
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deleteUser(@PathVariable Long id) {
        try {
            log.info("Deleting user with ID: {}", id);
            Optional<User> user = userService.findById(id);
            
            if (user.isPresent()) {
                userService.deleteUser(id);
                log.info("Successfully deleted user with ID: {}", id);
                return ResponseEntity.ok(ApiResponse.success("User deleted successfully", 
                        "User with ID " + id + " has been deleted"));
            } else {
                log.warn("User not found with ID: {}", id);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("User not found with ID: " + id));
            }
        } catch (Exception e) {
            log.error("Error deleting user with ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error deleting user: " + e.getMessage()));
        }
    }

    /**
     * Get current logged-in user data
     */
    @GetMapping("/current")
    public ResponseEntity<ApiResponse<UserDto>> getCurrentUser(@AuthenticationPrincipal UserDetails loggedInUser) {
        try {
            log.info("Fetching current user data");
            Optional<User> user = userService.findByEmail(loggedInUser.getUsername());
            
            if (user.isPresent()) {
                UserDto userDto = convertToDto(user.get());
                log.info("Successfully retrieved current user data");
                return ResponseEntity.ok(ApiResponse.success("Current user data retrieved successfully", userDto));
            } else {
                log.warn("Current user not found");
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("Current user not found"));
            }
        } catch (Exception e) {
            log.error("Error retrieving current user: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error retrieving current user: " + e.getMessage()));
        }
    }

    /**
     * Get all roles
     */
    @GetMapping("/roles")
    public ResponseEntity<ApiResponse<Set<Role>>> getAllRoles() {
        try {
            log.info("Fetching all roles");
            Set<Role> roles = userService.findAllRoles();
            log.info("Successfully retrieved {} roles", roles.size());
            return ResponseEntity.ok(ApiResponse.success("Roles retrieved successfully", roles));
        } catch (Exception e) {
            log.error("Error retrieving roles: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error retrieving roles: " + e.getMessage()));
        }
    }

    /**
     * Enable user
     */
    @PutMapping("/{id}/enable")
    public ResponseEntity<ApiResponse<UserDto>> enableUser(@PathVariable Long id) {
        try {
            log.info("Enabling user with ID: {}", id);
            Optional<User> userOpt = userService.findById(id);
            
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                user.setActive(true);
                userService.saveUser(user);
                
                UserDto userDto = convertToDto(user);
                log.info("Successfully enabled user with ID: {}", id);
                return ResponseEntity.ok(ApiResponse.success("User enabled successfully", userDto));
            } else {
                log.warn("User not found with ID: {}", id);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("User not found with ID: " + id));
            }
        } catch (Exception e) {
            log.error("Error enabling user with ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error enabling user: " + e.getMessage()));
        }
    }

    /**
     * Disable user
     */
    @PutMapping("/{id}/disable")
    public ResponseEntity<ApiResponse<UserDto>> disableUser(@PathVariable Long id) {
        try {
            log.info("Disabling user with ID: {}", id);
            Optional<User> userOpt = userService.findById(id);
            
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                user.setActive(false);
                userService.saveUser(user);
                
                UserDto userDto = convertToDto(user);
                log.info("Successfully disabled user with ID: {}", id);
                return ResponseEntity.ok(ApiResponse.success("User disabled successfully", userDto));
            } else {
                log.warn("User not found with ID: {}", id);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.error("User not found with ID: " + id));
            }
        } catch (Exception e) {
            log.error("Error disabling user with ID {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error disabling user: " + e.getMessage()));
        }
    }


    /**
     * Handle validation errors
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidationExceptions(
            MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        
        log.warn("Validation errors: {}", errors);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error("Validation failed", errors));
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
     * Convert UserDto to User entity
     */
    private User convertToEntity(UserDto dto) {
        User user = User.builder()
                .firstName(dto.getFirstName())
                .lastName(dto.getLastName())
                .age(dto.getAge())
                .email(dto.getEmail())
                .username(dto.getEmail()) // Using email as username
                .password(passwordEncoder.encode(dto.getPassword()))
                .isActive(true)
                .build();
        
        // Set roles if provided
        if (dto.getRoles() != null && !dto.getRoles().isEmpty()) {
            Set<Role> roles = dto.getRoles().stream()
                    .map(roleName -> {
                        Role role = new Role();
                        role.setName(roleName);
                        return role;
                    })
                    .collect(Collectors.toSet());
            user.setRoles(roles);
        }
        
        return user;
    }
} 
package habsida.spring.boot_security.demo.controller;

import habsida.spring.boot_security.demo.dto.ApiResponse;
import habsida.spring.boot_security.demo.dto.RoleDto;
import habsida.spring.boot_security.demo.model.Role;
import habsida.spring.boot_security.demo.service.RoleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/roles")
@CrossOrigin(origins = "*")
public class RoleRestController {


    private RoleService roleService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<RoleDto>>> getAllRoles() {
        try {
            List<Role> roles = roleService.findAll();
            List<RoleDto> roleDtos = roles.stream()
                    .map(this::convertToDto)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(ApiResponse.success("Roles retrieved successfully", roleDtos));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Error retrieving roles: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<RoleDto>> getRoleById(@PathVariable Long id) {
        try {
            Optional<Role> role = roleService.findById(id);
            if (role.isPresent()) {
                return ResponseEntity.ok(ApiResponse.success("Role retrieved successfully", convertToDto(role.get())));
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Error retrieving role: " + e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<ApiResponse<RoleDto>> createRole(@RequestBody RoleDto roleDto) {
        try {
            Role role = convertToEntity(roleDto);
            roleService.save(role);
            return ResponseEntity.ok(ApiResponse.success("Role created successfully", convertToDto(role)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Error creating role: " + e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<RoleDto>> updateRole(@PathVariable Long id, @RequestBody RoleDto roleDto) {
        try {
            Optional<Role> existingRole = roleService.findById(id);
            if (existingRole.isPresent()) {
                Role role = existingRole.get();
                role.setName(roleDto.getName());
                roleService.save(role);
                return ResponseEntity.ok(ApiResponse.success("Role updated successfully", convertToDto(role)));
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Error updating role: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deleteRole(@PathVariable Long id) {
        try {
            Optional<Role> role = roleService.findById(id);
            if (role.isPresent()) {
                roleService.deleteById(id);
                return ResponseEntity.ok(ApiResponse.success("Role deleted successfully", "Role with ID " + id + " has been deleted"));
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Error deleting role: " + e.getMessage()));
        }
    }

    private RoleDto convertToDto(Role role) {
        RoleDto dto = new RoleDto();
        dto.setId(role.getId());
        dto.setName(role.getName());
        return dto;
    }

    private Role convertToEntity(RoleDto dto) {
        Role role = new Role();
        role.setName(dto.getName());
        return role;
    }
} 
package habsida.spring.boot_security.demo.controller;

import habsida.spring.boot_security.demo.model.Role;

import habsida.spring.boot_security.demo.service.RoleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
@RequestMapping("/admin/roles")
public class RoleController {

    @Autowired
    private RoleService roleService;

    @GetMapping
    public String listRoles(Model model) {
        model.addAttribute("roles", roleService.findAll());
        return "admin/roles";
    }

    @GetMapping("/edit/{id}")
    public String editRole(@PathVariable Long id, Model model) {
        model.addAttribute("role", roleService.findById(id).orElseThrow());
        return "admin/editRole";
    }

    @PostMapping("/update")
    public String updateRole(@ModelAttribute Role role) {
        roleService.save(role);
        return "redirect:/admin/roles";
    }

    @GetMapping("/delete/{id}")
    public String deleteRole(@PathVariable Long id) {
        roleService.deleteById(id);
        return "redirect:/admin/roles";
    }

}
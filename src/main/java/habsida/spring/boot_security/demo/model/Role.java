package habsida.spring.boot_security.demo.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.springframework.security.core.GrantedAuthority;

import java.util.Set;

@Entity
@Table(name = "roles")
@Getter
@Setter
public class Role implements GrantedAuthority {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, name = "NAME")
    private String name;

    @Column(unique = true, name = "USERNAME")
    private String username;

    @ManyToMany(mappedBy = "roles")
    private Set<User> users;

    // Constructors
    public Role() {}

    public Role(String name) {
        this.name = name;
    }

    @Override
    public String getAuthority() {
        return "ROLE_" + name;  // Spring Security expects "ROLE_" prefix
    }

}
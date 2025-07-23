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

    @Column(unique = true)
    private String name;

    public String getName(){
        return name;
    }

    // Optional: A cleaner method to just get the role keyword
    public String getShortName() {
        return name.replace("ROLE_", "");
    }

    @ManyToMany(mappedBy = "roles")
    private Set<User> users;

    // Constructors
    public Role() {}

    public Role(String name) {
        this.name = name;
    }

    @Override
    public String getAuthority() {
        return "ROLE_" + name;
    }

    // toString to help debugging
    @Override
    public String toString() {
        return "[" + name + "]";
    }
}